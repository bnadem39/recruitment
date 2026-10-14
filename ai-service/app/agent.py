"""Agent LangGraph de BFPME Recruit.

Graphe : analyze -> (retrieve | platform | generate)
         retrieve -> (rewrite -> retrieve) | generate

Les dépendances (LLM, recherche, API Spring) sont injectées.
"""

import json
import re
from typing import Callable, Optional, TypedDict

from langgraph.graph import StateGraph, END

MAX_ATTEMPTS = 2
MIN_CHUNKS = 2

# Garde-fou : question sur les offres, sans mention de candidats / profils.
_OFFER_WORDS = re.compile(
    r"\boffres?\b|postes? (ouverts?|publi|disponibles?)|job offers?|vacanc", re.I
)
_CANDIDATE_WORDS = re.compile(
    r"candidat|profil|\bcv\b|compétence|competence|expérience|experience|maîtrise|connaît",
    re.I,
)


def looks_like_offers_question(question: str) -> bool:
    return bool(_OFFER_WORDS.search(question)) and not _CANDIDATE_WORDS.search(question)


def render_matches(data: dict, allowed_refs: set) -> Optional[str]:
    """Classe les candidats EN CODE (le LLM ne fait qu'extraire les preuves)."""
    criteria = [c for c in data.get("criteria", []) if isinstance(c, str) and c.strip()]
    cands = [
        c for c in data.get("candidates", [])
        if isinstance(c, dict) and c.get("ref") in allowed_refs  # anti-hallucination
    ]
    if not criteria or not isinstance(data.get("candidates"), list):
        return None

    def ev(c, k):
        e = (c.get("evidence") or {}).get(k) or {}
        level = e.get("level", "absent")
        proof = (e.get("proof") or "").strip()
        if len(proof) > 120:  # coupe proprement à la fin d'un mot
            proof = proof[:120].rsplit(" ", 1)[0].rstrip(",;:. ") + "…"
        # Garde-fou : une preuve qui parle de « notions » n'est jamais une expérience explicite.
        if level == "explicit" and re.search(r"notions?", proof, re.I):
            level = "notions"
        return level, proof

    def line(c):
        parts = []
        for k in criteria:
            level, proof = ev(c, k)
            if level == "explicit":
                parts.append(f"{k} ({proof})" if proof else k)
            elif level == "notions":
                parts.append(f"notions de {k}")
            else:
                parts.append(f"{k} non mentionné")
        return f"- [{c['ref']}] {c.get('name', '')} : " + " ; ".join(parts) + "."

    full = [c for c in cands if all(ev(c, k)[0] == "explicit" for k in criteria)]
    partial = [
        c for c in cands
        if c not in full and any(ev(c, k)[0] in ("explicit", "notions") for k in criteria)
    ]
    wanted = " et ".join(criteria)
    out = []
    if full:
        out.append("**Candidats correspondant à tous les critères :**")
        out += [line(c) for c in full]
    if partial:
        out.append("**Correspondances partielles (ne satisfont pas tous les critères) :**")
        out += [line(c) for c in partial]
    if full:
        names = ", ".join(c.get("name", c["ref"]) for c in full)
        out.append(f"**Conclusion :** {len(full)} candidat(s) satisfont tous les critères ({wanted}) : {names}.")
    elif partial:
        out.append(f"**Conclusion :** aucun candidat ne confirme tous les critères ({wanted}).")
    else:
        out.append(f"**Conclusion :** aucune candidature indexée ne mentionne : {wanted}.")
    return "\n".join(out)


class AgentState(TypedDict, total=False):
    question: str
    intent: str
    search_query: str
    offer_id: Optional[str]
    chunks: list
    platform_info: str
    attempts: int
    answer: str
    sources: list
    trace: list


def _parse_json(text: str) -> dict:
    """Extrait un objet JSON de la réponse du modèle."""
    match = re.search(r"\{.*\}", text, re.S)
    try:
        return json.loads(match.group(0)) if match else {}
    except json.JSONDecodeError:
        return {}


def build_agent(
    llm: Callable[[str], str],
    search_fn: Callable[[str, Optional[str]], list],
    platform_fn: Optional[Callable[[], str]] = None,
):
    def log(state, message):
        return state.get("trace", []) + [message]

    def analyze(state: AgentState):
        prompt = (
            "Tu es l'assistant RH de la BFPME. Analyse la demande et réponds "
            'UNIQUEMENT en JSON : {"intent": "search_candidates|list_offers|chitchat", '
            '"search_query": "mots-clés du profil recherché", "offer_id": null}\n'
            "- list_offers : la demande porte sur les OFFRES d'emploi / postes ouverts "
            "(ex : « Quelles offres sont ouvertes ? »).\n"
            "- search_candidates : la demande cherche des CANDIDATS ou des profils "
            "(ex : « Qui connaît Spring Boot ? »).\n"
            "- chitchat : salutations ou questions hors recrutement.\n"
            "Conserve toutes les compétences importantes dans search_query. "
            "Si plusieurs compétences sont reliées par ET, garde-les toutes.\n"
            f"Demande : {state['question']}"
        )

        data = _parse_json(llm(prompt))
        intent = data.get("intent", "search_candidates")

        if intent not in ("search_candidates", "list_offers", "chitchat"):
            intent = "search_candidates"

        # Le modèle s'est trompé sur une question d'offres : on corrige.
        if intent != "list_offers" and looks_like_offers_question(state["question"]):
            intent = "list_offers"

        return {
            "intent": intent,
            "search_query": data.get("search_query") or state["question"],
            "offer_id": state.get("offer_id") or data.get("offer_id"),
            "attempts": 0,
            "trace": log(state, f"analyze -> {intent}"),
        }

    def route_after_analyze(state: AgentState):
        if state["intent"] == "list_offers" and platform_fn:
            return "platform"
        if state["intent"] == "chitchat":
            return "generate"
        return "retrieve"

    def retrieve(state: AgentState):
        chunks = search_fn(state["search_query"], state.get("offer_id"))
        attempt = state.get("attempts", 0) + 1
        return {
            "chunks": chunks,
            "attempts": attempt,
            "trace": log(state, f"retrieve #{attempt} -> {len(chunks)} passages"),
        }

    def route_after_retrieve(state: AgentState):
        if (
            len(state.get("chunks", [])) < MIN_CHUNKS
            and state.get("attempts", 0) < MAX_ATTEMPTS
        ):
            return "rewrite"
        return "generate"

    def rewrite(state: AgentState):
        new_query = llm(
            "Elargis cette recherche en conservant impérativement "
            "toutes les compétences demandées. Ne remplace pas une "
            "compétence par une autre. Réponds par la requête seule.\n"
            f"Requête : {state['search_query']}"
        ).strip()

        if not new_query:
            new_query = state["search_query"]

        return {
            "search_query": new_query,
            "trace": log(state, f"rewrite -> {new_query}"),
        }

    def platform(state: AgentState):
        try:
            info = platform_fn() if platform_fn else ""
        except Exception as e:  # API Spring indisponible, 403, etc.
            info = f"(Impossible de lire les offres depuis la plateforme : {e})"
        return {
            "platform_info": info,
            "trace": log(state, "platform (API Spring Boot)"),
        }

    def generate(state: AgentState):
        # --- Question sur les offres : réponse dédiée, sans sources de candidats ---
        if state.get("intent") == "list_offers":
            prompt = (
                "Tu es l'assistant RH de la BFPME. Réponds en français, uniquement à "
                "partir des DONNÉES (offres issues de la plateforme). Liste les offres "
                "ouvertes avec titre, département, lieu et date limite si disponibles. "
                "N'invente rien. Si les données sont vides ou en erreur, dis-le "
                "clairement.\n\n"
                f"DONNÉES :\n{state.get('platform_info') or '(vide)'}\n\n"
                f"QUESTION : {state['question']}"
            )
            return {
                "answer": llm(prompt).strip(),
                "sources": [],
                "trace": log(state, "generate"),
            }

        # --- Recherche de candidats ---
        chunks = state.get("chunks", [])
        retrieved = {chunk.get("metadata", {}).get("source", "?") for chunk in chunks}
        context = "\n\n".join(
            f"[{chunk.get('metadata', {}).get('source', '?')}] {chunk.get('text', '')}"
            for chunk in chunks
        )

        # Étape 1 : le LLM extrait les preuves (JSON) ; le code décide des correspondances.
        def extract(subset):
            ctx = "\n\n".join(
                f"[{c.get('metadata', {}).get('source', '?')}] {c.get('text', '')}"
                for c in subset
            )
            return _parse_json(llm(
                "Tu es l'assistant RH de la BFPME. Extrais les preuves du CONTEXTE pour "
                "répondre à la QUESTION. Réponds UNIQUEMENT en JSON :\n"
                '{"criteria": ["compétence 1", "compétence 2"], "candidates": [{"ref": '
                '"APP-001", "name": "Nom", "evidence": {"compétence 1": {"level": '
                '"explicit|notions|absent", "proof": "extrait court de CE profil"}}}]}\n'
                "RÈGLES : criteria = une entrée par compétence ou critère demandé dans la "
                "question, sous forme de nom court sans verbe ni article (ex : « Spring Boot », "
                "« blockchain »). level = explicit si le profil mentionne explicitement la compétence "
                "(expérience, projets) ; notions si le profil parle de simples notions ou d'une "
                "mention vague ; absent si elle n'est pas mentionnée dans CE profil. proof = "
                "extrait court du profil de CE candidat uniquement. Ne déduis jamais une "
                "compétence depuis le métier et ne copie jamais depuis un autre candidat. "
                "Inclus TOUS les candidats du contexte, avec leur ref exacte.\n\n"
                f"CONTEXTE :\n{ctx}\n\nQUESTION : {state['question']}"
            ))

        if chunks:
            data = extract(chunks)
            if isinstance(data.get("candidates"), list):
                # Complétude : on relance l'extraction sur les candidats que le LLM a omis.
                for _ in range(2):
                    got = {c.get("ref") for c in data["candidates"] if isinstance(c, dict)}
                    missing = [
                        c for c in chunks
                        if c.get("metadata", {}).get("source", "?") not in got
                    ]
                    if not missing:
                        break
                    extra = extract(missing)
                    if not isinstance(extra.get("candidates"), list):
                        break
                    # on n'ajoute que les candidats pas encore présents (pas de doublon)
                    data["candidates"] += [
                        c for c in extra["candidates"]
                        if isinstance(c, dict) and c.get("ref") not in got
                    ]
            rendered = render_matches(data, retrieved)
            if rendered:
                cited = sorted(r for r in retrieved if f"[{r}]" in rendered)
                return {
                    "answer": rendered,
                    "sources": cited,
                    "trace": log(state, "generate (extraction + classement)"),
                }

        # Repli : réponse libre (chitchat, contexte vide ou JSON invalide).
        prompt = (
            "Tu es l'assistant RH de la BFPME. "
            "Réponds en français à partir du CONTEXTE uniquement.\n\n"
            "RÈGLES OBLIGATOIRES :\n"
            "1. Examine chaque candidat individuellement.\n"
            "2. Vérifie chaque compétence demandée séparément.\n"
            "3. Pour une question contenant plusieurs compétences reliées "
            "par « et », un candidat correspond seulement si son propre "
            "profil mentionne explicitement TOUTES ces compétences.\n"
            "4. Ne déduis jamais une compétence à partir du métier, du titre "
            "ou des compétences d'un autre candidat.\n"
            "5. N'invente ni expérience, ni durée, ni diplôme.\n"
            "6. Cite la référence entre crochets, par exemple [APP-001].\n"
            "7. Si aucun profil ne confirme les critères, dis-le clairement.\n\n"
            f"CONTEXTE :\n{context or '(vide)'}\n\n"
            f"QUESTION : {state['question']}"
        )
        answer = llm(prompt).strip()
        cited = sorted(r for r in retrieved if f"[{r}]" in answer)
        return {"answer": answer, "sources": cited, "trace": log(state, "generate")}

    graph = StateGraph(AgentState)

    for name, function in [
        ("analyze", analyze),
        ("retrieve", retrieve),
        ("rewrite", rewrite),
        ("platform", platform),
        ("generate", generate),
    ]:
        graph.add_node(name, function)

    graph.set_entry_point("analyze")

    graph.add_conditional_edges(
        "analyze",
        route_after_analyze,
        {"retrieve": "retrieve", "platform": "platform", "generate": "generate"},
    )
    graph.add_conditional_edges(
        "retrieve",
        route_after_retrieve,
        {"rewrite": "rewrite", "generate": "generate"},
    )
    graph.add_edge("rewrite", "retrieve")
    graph.add_edge("platform", "generate")
    graph.add_edge("generate", END)

    return graph.compile()
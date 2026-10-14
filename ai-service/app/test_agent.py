"""Tests de l'agent avec faux LLM et fausse recherche (sans réseau)."""
import re

from agent import build_agent, looks_like_offers_question
from seed_candidates import CANDIDATES


def fake_search_factory(calls):
    def search(query, offer_id):
        calls.append(query)
        words = {w.lower() for w in query.split()}
        res = []
        for ref, oid, name, text in CANDIDATES:
            if offer_id and oid != offer_id:
                continue
            if words & {w.strip(".,:()").lower() for w in text.split()}:
                res.append({"text": text, "score": .9,
                            "metadata": {"source": ref, "offer_id": oid}})
        return res[:5]
    return search


def make_llm(intent, query):
    def llm(p):
        if "Analyse la demande" in p:
            return f'{{"intent":"{intent}","search_query":"{query}","offer_id":null}}'
        if "Elargis cette recherche" in p:
            return "Spring Boot React"
        # Génération : le faux LLM cite les références présentes dans le contexte
        refs = " ".join(sorted(set(re.findall(r"\[APP-\d+\]", p))))
        return "REPONSE:" + ("CONTEXTE VIDE" if "(vide)" in p else "avec contexte " + refs)
    return llm


def test_search_ok():
    calls = []
    a = build_agent(make_llm("search_candidates", "Spring Boot"), fake_search_factory(calls))
    out = a.invoke({"question": "Qui connaît Spring Boot ?"})
    assert len(calls) == 1 and "APP-001" in out["sources"] and "avec contexte" in out["answer"]


def test_rewrite_when_few_results():
    calls = []
    a = build_agent(make_llm("search_candidates", "blockchain"), fake_search_factory(calls))
    out = a.invoke({"question": "blockchain ?"})
    assert calls == ["blockchain", "Spring Boot React"] and out["sources"]
    assert any("rewrite" in t for t in out["trace"])


def test_stops_after_max_attempts():
    calls = []
    llm = lambda p: (
        '{"intent":"search_candidates","search_query":"zzz"}' if "Analyse la demande" in p
        else "qqq" if "Elargis cette recherche" in p else "ok"
    )
    a = build_agent(llm, fake_search_factory(calls))
    out = a.invoke({"question": "zzz"})
    assert len(calls) == 2 and out["sources"] == []


def test_platform_tool():
    a = build_agent(make_llm("list_offers", ""), fake_search_factory([]),
                    lambda: "Offre: Frontend Developer")
    out = a.invoke({"question": "Quelles offres ?"})
    assert any("platform" in t for t in out["trace"])


def test_offer_filter():
    a = build_agent(make_llm("search_candidates", "crédit"), fake_search_factory([]))
    out = a.invoke({"question": "crédit", "offer_id": "2"})
    assert set(out["sources"]) <= {"APP-005", "APP-006", "APP-007"}


def test_offers_question_misclassified_by_llm_is_corrected():
    a = build_agent(make_llm("search_candidates", "offres"), fake_search_factory([]),
                    lambda: "Offre: Frontend Developer")
    out = a.invoke({"question": "Quelles sont les offres d'emploi ouvertes ?"})
    assert any("platform" in t for t in out["trace"]) and out["sources"] == []


def test_candidate_question_not_hijacked():
    a = build_agent(make_llm("search_candidates", "Spring"), fake_search_factory([]), lambda: "x")
    out = a.invoke({"question": "Quels candidats ont postulé aux offres Java ?"})
    assert not any("platform" in t for t in out["trace"])


def test_platform_failure_is_graceful():
    def boom():
        raise RuntimeError("403")
    a = build_agent(make_llm("list_offers", ""), fake_search_factory([]), boom)
    out = a.invoke({"question": "Quelles offres ?"})
    assert "answer" in out


def test_guard_function():
    assert looks_like_offers_question("Quelles sont les offres d'emploi ouvertes ?")
    assert not looks_like_offers_question("Quels candidats connaissent Spring Boot ?")


# ---- Classement déterministe : le code décide, pas le LLM ----
import json as _json

def structured_llm(evidence_by_ref, criteria):
    def llm(p):
        if "Analyse la demande" in p:
            return '{"intent":"search_candidates","search_query":"Spring Boot","offer_id":null}'
        if "Extrais les preuves" in p:
            cands = [{"ref": r, "name": r, "evidence": ev} for r, ev in evidence_by_ref.items()]
            return _json.dumps({"criteria": criteria, "candidates": cands})
        return "fallback"
    return llm

def E(level, proof=""):
    return {"level": level, "proof": proof}

def test_partial_match_is_never_a_full_match():
    ev = {
        "APP-001": {"Spring Boot": E("explicit", "projets bancaires"), "React": E("explicit", "React TypeScript")},
        "APP-003": {"Spring Boot": E("notions"), "React": E("absent")},
    }
    a = build_agent(structured_llm(ev, ["Spring Boot", "React"]), fake_search_factory([]))
    out = a.invoke({"question": "Spring Boot et React ?"})
    full_part = out["answer"].split("Correspondances partielles")[0]
    assert "[APP-001]" in full_part and "[APP-003]" not in full_part
    assert "1 candidat(s) satisfont" in out["answer"]
    assert "APP-003" in out["sources"]

def test_no_candidate_has_skill():
    ev = {"APP-003": {"blockchain": E("absent")}, "APP-001": {"blockchain": E("absent")}}
    a = build_agent(structured_llm(ev, ["blockchain"]), fake_search_factory([]))
    out = a.invoke({"question": "Spring Boot ?"})
    assert "aucune candidature indexée ne mentionne" in out["answer"]
    assert out["sources"] == []

def test_hallucinated_reference_is_dropped():
    ev = {"APP-999": {"Spring Boot": E("explicit", "inventé")}}
    a = build_agent(structured_llm(ev, ["Spring Boot"]), fake_search_factory([]))
    out = a.invoke({"question": "Spring Boot ?"})
    assert "APP-999" not in out["answer"] and "APP-999" not in out["sources"]


def test_omitted_candidates_are_recovered():
    """Le LLM n'extrait qu'un candidat par appel : l'agent doit relancer pour les autres."""
    ev = {
        "APP-001": {"Spring Boot": E("explicit", "Spring Boot")},
        "APP-003": {"Spring Boot": E("notions")},
        "APP-008": {"Spring Boot": E("explicit", "Spring Boot")},
    }
    def llm(p):
        if "Analyse la demande" in p:
            return '{"intent":"search_candidates","search_query":"Spring Boot","offer_id":null}'
        if "Extrais les preuves" in p:
            ref = re.findall(r"\[(APP-\d+)\]", p.split("CONTEXTE :")[1])[0]
            return _json.dumps({"criteria": ["Spring Boot"],
                                "candidates": [{"ref": ref, "name": ref, "evidence": ev[ref]}]})
        return "fallback"
    out = build_agent(llm, fake_search_factory([])).invoke({"question": "Spring Boot ?"})
    for r in ("APP-001", "APP-003", "APP-008"):
        assert f"[{r}]" in out["answer"]

def test_notions_proof_is_never_explicit():
    ev = {"APP-003": {"Spring Boot": E("explicit", "5 ans en banque. Notions de Spring Boot")}}
    a = build_agent(structured_llm(ev, ["Spring Boot"]), fake_search_factory([]))
    out = a.invoke({"question": "Spring Boot ?"})
    assert "Candidats correspondant à tous les critères" not in out["answer"]
    assert "notions de Spring Boot" in out["answer"]


def test_long_proof_is_cut_at_word_boundary():
    long_proof = "Ingénieur full-stack, 4 ans d'expérience en Java Spring Boot et React TypeScript. Projets bancaires, API REST sécurisées JWT, PostgreSQL, Docker"
    ev = {"APP-001": {"Spring Boot": E("explicit", long_proof)}}
    a = build_agent(structured_llm(ev, ["Spring Boot"]), fake_search_factory([]))
    out = a.invoke({"question": "Spring Boot ?"})
    assert "…" in out["answer"] and "Do)" not in out["answer"] and "PostgreSQL," not in out["answer"].split("…")[0][-3:]
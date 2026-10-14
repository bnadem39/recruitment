import os

import httpx

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")
NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))        # fenêtre de contexte
NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "1500"))  # longueur max de sortie
TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "180"))

_client: httpx.Client | None = None


def get_llm():
    """Retourne une fonction prompt(str) -> str utilisant Ollama en local."""
    global _client
    if _client is None:
        _client = httpx.Client(timeout=TIMEOUT)

    def call(prompt: str) -> str:
        payload = {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "keep_alive": "30m",  # garde le modèle en mémoire entre deux questions
            "options": {
                "temperature": 0,        # réponses reproductibles
                "num_ctx": NUM_CTX,      # sinon le prompt peut être tronqué en silence
                "num_predict": NUM_PREDICT,
            },
        }
        # Les prompts qui exigent du JSON activent le mode JSON d'Ollama.
        if "UNIQUEMENT en JSON" in prompt:
            payload["format"] = "json"

        try:
            response = _client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            response.raise_for_status()
        except httpx.ConnectError:
            raise RuntimeError(f"Ollama injoignable sur {OLLAMA_URL} (service lancé ?)")
        except httpx.ReadTimeout:
            raise RuntimeError("Ollama n'a pas répondu à temps (modèle trop lent ?)")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"Erreur Ollama {e.response.status_code} : {e.response.text[:200]}")
        return response.json()["message"]["content"]

    return call
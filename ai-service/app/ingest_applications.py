"""Ingère les candidatures fictives dans le service RAG : python ingest_applications.py"""
import os
import httpx
from seed_candidates import CANDIDATES

RAG_URL = os.getenv("RAG_URL", "http://localhost:8001")

for ref, offer_id, name, text in CANDIDATES:
    r = httpx.post(f"{RAG_URL}/ingest/text", json={
        "text": f"Candidat : {name}. {text}",
        "metadata": {"source": ref, "data_category": "application",
                     "offer_id": offer_id, "tenant_id": "bfpme", "access_level": "hr"},
    }, timeout=120)
    print(ref, r.status_code, r.json())
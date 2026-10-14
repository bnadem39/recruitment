"""Endpoint /agent/chat à brancher dans main.py :
    from agent_routes import router as agent_router
    app.include_router(agent_router)
"""
import json
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent import build_agent
from llm import get_llm

router = APIRouter()
SPRING_URL = os.getenv("SPRING_URL", "http://host.docker.internal:8080")


class ChatRequest(BaseModel):
    question: str
    offer_id: Optional[str] = None
    jwt: Optional[str] = None  # jeton de l'utilisateur : l'agent agit avec SES droits


@router.post("/agent/chat")
def chat(req: ChatRequest):
    from main import models  # état partagé (embedder + Qdrant)

    if "vs" not in models:
        raise HTTPException(503, "Models still loading")

    def search_fn(query, offer_id):
        chunks = models["vs"].hybrid_search(
            query=query,
            embedder=models["embedder"],
            top_k=20,
            data_category="application",
            access_levels=["hr"],
            min_score=0.0,
        )
        if offer_id:
            chunks = [
                c for c in chunks
                if str(c["metadata"].get("offer_id")) == str(offer_id)
            ]
        return chunks[:10]

    def platform_fn():
        headers = {"Authorization": f"Bearer {req.jwt}"} if req.jwt else {}
        r = httpx.get(f"{SPRING_URL}/api/offers", headers=headers, timeout=15)
        r.raise_for_status()
        try:
            text = json.dumps(r.json(), ensure_ascii=False)
        except ValueError:
            text = r.text
        return text[:6000]

    try:
        agent = build_agent(get_llm(), search_fn, platform_fn)
        out = agent.invoke({"question": req.question, "offer_id": req.offer_id})
        return {
            "answer": out["answer"],
            "sources": out["sources"],
            "trace": out["trace"],
        }
    except Exception as e:
        raise HTTPException(500, str(e))
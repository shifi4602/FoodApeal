"""
semantic_search.py
------------------
Self-contained semantic-search service.
Injected into the FastAPI application via Depends() — never imported circularly.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from openai import OpenAI


class SemanticSearchService:
    """
    Computes OpenAI text-embedding-3-small embeddings and ranks products by
    cosine similarity against a free-text query.

    Production optimisation: product embeddings are cached by product id in an
    instance-level dict.  Because FastAPI injects the same singleton on every
    request (via get_search_service below), the cache survives across calls and
    each product is embedded only once — no matter how many searches are made.
    Only the query embedding is generated fresh per request.
    """

    def __init__(self, client: OpenAI) -> None:
        self._client = client
        # product id → embedding vector; populated lazily on first /search call
        self._cache: dict[int, list[float]] = {}

    # ------------------------------------------------------------------
    # Core helpers
    # ------------------------------------------------------------------

    def get_embedding(self, text: str) -> list[float]:
        """Call OpenAI text-embedding-3-small and return the embedding vector."""
        response = self._client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        """Cosine similarity between two embedding vectors (0.0 – 1.0)."""
        va = np.array(a, dtype=np.float32)
        vb = np.array(b, dtype=np.float32)
        norm = np.linalg.norm(va) * np.linalg.norm(vb)
        return float(np.dot(va, vb) / norm) if norm else 0.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search(self, query: str, products: list[Any], top_k: int = 5) -> list[dict]:
        """
        Score each product against the query and return the top_k results as
        plain dicts (caller converts to the appropriate Pydantic model).

        Each product object must expose: id, name, description, price,
        imageUrl, category.
        """
        if not products or not query.strip():
            return []

        query_vec = self.get_embedding(query)

        scored: list[dict] = []
        for p in products:
            if p.id not in self._cache:
                product_text = f"{p.name} {p.description or ''}".strip()
                self._cache[p.id] = self.get_embedding(product_text)

            score = self.cosine_similarity(query_vec, self._cache[p.id])
            scored.append({
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "description": p.description,
                "imageUrl": p.imageUrl,
                "category": p.category,
                "score": round(score, 4),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

"""Camada de abstração para geração de embeddings.

texto -> embedding -> vetor

Trocar de provedor significa apenas trocar EMBEDDING_PROVIDER no .env;
nenhuma outra parte do código deve chamar um provedor de embeddings
diretamente.
"""
from __future__ import annotations

import hashlib

from app.core.config import Settings


class EmbeddingService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def embed(self, text: str) -> list[float]:
        if self.settings.embedding_provider == "mock":
            return self._mock_embed(text)
        if self.settings.embedding_provider == "openai":
            return self._openai_embed(text)
        if self.settings.embedding_provider == "cohere":
            return self._cohere_embed(text)
        raise ValueError(f"Provedor de embeddings desconhecido: {self.settings.embedding_provider}")

    # --- mock: determinístico, sem dependências externas ---
    def _mock_embed(self, text: str) -> list[float]:
        dims = self.settings.embedding_dimensions
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16) % (2**32)
        rng_state = seed
        vector = []
        for _ in range(dims):
            rng_state = (rng_state * 1664525 + 1013904223) % (2**32)
            vector.append(round((rng_state / 2**32) * 2 - 1, 4))
        return vector

    # --- provedores reais: implementação de referência, exigem chave ---
    def _openai_embed(self, text: str) -> list[float]:
        if not self.settings.embedding_api_key:
            raise RuntimeError("EMBEDDING_API_KEY não configurada para o provedor 'openai'.")
        import httpx

        model = self.settings.embedding_model or "text-embedding-3-small"
        resp = httpx.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {self.settings.embedding_api_key}"},
            json={"input": text, "model": model},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]

    def _cohere_embed(self, text: str) -> list[float]:
        if not self.settings.embedding_api_key:
            raise RuntimeError("EMBEDDING_API_KEY não configurada para o provedor 'cohere'.")
        import httpx

        model = self.settings.embedding_model or "embed-multilingual-v3.0"
        resp = httpx.post(
            "https://api.cohere.ai/v1/embed",
            headers={"Authorization": f"Bearer {self.settings.embedding_api_key}"},
            json={"texts": [text], "model": model, "input_type": "search_query"},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()["embeddings"][0]

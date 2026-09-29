"""Camada de reranking.

Entrada: pergunta + documentos recuperados (com score vetorial).
Saída: documentos reordenados com score de relevância do reranker.

Modo 'heuristic' (padrão do MVP): reordena por sobreposição léxica
entre pergunta e título/conteúdo do documento, somada ao score vetorial.
Modo 'external': ponto de extensão para plugar um reranker real (ex.
Cohere Rerank) — basta implementar _rerank_external e configurar
RERANKER_MODE=external e RERANKER_API_KEY.
"""
from __future__ import annotations

from app.core.config import Settings
from app.core.documents import get_document
from app.models.schemas import RerankItem, RetrievalItem
from app.services.vector_store import _tokenize


class RerankerService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def rerank(self, question: str, retrieval: list[RetrievalItem]) -> tuple[list[RerankItem], list[RerankItem]]:
        before = [
            RerankItem(
                document_id=r.document_id,
                filename=r.filename,
                title=r.title,
                vector_score=r.similarity,
                rerank_score=r.similarity,
            )
            for r in retrieval
        ]

        if self.settings.reranker_mode == "external":
            after = self._rerank_external(question, retrieval)
        else:
            after = self._rerank_heuristic(question, retrieval)

        keep = self.settings.rerank_keep
        after = sorted(after, key=lambda x: x.rerank_score, reverse=True)[:keep]
        return before, after

    def _rerank_heuristic(self, question: str, retrieval: list[RetrievalItem]) -> list[RerankItem]:
        q_tokens = set(_tokenize(question))
        items = []
        for r in retrieval:
            doc = get_document(r.document_id)
            if doc is None:
                items.append(
                    RerankItem(
                        document_id=r.document_id,
                        filename=r.filename,
                        title=r.title,
                        vector_score=r.similarity,
                        rerank_score=r.similarity,
                    )
                )
                continue
            title_overlap = len(set(_tokenize(doc.title)) & q_tokens)
            body_overlap = len(set(_tokenize(doc.content)) & q_tokens)
            boost = title_overlap * 0.08 + min(body_overlap * 0.015, 0.1)
            score = max(0.05, min(0.99, r.similarity + boost))
            items.append(
                RerankItem(
                    document_id=r.document_id,
                    filename=r.filename,
                    title=r.title,
                    vector_score=r.similarity,
                    rerank_score=round(score, 2),
                )
            )
        return items

    def _rerank_external(self, question: str, retrieval: list[RetrievalItem]) -> list[RerankItem]:
        if not self.settings.reranker_api_key:
            raise RuntimeError("RERANKER_API_KEY não configurada para o modo 'external'.")
        import httpx

        docs = [get_document(r.document_id) for r in retrieval]
        resp = httpx.post(
            "https://api.cohere.ai/v1/rerank",
            headers={"Authorization": f"Bearer {self.settings.reranker_api_key}"},
            json={
                "query": question,
                "documents": [d.content for d in docs if d],
                "model": "rerank-multilingual-v3.0",
            },
            timeout=20,
        )
        resp.raise_for_status()
        results = resp.json()["results"]
        items = []
        for res in results:
            r = retrieval[res["index"]]
            items.append(
                RerankItem(
                    document_id=r.document_id,
                    filename=r.filename,
                    title=r.title,
                    vector_score=r.similarity,
                    rerank_score=round(float(res["relevance_score"]), 2),
                )
            )
        return items

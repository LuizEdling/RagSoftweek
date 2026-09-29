from __future__ import annotations

from app.core.cache import TTLCache
from app.core.config import Settings
from app.core.documents import get_document
from app.models.schemas import ContextChunk, LLMPromptInfo, QueryResponse, SourceUsed
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.reranker_service import RerankerService
from app.services.vector_store import VectorStore


def _excerpt(document_id: str) -> str:
    doc = get_document(document_id)
    if not doc:
        return ""
    first_two_sentences = ". ".join(doc.content.split(". ")[:2])
    return first_two_sentences if first_two_sentences.endswith(".") else first_two_sentences + "."


class RagPipeline:
    def __init__(
        self,
        settings: Settings,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
        reranker_service: RerankerService,
        llm_service: LLMService,
        cache: TTLCache | None = None,
    ):
        self.settings = settings
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.reranker_service = reranker_service
        self.llm_service = llm_service
        self.cache = cache

    def run(self, question: str) -> QueryResponse:
        cache_key = question.strip().lower()
        if self.cache is not None:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached

        embedding = self.embedding_service.embed(question)

        retrieval = self.vector_store.search(question, embedding, self.settings.top_k)

        before, after = self.reranker_service.rerank(question, retrieval)

        context = [
            ContextChunk(
                document_id=item.document_id,
                filename=item.filename,
                title=item.title,
                excerpt=_excerpt(item.document_id),
            )
            for item in after
        ]

        try:
            answer = self.llm_service.generate(question, context)
            answer_error = None
        except Exception:
            answer = "Não foi possível gerar a resposta neste momento."
            answer_error = True

        sources = [
            SourceUsed(
                document_id=c.document_id,
                filename=c.filename,
                title=c.title,
                excerpt=c.excerpt,
            )
            for c in context
        ]

        context_block = "\n".join(f"[{c.filename}] {c.excerpt}" for c in context)

        response = QueryResponse(
            question=question,
            embedding={
                "vector_preview": embedding[:8],
                "dimensions": len(embedding),
            },
            retrieval=retrieval,
            top_k=self.settings.top_k,
            reranking={
                "before": before,
                "after": after,
                "kept_count": len(after),
            },
            context=context,
            llm=LLMPromptInfo(
                system_prompt="Você é um assistente acadêmico.",
                context_block=context_block,
                user_prompt=question,
            ),
            answer=answer,
            sources=[] if answer_error else sources,
            used_mock=self.settings.is_fully_mock,
        )

        if self.cache is not None and not answer_error:
            self.cache.set(cache_key, response)

        return response

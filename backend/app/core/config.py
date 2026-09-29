"""Configuração centralizada via variáveis de ambiente.

Nunca coloque chaves reais neste arquivo — tudo vem do ambiente
(.env em desenvolvimento, variáveis do serviço em produção).
"""
import os
from functools import lru_cache


def _get_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    # Qdrant
    # Padrão: "local" -> Qdrant embarcado (motor real, sem servidor/Docker),
    # populado automaticamente no startup do backend. Troque por uma URL do
    # Qdrant Cloud em produção, ou deixe vazio para voltar ao modo mock
    # (busca por palavra-chave, sem nenhum banco vetorial real).
    qdrant_url: str = os.getenv("QDRANT_URL", "local")
    qdrant_api_key: str = os.getenv("QDRANT_API_KEY", "")
    qdrant_collection: str = os.getenv("QDRANT_COLLECTION", "rag_lab_documents")

    # Embeddings
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "mock")  # mock | cohere | openai
    embedding_api_key: str = os.getenv("EMBEDDING_API_KEY", "")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "")
    embedding_dimensions: int = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

    # LLM
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")  # mock | groq | openai
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_model: str = os.getenv("LLM_MODEL", "")

    # Reranker
    reranker_mode: str = os.getenv("RERANKER_MODE", "heuristic")  # heuristic | external
    reranker_api_key: str = os.getenv("RERANKER_API_KEY", "")

    # Limites e segurança
    rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
    max_question_length: int = int(os.getenv("MAX_QUESTION_LENGTH", "500"))
    top_k: int = int(os.getenv("TOP_K", "5"))
    rerank_keep: int = int(os.getenv("RERANK_KEEP", "2"))
    cors_origins: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    ]

    # Cache simples em memória para perguntas repetidas
    cache_enabled: bool = _get_bool("CACHE_ENABLED", True)
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "120"))

    @property
    def is_fully_mock(self) -> bool:
        return (
            self.embedding_provider == "mock"
            and self.llm_provider == "mock"
            and not self.qdrant_url
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()

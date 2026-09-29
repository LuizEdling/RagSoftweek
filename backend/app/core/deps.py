from functools import lru_cache

from app.core.cache import TTLCache
from app.core.config import Settings, get_settings
from app.core.rate_limit import RateLimiter
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.rag_pipeline import RagPipeline
from app.services.reranker_service import RerankerService
from app.services.vector_store import VectorStore


@lru_cache
def get_rate_limiter() -> RateLimiter:
    return RateLimiter(get_settings())


@lru_cache
def get_cache() -> TTLCache | None:
    settings = get_settings()
    if not settings.cache_enabled:
        return None
    return TTLCache(settings.cache_ttl_seconds)


@lru_cache
def get_pipeline() -> RagPipeline:
    settings: Settings = get_settings()
    return RagPipeline(
        settings=settings,
        embedding_service=EmbeddingService(settings),
        vector_store=VectorStore(settings),
        reranker_service=RerankerService(settings),
        llm_service=LLMService(settings),
        cache=get_cache(),
    )

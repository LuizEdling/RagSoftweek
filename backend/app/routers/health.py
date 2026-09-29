from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.core.documents import load_documents
from app.models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(settings: Settings = Depends(get_settings)):
    return HealthResponse(
        status="ok",
        embedding_provider=settings.embedding_provider,
        llm_provider=settings.llm_provider,
        reranker_mode=settings.reranker_mode,
        qdrant_configured=bool(settings.qdrant_url),
        document_count=len(load_documents()),
    )

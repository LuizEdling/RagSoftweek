from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.deps import get_cache, get_pipeline, get_rate_limiter
from app.core.rate_limit import client_key
from app.models.schemas import (
    NoContextResponse,
    QueryRequest,
    QueryResponse,
    SearchCompareResponse,
)
from app.services.rag_pipeline import RagPipeline

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/query", response_model=QueryResponse)
def query(
    request: Request,
    body: QueryRequest,
    pipeline: RagPipeline = Depends(get_pipeline),
):
    get_rate_limiter().check(client_key(request))

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="A pergunta não pode estar vazia.")

    try:
        return pipeline.run(question)
    except Exception as exc:  # nunca expor stack trace ao usuário
        raise HTTPException(
            status_code=503,
            detail="Não foi possível processar a consulta no momento. Tente novamente em instantes.",
        ) from exc


def _validated_question(body: QueryRequest) -> str:
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="A pergunta não pode estar vazia.")
    return question


@router.post("/search", response_model=SearchCompareResponse)
def search_compare(
    request: Request,
    body: QueryRequest,
    pipeline: RagPipeline = Depends(get_pipeline),
):
    """Só a etapa de busca, em duas versões (vetorial e por palavra-chave),
    para o exercício de busca semântica. Não chama a LLM."""
    get_rate_limiter().check(client_key(request))
    question = _validated_question(body)

    cache = get_cache()
    cache_key = f"search:{question.lower()}"
    if cache is not None and (cached := cache.get(cache_key)) is not None:
        return cached

    top_k = pipeline.settings.top_k
    semantic_available = (
        pipeline.vector_store.is_real and pipeline.settings.embedding_provider != "mock"
    )
    try:
        semantic = []
        if semantic_available:
            embedding = pipeline.embedding_service.embed(question)
            semantic = pipeline.vector_store.search(question, embedding, top_k)
        keyword = pipeline.vector_store.keyword_search(question, top_k)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível fazer a busca no momento. Tente novamente em instantes.",
        ) from exc

    response = SearchCompareResponse(
        question=question,
        semantic=semantic,
        keyword=keyword,
        semantic_available=semantic_available,
    )
    if cache is not None:
        cache.set(cache_key, response)
    return response


@router.post("/no-context", response_model=NoContextResponse)
def no_context(
    request: Request,
    body: QueryRequest,
    pipeline: RagPipeline = Depends(get_pipeline),
):
    """A LLM respondendo sozinha, sem RAG — contraponto ao /query no
    exercício Com e sem RAG."""
    get_rate_limiter().check(client_key(request))
    question = _validated_question(body)

    cache = get_cache()
    cache_key = f"nocontext:{question.lower()}"
    if cache is not None and (cached := cache.get(cache_key)) is not None:
        return cached

    try:
        answer = pipeline.llm_service.generate_without_context(question)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível gerar a resposta no momento. Tente novamente em instantes.",
        ) from exc

    response = NoContextResponse(
        question=question,
        answer=answer,
        used_mock=pipeline.settings.llm_provider == "mock",
    )
    if cache is not None:
        cache.set(cache_key, response)
    return response

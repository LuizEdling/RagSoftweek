from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.deps import get_pipeline, get_rate_limiter
from app.core.rate_limit import client_key
from app.models.schemas import QueryRequest, QueryResponse
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

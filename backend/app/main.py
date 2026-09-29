import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.deps import get_pipeline
from app.routers import documents, health, rag

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag-lab")

settings = get_settings()

app = FastAPI(
    title="RAG Lab API",
    description="Backend do RAG Lab — workshop 'Construindo uma IA com Memória'.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(rag.router)


@app.on_event("startup")
def seed_local_qdrant_if_needed():
    # Só se aplica ao Qdrant local/embarcado (QDRANT_URL=local ou
    # :memory:). Contra um Qdrant remoto, a ingestão continua sendo um
    # passo manual e explícito via scripts/ingest.py.
    pipeline = get_pipeline()
    try:
        inserted = pipeline.vector_store.seed_if_empty(pipeline.embedding_service)
        if inserted:
            logger.info(
                "Qdrant local vazio: ingeridos %d documentos automaticamente em '%s'.",
                inserted,
                settings.qdrant_collection,
            )
    except Exception:
        logger.exception("Falha ao popular o Qdrant local automaticamente no startup.")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Nunca expor stack traces para o usuário final.
    logger.exception("Erro não tratado em %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocorreu um erro inesperado. Tente novamente em instantes."},
    )


@app.get("/")
def root():
    return {"name": "RAG Lab API", "docs": "/docs", "health": "/api/health"}

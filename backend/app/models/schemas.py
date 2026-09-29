from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)


class RetrievalItem(BaseModel):
    document_id: str
    filename: str
    title: str
    similarity: float


class RerankItem(BaseModel):
    document_id: str
    filename: str
    title: str
    vector_score: float
    rerank_score: float


class ContextChunk(BaseModel):
    document_id: str
    filename: str
    title: str
    excerpt: str


class SourceUsed(BaseModel):
    document_id: str
    filename: str
    title: str
    excerpt: str


class EmbeddingInfo(BaseModel):
    vector_preview: list[float]
    dimensions: int


class RerankingInfo(BaseModel):
    before: list[RerankItem]
    after: list[RerankItem]
    kept_count: int


class LLMPromptInfo(BaseModel):
    system_prompt: str
    context_block: str
    user_prompt: str


class QueryResponse(BaseModel):
    question: str
    embedding: EmbeddingInfo
    retrieval: list[RetrievalItem]
    top_k: int
    reranking: RerankingInfo
    context: list[ContextChunk]
    llm: LLMPromptInfo
    answer: str
    sources: list[SourceUsed]
    used_mock: bool


class DocumentOut(BaseModel):
    id: str
    filename: str
    title: str
    content: str
    category: str
    tags: list[str]


class HealthResponse(BaseModel):
    status: str
    embedding_provider: str
    llm_provider: str
    reranker_mode: str
    qdrant_configured: bool
    document_count: int

"""Camada de acesso ao banco vetorial.

Em modo mock (sem QDRANT_URL configurado), simula a busca por
similaridade usando sobreposição de palavras-chave sobre a base de
documentos local — apenas para a interface funcionar sem nenhuma
configuração externa. Em modo real, usa o cliente do Qdrant.
"""
from __future__ import annotations

import random
import re
import unicodedata

from app.core.config import Settings
from app.core.documents import Document, load_documents
from app.models.schemas import RetrievalItem

def build_qdrant_client(settings: Settings):
    """Cria um QdrantClient apontando para Qdrant Cloud/servidor próprio, ou
    para o modo local/embarcado (motor real do Qdrant em processo, sem
    servidor). Reaproveitado pelo VectorStore e pelo script de ingestão.
    """
    from qdrant_client import QdrantClient

    if settings.qdrant_url == ":memory:":
        return QdrantClient(location=":memory:")
    if settings.qdrant_url.startswith("local:"):
        return QdrantClient(path=settings.qdrant_url[len("local:") :])
    if settings.qdrant_url == "local":
        return QdrantClient(path=".qdrant_local")
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None)


STOPWORDS = {
    "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "um", "uma",
    "que", "para", "com", "no", "na", "nos", "nas", "por", "como", "meu", "minha",
    "posso", "faco", "fazer", "quero", "qual", "quais", "quando", "onde",
}


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _tokenize(text: str) -> list[str]:
    text = _strip_accents(text.lower())
    words = re.findall(r"[a-z0-9]+", text)
    return [w for w in words if len(w) > 2 and w not in STOPWORDS]


def _keyword_overlap(question_tokens: list[str], doc: Document) -> float:
    doc_tokens = set(_tokenize(doc.title + " " + doc.content + " " + " ".join(doc.tags)))
    hits = 0.0
    for t in question_tokens:
        if t in doc_tokens:
            hits += 1
        elif any(dt.startswith(t[:4]) for dt in doc_tokens if len(t) > 3):
            hits += 0.5
    return hits


class VectorStore:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None
        if settings.qdrant_url:
            self._init_qdrant()

    def _init_qdrant(self):
        # Modo local/embarcado (QDRANT_URL=local ou local:<caminho> ou
        # :memory:): usa o motor real do Qdrant em processo, sem servidor
        # nem Docker — útil para desenvolver e testar a integração real
        # sem depender do Qdrant Cloud. Qualquer outro valor é tratado
        # como URL de um Qdrant remoto (Cloud ou self-hosted).
        self._client = build_qdrant_client(self.settings)

    @property
    def is_real(self) -> bool:
        return self._client is not None

    @property
    def is_local(self) -> bool:
        return self.settings.qdrant_url == ":memory:" or self.settings.qdrant_url.startswith("local")

    def seed_if_empty(self, embedding_service) -> int:
        """Popula o Qdrant local/embarcado automaticamente na primeira
        subida do backend, para o modo local funcionar sem nenhum passo
        manual de ingestão. Nunca roda contra um Qdrant remoto (Cloud/
        self-hosted) — lá, a ingestão continua sendo um passo explícito via
        scripts/ingest.py, para não gravar dados sem intenção em um cluster
        de produção. Retorna quantos documentos foram inseridos (0 se a
        collection já existia com dados).
        """
        if not self.is_real or not self.is_local:
            return 0

        from qdrant_client.http.models import Distance, PointStruct, VectorParams

        collection = self.settings.qdrant_collection
        exists = self._client.collection_exists(collection)
        if exists:
            count = self._client.count(collection_name=collection).count
            if count > 0:
                return 0
        else:
            documents = load_documents()
            if not documents:
                return 0
            dimensions = len(embedding_service.embed(documents[0].content))
            self._client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(size=dimensions, distance=Distance.COSINE),
            )

        documents = load_documents()
        points = [
            PointStruct(
                id=int(doc.id),
                vector=embedding_service.embed(doc.content),
                payload={
                    "document_id": doc.id,
                    "title": doc.title,
                    "content": doc.content,
                    "category": doc.category,
                    "tags": doc.tags,
                    "filename": doc.filename,
                    "source": doc.filename,
                },
            )
            for doc in documents
        ]
        self._client.upsert(collection_name=collection, points=points)
        return len(points)

    def search(self, question: str, embedding: list[float], top_k: int) -> list[RetrievalItem]:
        if self.is_real:
            return self._search_real(embedding, top_k)
        return self._search_mock(question, top_k)

    def keyword_search(self, question: str, top_k: int) -> list[RetrievalItem]:
        """Busca lexical pura: só conta palavras iguais (sem radical, sem
        ruído). Serve de contraponto à busca vetorial no exercício de busca
        semântica — documentos sem nenhuma palavra em comum nem aparecem."""
        q_tokens = set(_tokenize(question))
        if not q_tokens:
            return []
        scored = []
        for doc in load_documents():
            doc_tokens = set(_tokenize(doc.title + " " + doc.content + " " + " ".join(doc.tags)))
            hits = len(q_tokens & doc_tokens)
            if hits == 0:
                continue
            scored.append(
                RetrievalItem(
                    document_id=doc.id,
                    filename=doc.filename,
                    title=doc.title,
                    similarity=round(hits / len(q_tokens), 2),
                )
            )
        scored.sort(key=lambda x: (-x.similarity, x.filename))
        return scored[:top_k]

    def _search_real(self, embedding: list[float], top_k: int) -> list[RetrievalItem]:
        results = self._client.query_points(
            collection_name=self.settings.qdrant_collection,
            query=embedding,
            limit=top_k,
        ).points
        items = []
        for r in results:
            payload = r.payload or {}
            items.append(
                RetrievalItem(
                    document_id=str(payload.get("document_id", r.id)),
                    filename=payload.get("filename", ""),
                    title=payload.get("title", ""),
                    similarity=round(float(r.score), 2),
                )
            )
        return items

    def _search_mock(self, question: str, top_k: int) -> list[RetrievalItem]:
        rng = random.Random(hash(question) & 0xFFFFFFFF)
        q_tokens = _tokenize(question)
        scored = []
        for doc in load_documents():
            overlap = _keyword_overlap(q_tokens, doc)
            base = 0.55 + min(overlap * 0.11, 0.4) if overlap > 0 else 0.15 + rng.random() * 0.25
            noise = (rng.random() - 0.5) * 0.05
            similarity = max(0.05, min(0.99, base + noise))
            scored.append(
                RetrievalItem(
                    document_id=doc.id,
                    filename=doc.filename,
                    title=doc.title,
                    similarity=round(similarity, 2),
                )
            )
        scored.sort(key=lambda x: x.similarity, reverse=True)
        return scored[:top_k]

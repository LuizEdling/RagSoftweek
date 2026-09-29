"""Script de ingestão: carrega os documentos de data/documents/*.md,
gera embeddings e envia para a collection do Qdrant.

Uso:
    python scripts/ingest.py

Requer QDRANT_URL, QDRANT_API_KEY (se aplicável) e as variáveis do
provedor de embeddings configuradas no ambiente (.env).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from qdrant_client.http.models import Distance, PointStruct, VectorParams  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.documents import load_documents  # noqa: E402
from app.services.embedding_service import EmbeddingService  # noqa: E402
from app.services.vector_store import build_qdrant_client  # noqa: E402


def main():
    settings = get_settings()

    if not settings.qdrant_url:
        print(
            "QDRANT_URL não configurada. Use a URL do seu cluster no Qdrant Cloud, ou "
            "QDRANT_URL=local para rodar contra um Qdrant local/embarcado (sem servidor, "
            "bom para testar a integração sem nenhuma conta)."
        )
        sys.exit(1)

    if settings.embedding_provider == "mock":
        print(
            "AVISO: EMBEDDING_PROVIDER está como 'mock'. Os vetores gerados não serão "
            "semanticamente úteis para busca real. Configure um provedor real antes de "
            "usar em produção."
        )

    client = build_qdrant_client(settings)
    embedding_service = EmbeddingService(settings)
    documents = load_documents()

    if not documents:
        print("Nenhum documento encontrado em data/documents/. Nada a ingerir.")
        sys.exit(1)

    print(f"Gerando embeddings para {len(documents)} documentos...")
    first_vector = embedding_service.embed(documents[0].content)
    dimensions = len(first_vector)

    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in collections:
        print(f"Criando collection '{settings.qdrant_collection}' (dim={dimensions})...")
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=dimensions, distance=Distance.COSINE),
        )

    points = []
    for i, doc in enumerate(documents):
        vector = first_vector if i == 0 else embedding_service.embed(doc.content)
        points.append(
            PointStruct(
                id=int(doc.id),
                vector=vector,
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
        )
        print(f"  [{i + 1}/{len(documents)}] {doc.filename}")

    client.upsert(collection_name=settings.qdrant_collection, points=points)
    print(f"Ingestão concluída: {len(points)} documentos na collection '{settings.qdrant_collection}'.")


if __name__ == "__main__":
    main()

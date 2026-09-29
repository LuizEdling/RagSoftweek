from fastapi import APIRouter, HTTPException

from app.core.documents import get_document, load_documents
from app.models.schemas import DocumentOut

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[DocumentOut])
def list_documents():
    return [
        DocumentOut(
            id=d.id, filename=d.filename, title=d.title, content=d.content,
            category=d.category, tags=d.tags,
        )
        for d in load_documents()
    ]


@router.get("/{document_id}", response_model=DocumentOut)
def get_document_by_id(document_id: str):
    doc = get_document(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")
    return DocumentOut(
        id=doc.id, filename=doc.filename, title=doc.title, content=doc.content,
        category=doc.category, tags=doc.tags,
    )

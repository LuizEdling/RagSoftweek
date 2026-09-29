"""Carrega a base de conhecimento fictícia a partir de data/documents/*.md.

Cada arquivo tem um front-matter YAML (id, title, category, tags, source)
seguido do conteúdo em texto. Essa é a mesma base usada pelo script de
ingestão real e pelo modo mock do backend.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

import yaml

DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "documents")


@dataclass
class Document:
    id: str
    filename: str
    title: str
    content: str
    category: str
    tags: list[str]


def _parse_md_file(path: str, filename: str) -> Document:
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read()

    if not raw.startswith("---"):
        raise ValueError(f"Documento sem front-matter: {filename}")

    _, fm_raw, body = raw.split("---", 2)
    meta = yaml.safe_load(fm_raw)
    return Document(
        id=str(meta["id"]),
        filename=meta.get("source", filename),
        title=meta["title"],
        content=body.strip(),
        category=meta.get("category", "geral"),
        tags=list(meta.get("tags", [])),
    )


@lru_cache
def load_documents() -> list[Document]:
    if not os.path.isdir(DOCS_DIR):
        return []
    docs = []
    for filename in sorted(os.listdir(DOCS_DIR)):
        if filename.endswith(".md"):
            docs.append(_parse_md_file(os.path.join(DOCS_DIR, filename), filename))
    return docs


def get_document(document_id: str) -> Document | None:
    for doc in load_documents():
        if doc.id == document_id:
            return doc
    return None

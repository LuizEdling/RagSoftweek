"""Rate limiting básico em memória, por IP.

Suficiente para uma turma de 20-50 alunos em uma única instância do
backend. Não é distribuído — se o backend rodar em múltiplas instâncias,
troque por um limitador baseado em Redis.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.core.config import Settings


class RateLimiter:
    def __init__(self, settings: Settings):
        self.limit = settings.rate_limit_per_minute
        self.window_seconds = 60
        self._hits: dict[str, deque] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()
        if len(hits) >= self.limit:
            raise HTTPException(
                status_code=429,
                detail="Muitas requisições em pouco tempo. Aguarde um momento e tente novamente.",
            )
        hits.append(now)


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

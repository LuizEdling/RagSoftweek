import { runMockPipeline } from '../lib/mockRag';
import type { RagPipelineResult } from '../types/rag';

// Quando o backend estiver disponível (Fase 2+), defina VITE_API_URL no
// ambiente do frontend para que as chamadas passem a ir para a API real.
// Sem essa variável, o app roda inteiramente em modo mock no navegador —
// o que permite usar a interface sem nenhum backend configurado.
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// O backend (Pydantic) responde em snake_case; o frontend usa camelCase.
// A conversão fica só aqui, para o resto do código nunca ver snake_case.
function camelizeKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function camelize<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => camelize(v)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [camelizeKey(k), camelize(v)]),
    ) as T;
  }
  return value as T;
}

export async function runRagQuery(question: string): Promise<RagPipelineResult> {
  if (!API_URL) {
    await delay(350 + Math.random() * 250);
    return runMockPipeline(question);
  }

  const res = await fetch(`${API_URL}/api/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    throw new Error(`Erro ao consultar o RAG (status ${res.status})`);
  }

  return camelize<RagPipelineResult>(await res.json());
}

export function isUsingRealBackend(): boolean {
  return Boolean(API_URL);
}

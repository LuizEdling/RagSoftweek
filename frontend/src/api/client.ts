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

  return res.json();
}

export function isUsingRealBackend(): boolean {
  return Boolean(API_URL);
}

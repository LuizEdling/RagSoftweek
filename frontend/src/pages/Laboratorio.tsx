import { useState } from 'react';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { runRagQuery } from '../api/client';
import { SUGGESTED_QUESTIONS } from '../lib/mockRag';
import Pipeline from '../components/Pipeline';
import DemoModeRunner from '../components/DemoModeRunner';
import type { RagPipelineResult } from '../types/rag';

const MAX_QUESTION_LENGTH = 500;

export default function Laboratorio() {
  const [question, setQuestion] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'demo-running' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<RagPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function execute(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setError(null);
    setResult(null);

    if (demoMode) {
      setStatus('demo-running');
      try {
        const res = await runRagQuery(trimmed);
        setResult(res);
      } catch {
        setError('Não foi possível gerar a resposta neste momento.');
      }
      return;
    }

    setStatus('loading');
    try {
      const res = await runRagQuery(trimmed);
      setResult(res);
      setStatus('done');
    } catch {
      setError('Não foi possível gerar a resposta neste momento.');
      setStatus('error');
    }
  }

  function handleDemoFinished() {
    setStatus('done');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <section className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Faça uma pergunta para a IA
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-slate-400">
          Veja como o RAG transforma sua pergunta em uma busca semântica e utiliza os
          documentos encontrados para gerar uma resposta.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            execute(question);
          }}
          className="mx-auto flex max-w-xl flex-col gap-3"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            placeholder="Digite sua pergunta…"
            className="w-full rounded-xl border border-white/15 bg-navy-800/70 px-5 py-3.5 text-base text-white placeholder:text-slate-500 focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-primary/30"
          />
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center justify-center gap-2 text-sm text-slate-400 sm:justify-start">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-navy-800 accent-blue-primary"
              />
              Modo Demonstração
            </label>
            <button
              type="submit"
              disabled={status === 'loading' || status === 'demo-running' || !question.trim()}
              className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-6 py-3 font-semibold text-white shadow-lg shadow-blue-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' || status === 'demo-running' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Executar RAG
            </button>
          </div>
        </form>

        <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuestion(q);
                execute(q);
              }}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-blue-light/40 hover:text-slate-200"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {status === 'demo-running' && <DemoModeRunner onFinished={handleDemoFinished} />}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && status === 'done' && (
        <section>
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
            Pipeline RAG
          </h2>
          <Pipeline result={result} />
        </section>
      )}
    </div>
  );
}

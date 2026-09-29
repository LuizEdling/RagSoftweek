import { ArrowRight, Check } from 'lucide-react';
import { SCENARIOS } from '../../data/practiceScenarios';

const PIPELINE = [
  { fn: 'embed()', role: 'modelo de embeddings' },
  { fn: 'buscar()', role: 'banco vetorial' },
  { fn: 'reranquear()', role: 'reranker' },
  { fn: 'montar_contexto()', role: 'montador de contexto' },
  { fn: 'gerar_resposta()', role: 'LLM' },
  { fn: 'verificar_fontes()', role: 'auditor' },
];

export default function QuestionStep({
  value,
  onChange,
  hasProgress,
}: {
  value: string;
  onChange: (q: string) => void;
  hasProgress: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-light/30 bg-gradient-to-br from-blue-primary/15 via-blue-primary/5 to-transparent p-4">
        <p className="text-base font-semibold text-white">Aqui você não usa a IA — você é a IA.</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
          Um sistema RAG é uma cadeia de funções. Em cada missão você assume o papel de uma delas, faz
          o que o código faz e, no final, vê o código real. Ganhe pontos acertando.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
          {PIPELINE.map((p, i) => (
            <div key={p.fn} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRight className="h-3 w-3 text-slate-600" />}
              <span
                title={`Você é: ${p.role}`}
                className="rounded-md border border-white/10 bg-navy-950/60 px-2 py-1 font-mono text-blue-glow"
              >
                {p.fn}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">
          Escolha a pergunta que vai guiar todas as missões:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SCENARIOS.map((s) => {
            const active = s.question === value;
            return (
              <button
                key={s.question}
                onClick={() => !active && onChange(s.question)}
                aria-pressed={active}
                className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? 'border-blue-light/60 bg-blue-primary/15 text-white'
                    : 'border-white/10 bg-navy-800/50 text-slate-300 hover:bg-white/5'
                }`}
              >
                {s.question}
                {active && <Check className="h-4 w-4 shrink-0 text-blue-glow" />}
              </button>
            );
          })}
        </div>
        {hasProgress && (
          <p className="mt-2 text-xs text-amber-400">
            Atenção: trocar a pergunta reinicia as missões já feitas.
          </p>
        )}
      </div>
    </div>
  );
}

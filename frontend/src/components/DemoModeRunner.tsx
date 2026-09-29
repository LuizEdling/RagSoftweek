import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const STAGES = [
  'Gerando embedding…',
  'Consultando banco vetorial…',
  'Recuperando documentos…',
  'Executando reranking…',
  'Montando contexto…',
  'Consultando LLM…',
  'Resposta pronta!',
];

const STAGE_DURATION_MS = 650;

export default function DemoModeRunner({ onFinished }: { onFinished: () => void }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length - 1) {
      const t = setTimeout(onFinished, STAGE_DURATION_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStageIndex((i) => i + 1), STAGE_DURATION_MS);
    return () => clearTimeout(t);
  }, [stageIndex, onFinished]);

  return (
    <div className="rounded-xl border border-blue-light/25 bg-navy-800/60 p-6">
      <div className="flex flex-col gap-2.5">
        {STAGES.map((stage, i) => {
          const state = i < stageIndex ? 'done' : i === stageIndex ? 'active' : 'pending';
          return (
            <div
              key={stage}
              className={`flex items-center gap-3 text-sm transition-opacity ${
                state === 'pending' ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {state === 'done' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
              {state === 'active' && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-glow" />
              )}
              {state === 'pending' && (
                <div className="h-4 w-4 shrink-0 rounded-full border border-slate-600" />
              )}
              <span
                className={
                  state === 'active'
                    ? 'font-medium text-white'
                    : state === 'done'
                      ? 'text-slate-400 line-through decoration-slate-600'
                      : 'text-slate-500'
                }
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

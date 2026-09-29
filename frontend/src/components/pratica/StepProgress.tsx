import { Check } from 'lucide-react';

export default function StepProgress({
  numbers,
  current,
  onJump,
}: {
  numbers: string[];
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
      {numbers.map((number, i) => {
        const isCurrent = i === current;
        // Qualquer etapa anterior à atual só foi alcançada porque a
        // etapa em questão já tinha sido concluída — logo já está "feita".
        const isDone = i < current;
        // Só dá pra clicar pra voltar a uma etapa já vista — avançar além
        // da atual é sempre pelo botão "Próximo".
        const isClickable = i <= current;
        return (
          <div key={number} className="flex items-center gap-1.5">
            {i > 0 && <div className="h-px w-3 bg-white/10 sm:w-5" />}
            <button
              onClick={() => isClickable && onJump(i)}
              disabled={!isClickable}
              title={isClickable ? undefined : 'Chegue nessa etapa pelo botão Próximo'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-blue-primary text-white ring-2 ring-blue-light/50'
                  : isDone
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                    : isClickable
                      ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                      : 'cursor-not-allowed bg-white/5 text-slate-600'
              }`}
            >
              {isDone && !isCurrent ? <Check className="h-3.5 w-3.5" /> : number}
            </button>
          </div>
        );
      })}
    </div>
  );
}

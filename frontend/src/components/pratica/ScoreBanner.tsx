import { Trophy, RotateCcw } from 'lucide-react';

export default function ScoreBanner({
  score,
  max,
  message,
  onRetry,
}: {
  score: number;
  max: number;
  message: string;
  onRetry: () => void;
}) {
  const ratio = max > 0 ? score / max : 0;
  const tone =
    ratio >= 0.8 ? 'success' : ratio >= 0.4 ? 'warning' : 'danger';
  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    danger: 'border-red-500/30 bg-red-500/10 text-red-400',
  }[tone];

  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${colors}`}>
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">
            {score}/{max}
          </p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4" />
        Tentar de novo
      </button>
    </div>
  );
}

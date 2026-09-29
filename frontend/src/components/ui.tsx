import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

export function Explainer({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-light/20 bg-blue-primary/10 p-3.5 text-sm leading-relaxed text-slate-300">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-glow" />
      <p>{children}</p>
    </div>
  );
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-navy-950/80 p-4 font-mono text-[13px] leading-relaxed text-slate-300">
      {children}
    </pre>
  );
}

export function SimilarityBar({ score, label }: { score: number; label?: string }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? 'bg-emerald-500' : score >= 0.4 ? 'bg-blue-primary' : 'bg-slate-600';
  return (
    <div className="flex items-center gap-3">
      {label && <span className="w-40 shrink-0 truncate text-sm text-slate-300">{label}</span>}
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-sm text-slate-300">
        {score.toFixed(2)}
      </span>
    </div>
  );
}

export function Badge({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'success' | 'warning' | 'neutral' }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-primary/15 text-blue-glow border-blue-light/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    neutral: 'bg-white/5 text-slate-300 border-white/10',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

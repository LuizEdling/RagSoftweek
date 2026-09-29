import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface PipelineStepProps {
  number: string;
  title: string;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  accent?: 'blue' | 'success' | 'warning';
  children: ReactNode;
}

const accentMap = {
  blue: 'from-blue-primary to-blue-light',
  success: 'from-emerald-500 to-emerald-400',
  warning: 'from-amber-500 to-amber-400',
};

export default function PipelineStep({
  number,
  title,
  subtitle,
  defaultOpen = false,
  accent = 'blue',
  children,
}: PipelineStepProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-800/60 shadow-lg shadow-black/20">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${accentMap[accent]} text-sm font-bold text-white shadow`}
        >
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="truncate text-sm text-slate-400">{subtitle}</p>}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="fade-in-up border-t border-white/5 px-5 py-5">{children}</div>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Eye, Code2 } from 'lucide-react';
import { Badge, CodeBlock } from '../ui';

/** Props comuns a todas as missões. */
export interface MissionProps {
  /** Pergunta escolhida no começo da prática. */
  question: string;
  /** A missão já foi concluída antes (o aluno voltou a esta etapa). */
  alreadyDone: boolean;
  /** Avisa o total de pontos quando a missão termina (de novo, se refizer). */
  onComplete: (got: number, max: number) => void;
}

/** Cartão que abre toda missão: qual função o aluno é, o que recebe, o que
 * faz e como pontua — sempre no mesmo formato, para ninguém ficar perdido. */
export function MissionCard({
  role,
  fn,
  receive,
  task,
  scoring,
}: {
  role: string;
  fn: string;
  receive: ReactNode;
  task: ReactNode;
  scoring: string;
}) {
  const rows: [string, ReactNode][] = [
    ['Você recebe', receive],
    ['Sua tarefa', task],
    ['Como pontua', scoring],
  ];
  return (
    <div className="rounded-xl border border-blue-light/30 bg-gradient-to-br from-blue-primary/15 via-blue-primary/5 to-transparent p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">MISSÃO</Badge>
        <h3 className="text-base font-semibold text-white">Você é {role}</h3>
      </div>
      <code className="mt-3 block overflow-x-auto rounded-md border border-white/5 bg-navy-950/70 px-3 py-2 font-mono text-[13px] text-blue-glow">
        {fn}
      </code>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([label, content]) => (
          <div key={label} className="grid gap-x-3 sm:grid-cols-[6.5rem_1fr]">
            <dt className="font-medium text-slate-500">{label}</dt>
            <dd className="leading-relaxed text-slate-200">{content}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** "Ver o código real": trecho (simplificado) do backend que faz o que o
 * aluno acabou de fazer à mão. */
export function CodeReveal({ file, children }: { file: string; children: string }) {
  return (
    <details className="group rounded-lg border border-white/10 bg-white/[0.02]">
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white">
        <Code2 className="h-4 w-4 text-blue-glow" />
        Ver o código real por trás disso
      </summary>
      <div className="space-y-2 border-t border-white/5 p-4">
        <p className="font-mono text-xs text-slate-500">{file}</p>
        <CodeBlock>{children}</CodeBlock>
      </div>
    </details>
  );
}

/** Botões de ação de uma missão: verificar e, se travar, ver a resposta. */
export function ActionRow({
  canCheck,
  checked,
  onCheck,
  onGiveUp,
  checkLabel = 'Verificar',
  hint,
}: {
  canCheck: boolean;
  checked: boolean;
  onCheck: () => void;
  onGiveUp: () => void;
  checkLabel?: string;
  hint?: string;
}) {
  if (checked) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onCheck}
        disabled={!canCheck}
        className="rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {checkLabel}
      </button>
      <button
        onClick={onGiveUp}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <Eye className="h-4 w-4" />
        Estou travado — mostrar a resposta
      </button>
      {hint && !canCheck && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

/** Aviso discreto quando o aluno volta a uma missão que já concluiu. */
export function DoneNote({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
      Você já concluiu esta missão — pode refazer para treinar ou seguir em frente.
    </p>
  );
}

/** Caixa que mostra um prompt (com quebra de linha, ao contrário do CodeBlock). */
export function PromptBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-navy-950/80 p-4 font-mono text-[13px] leading-relaxed text-slate-300">
        {children}
      </pre>
    </div>
  );
}

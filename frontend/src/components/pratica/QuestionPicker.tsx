import { SUGGESTED_QUESTIONS } from '../../lib/mockRag';

export default function QuestionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (q: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="shrink-0 text-sm font-medium text-slate-400">Pergunta:</label>
      <select
        value={SUGGESTED_QUESTIONS.includes(value) ? value : '__custom__'}
        onChange={(e) => {
          if (e.target.value !== '__custom__') onChange(e.target.value);
        }}
        className="rounded-lg border border-white/15 bg-navy-800/70 px-3 py-2 text-sm text-white focus:border-blue-primary focus:outline-none"
      >
        {SUGGESTED_QUESTIONS.map((q) => (
          <option key={q} value={q}>
            {q}
          </option>
        ))}
        <option value="__custom__">Outra pergunta…</option>
      </select>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ou digite sua própria pergunta"
        className="min-w-0 flex-1 rounded-lg border border-white/15 bg-navy-800/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-primary focus:outline-none"
      />
    </div>
  );
}

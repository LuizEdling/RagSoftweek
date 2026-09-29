import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { tokenize } from '../../lib/mockRag';
import { getDocumentByFilename } from '../../data/documents';
import type { RetrievalItem } from '../../types/rag';

const WEIGHT_OPTIONS = [1, 2, 3];
const KEEP_N = 2;

/** Modo avançado do exercício "Seja o reranker": deixa o aluno dar peso
 * a cada termo da pergunta e ver, ao vivo, como isso muda quem fica no
 * topo — reranking não é uma verdade objetiva, é uma função de score com
 * pesos que alguém escolhe. */
export default function WeightAdjuster({
  question,
  retrieval,
}: {
  question: string;
  retrieval: RetrievalItem[];
}) {
  const terms = useMemo(() => [...new Set(tokenize(question))], [question]);
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(terms.map((t) => [t, 1])),
  );

  const ranked = useMemo(() => {
    return retrieval
      .map((item) => {
        const doc = getDocumentByFilename(item.filename);
        const docTokens = new Set(doc ? tokenize(doc.title + ' ' + doc.content) : []);
        const score = terms.reduce(
          (sum, term) => sum + (docTokens.has(term) ? weights[term] ?? 1 : 0),
          0,
        );
        return { ...item, weightedScore: score };
      })
      .sort((a, b) => b.weightedScore - a.weightedScore);
  }, [retrieval, terms, weights]);

  const top = ranked.slice(0, KEEP_N);

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-navy-950/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <SlidersHorizontal className="h-4 w-4 text-blue-glow" />
        Ajustar pesos manualmente
      </p>
      <p className="text-xs leading-relaxed text-slate-500">
        Dê mais peso ao termo que você acha que deveria pesar mais na hora de rerankear — a lista
        abaixo reordena ao vivo.
      </p>

      <div className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <div
            key={term}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1"
          >
            <span className="pl-1 text-xs font-medium text-slate-300">{term}</span>
            {WEIGHT_OPTIONS.map((w) => (
              <button
                key={w}
                onClick={() => setWeights((prev) => ({ ...prev, [term]: w }))}
                className={`rounded-full px-2 py-0.5 text-[11px] font-mono transition-colors ${
                  (weights[term] ?? 1) === w
                    ? 'bg-blue-primary text-white'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {w}x
              </button>
            ))}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Com esses pesos, ficariam no topo
        </p>
        <ol className="space-y-1.5">
          {top.map((item, i) => (
            <li
              key={item.documentId}
              className="fade-in-up flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm"
            >
              <span className="text-slate-200">
                {i + 1}. {item.filename}
              </span>
              <span className="font-mono text-emerald-400">{item.weightedScore.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

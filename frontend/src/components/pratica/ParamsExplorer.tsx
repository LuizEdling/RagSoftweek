import { useMemo, useState } from 'react';
import { SimilarityBar } from '../ui';
import { mockRetrieveAll, mockRerank, DEFAULT_TOP_K, DEFAULT_RERANK_KEEP } from '../../lib/mockRag';

export default function ParamsExplorer({ question }: { question: string }) {
  const [topK, setTopK] = useState(DEFAULT_TOP_K);
  const [keepN, setKeepN] = useState(DEFAULT_RERANK_KEEP);

  const allRanked = useMemo(() => mockRetrieveAll(question), [question]);
  const retrieval = allRanked.slice(0, topK);
  const effectiveKeepN = Math.min(keepN, topK);
  const { after } = useMemo(
    () => mockRerank(retrieval, question, effectiveKeepN),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [retrieval, question, effectiveKeepN],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-light/20 bg-blue-primary/10 p-3.5 text-sm leading-relaxed text-slate-300">
        Mexa nos parâmetros e veja, na hora, o que muda na busca vetorial e no reranking. É o
        mesmo pipeline — só com os controles que normalmente ficam fixos no código.
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <label className="font-medium text-slate-300">Top-K (busca vetorial)</label>
            <span className="font-mono text-blue-glow">{topK}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-full accent-blue-primary"
          />
          <p className="mt-1 text-xs text-slate-500">
            Quantos documentos o banco vetorial retorna antes do reranking.
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <label className="font-medium text-slate-300">Mantidos após reranking</label>
            <span className="font-mono text-blue-glow">{effectiveKeepN}</span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(1, topK)}
            value={keepN}
            onChange={(e) => setKeepN(Number(e.target.value))}
            className="w-full accent-blue-primary"
          />
          <p className="mt-1 text-xs text-slate-500">
            Quantos documentos sobrevivem ao reranking e viram contexto para a LLM.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Busca vetorial (Top-{topK})
          </p>
          <div className="space-y-2">
            {retrieval.map((item) => (
              <SimilarityBar key={item.documentId} score={item.similarity} label={item.filename} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contexto final ({after.length} documento{after.length !== 1 ? 's' : ''})
          </p>
          <div className="space-y-2">
            {after.map((item) => (
              <div
                key={item.documentId}
                className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-slate-200"
              >
                {item.filename}{' '}
                <span className="font-mono text-xs text-emerald-400">
                  {item.rerankScore.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-navy-950/50 p-4 text-sm leading-relaxed text-slate-400">
        <p className="mb-1 font-medium text-slate-300">O que reparar:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Top-K muito baixo (1-2) pode deixar de fora um documento relevante.</li>
          <li>Top-K muito alto (8-10) sobrecarrega o reranker com candidatos fracos.</li>
          <li>Manter poucos documentos após o reranking deixa o contexto mais focado, mas
            arrisca perder informação se a pergunta precisar de mais de uma fonte.</li>
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import ScoreBanner from './ScoreBanner';
import TermHighlight from './TermHighlight';
import { documents } from '../../data/documents';
import { mockRetrieveAll, tokenize } from '../../lib/mockRag';
import { shuffle } from '../../lib/shuffle';

const TOP_K = 5;
// Diferença de score, em pontos de similaridade, abaixo da qual dois
// documentos vizinhos do corte de Top-K são considerados "empate técnico".
const NEAR_TIE_EPSILON = 0.02;

export default function VectorStoreGame({
  question,
  onCheck,
}: {
  question: string;
  onCheck?: () => void;
}) {
  const [pool] = useState(() => shuffle(documents));
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setSelected([]);
    setChecked(false);
  }, [question]);

  const qTokens = useMemo(() => tokenize(question), [question]);
  const allRanked = useMemo(() => mockRetrieveAll(question), [question]);
  const realTopK = useMemo(() => allRanked.slice(0, TOP_K), [allRanked]);
  const realFilenames = useMemo(() => new Set(realTopK.map((r) => r.filename)), [realTopK]);
  const hits = selected.filter((f) => realFilenames.has(f)).length;

  const cutoffDoc = allRanked[TOP_K - 1];
  const nextDoc = allRanked[TOP_K];
  const nearTie =
    cutoffDoc && nextDoc && Math.abs(cutoffDoc.similarity - nextDoc.similarity) <= NEAR_TIE_EPSILON
      ? { cutoffDoc, nextDoc }
      : null;

  function toggle(filename: string) {
    if (checked) return;
    setSelected((prev) => {
      if (prev.includes(filename)) return prev.filter((f) => f !== filename);
      if (prev.length >= TOP_K) return prev;
      return [...prev, filename];
    });
  }

  function reset() {
    setSelected([]);
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-light/20 bg-blue-primary/10 p-3.5 text-sm leading-relaxed text-slate-300">
        Clique (ou arraste) até {TOP_K} documentos que você acha mais parecidos com a pergunta —
        é o que o banco vetorial faria. Depois compare com o ranking real de similaridade.
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sua seleção (Top-{TOP_K}): {selected.length}/{TOP_K}
        </p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const filename = e.dataTransfer.getData('text/plain');
            if (filename) toggle(filename);
          }}
          className="flex min-h-[52px] flex-wrap gap-2 rounded-lg border border-dashed border-white/15 bg-navy-950/40 p-3"
        >
          {selected.length === 0 && (
            <p className="text-sm text-slate-600">Nenhum documento selecionado ainda.</p>
          )}
          {selected.map((filename) => {
            const doc = documents.find((d) => d.filename === filename)!;
            const isHit = checked && realFilenames.has(filename);
            const isMiss = checked && !realFilenames.has(filename);
            return (
              <button
                key={filename}
                onClick={() => toggle(filename)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  isHit
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                    : isMiss
                      ? 'border-red-500/40 bg-red-500/15 text-red-400'
                      : 'border-blue-light/40 bg-blue-primary/15 text-blue-glow'
                }`}
              >
                {checked && (isHit ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />)}
                {doc.filename}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Todos os documentos
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pool.map((doc) => {
            const isSelected = selected.includes(doc.filename);
            return (
              <button
                key={doc.id}
                draggable={!checked}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', doc.filename)}
                onClick={() => toggle(doc.filename)}
                disabled={checked}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'border-blue-primary/50 bg-blue-primary/10'
                    : 'border-white/10 bg-navy-800/50 hover:border-white/25'
                } disabled:cursor-default`}
              >
                <p className="font-medium text-white">{doc.title}</p>
                <TermHighlight
                  text={doc.content}
                  questionTokens={qTokens}
                  className="mt-0.5 text-xs text-slate-500 [&_p]:line-clamp-2"
                />
              </button>
            );
          })}
        </div>
      </div>

      {!checked ? (
        <button
          onClick={() => {
            setChecked(true);
            onCheck?.();
          }}
          disabled={selected.length === 0}
          className="w-full rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-6 py-3 font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Comparar com a IA
        </button>
      ) : (
        <div className="space-y-4">
          <ScoreBanner
            score={hits}
            max={TOP_K}
            message={`Você acertou ${hits} de ${TOP_K} documentos que o banco vetorial realmente traria.`}
            onRetry={reset}
          />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ranking real de similaridade
            </p>
            <ol className="space-y-1.5">
              {realTopK.map((item, i) => (
                <li
                  key={item.documentId}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                    selected.includes(item.filename)
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/10 bg-navy-950/40'
                  }`}
                >
                  <span className="text-slate-200">
                    {i + 1}. {item.filename}
                  </span>
                  <span className="font-mono text-slate-400">{item.similarity.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </div>

          {nearTie && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-200">
              <p className="mb-1.5 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Empate técnico no corte do Top-{TOP_K}
              </p>
              <p>
                <strong>{nearTie.cutoffDoc.filename}</strong> (rank {TOP_K}, score{' '}
                {nearTie.cutoffDoc.similarity.toFixed(2)}) e{' '}
                <strong>{nearTie.nextDoc.filename}</strong> (rank {TOP_K + 1}, score{' '}
                {nearTie.nextDoc.similarity.toFixed(2)}) estão a apenas{' '}
                {Math.abs(nearTie.cutoffDoc.similarity - nearTie.nextDoc.similarity).toFixed(2)}{' '}
                de diferença. Na prática, {nearTie.nextDoc.filename} ficou de fora só por causa
                dessa margem mínima — que pode ser puro ruído do modelo de embeddings. Um Top-K
                fixo corta com essa mesma frieza mesmo quando dois documentos são quase igualmente
                relevantes, o que é arriscado quando a resposta certa depende do que ficou cortado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

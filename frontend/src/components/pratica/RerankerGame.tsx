import { useMemo, useState, useEffect } from 'react';
import { Flame, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import DragList from './DragList';
import ScoreBanner from './ScoreBanner';
import TermHighlight from './TermHighlight';
import WeightAdjuster from './WeightAdjuster';
import { mockRetrieve, mockRerank, tokenize } from '../../lib/mockRag';
import { getDocumentByFilename } from '../../data/documents';
import { CONFLICT_QUESTION, conflictVectorOrder } from '../../data/practiceConflict';
import type { RetrievalItem } from '../../types/rag';
import type { ConflictDoc } from '../../data/practiceConflict';

const KEEP_N = 2;

function VectorOrderPanel({
  items,
}: {
  items: { key: string; filename: string; score: number }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Ordem da busca vetorial (antes do reranking)
      </p>
      <ol className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={item.key}
            className="flex items-center justify-between rounded-md border border-white/5 bg-navy-950/40 px-3 py-2 text-sm"
          >
            <span className="text-slate-300">
              {i + 1}. {item.filename}
            </span>
            <span className="font-mono text-slate-400">{item.score.toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SourceBadge({ doc }: { doc: ConflictDoc }) {
  const tone =
    doc.sourceType === 'oficial'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {doc.sourceLabel}
    </span>
  );
}

function NormalMode({ question, onCheck }: { question: string; onCheck?: () => void }) {
  const realRetrieval = useMemo(() => mockRetrieve(question, 5), [question]);
  const [order, setOrder] = useState<RetrievalItem[]>(realRetrieval);
  const [checked, setChecked] = useState(false);
  const [showWeights, setShowWeights] = useState(false);

  const qTokens = useMemo(() => tokenize(question), [question]);

  useEffect(() => {
    setOrder(realRetrieval);
    setChecked(false);
    setShowWeights(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const realRerank = useMemo(
    () => mockRerank(realRetrieval, question, KEEP_N),
    [realRetrieval, question],
  );
  const realKeptFilenames = new Set(realRerank.after.map((r) => r.filename));

  const studentTop2 = order.slice(0, KEEP_N).map((r) => r.filename);
  const hits = studentTop2.filter((f) => realKeptFilenames.has(f)).length;
  const exactOrder =
    order[0]?.filename === realRerank.after[0]?.filename &&
    order[1]?.filename === realRerank.after[1]?.filename;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-light/20 bg-blue-primary/10 p-3.5 text-sm leading-relaxed text-slate-300">
        Estes {realRetrieval.length} documentos já foram recuperados pelo banco vetorial (Etapa
        03). Agora faça o papel do reranker: arraste para reordenar por relevância <em>real</em>
        {' '}para a pergunta — os dois primeiros são os que sobreviveriam ao reranking.
      </div>

      <VectorOrderPanel
        items={realRetrieval.map((r) => ({ key: r.documentId, filename: r.filename, score: r.similarity }))}
      />

      <DragList
        items={order}
        onReorder={(next) => {
          setOrder(next);
          setChecked(false);
        }}
        getKey={(item) => item.documentId}
        disabled={checked}
        itemClassName={(item, i) => {
          if (!checked) return '';
          if (i >= KEEP_N) return '';
          return realKeptFilenames.has(item.filename)
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-red-500/40 bg-red-500/10';
        }}
        renderItem={(item, i) => {
          const doc = getDocumentByFilename(item.filename);
          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{item.filename}</p>
                  <p className="text-xs text-slate-500">{item.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {i < KEEP_N && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
                      mantido
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate-500">
                    score vetorial {item.similarity.toFixed(2)}
                  </span>
                </div>
              </div>
              {doc && (
                <TermHighlight
                  text={doc.content}
                  questionTokens={qTokens}
                  className="text-xs text-slate-500 [&_p]:line-clamp-2"
                />
              )}
            </div>
          );
        }}
      />

      {!checked ? (
        <button
          onClick={() => {
            setChecked(true);
            onCheck?.();
          }}
          className="w-full rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-6 py-3 font-semibold text-white shadow-lg shadow-blue-primary/25 sm:w-auto"
        >
          Verificar
        </button>
      ) : (
        <div className="space-y-4">
          <ScoreBanner
            score={hits}
            max={KEEP_N}
            message={
              exactOrder
                ? 'Você acertou a ordem exata que o reranker real produziria!'
                : `${hits} dos ${KEEP_N} documentos que você colocou no topo são os que o reranker realmente manteria.`
            }
            onRetry={() => {
              setOrder(realRetrieval);
              setChecked(false);
              setShowWeights(false);
            }}
          />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ordem real após o reranking
            </p>
            <ol className="space-y-1.5">
              {realRerank.after.map((item, i) => (
                <li
                  key={item.documentId}
                  className="flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm"
                >
                  <span className="text-slate-200">
                    {i + 1}. {item.filename}
                  </span>
                  <span className="font-mono text-emerald-400">{item.rerankScore.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </div>

          {!showWeights ? (
            <button
              onClick={() => setShowWeights(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-glow hover:text-blue-light"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ajustar pesos manualmente
            </button>
          ) : (
            <WeightAdjuster question={question} retrieval={realRetrieval} />
          )}
        </div>
      )}
    </div>
  );
}

function ConflictMode({ onExit }: { onExit: () => void }) {
  const vectorOrder = useMemo(() => conflictVectorOrder(), []);
  const [order, setOrder] = useState<ConflictDoc[]>(vectorOrder);
  const [checked, setChecked] = useState(false);
  const qTokens = useMemo(() => tokenize(CONFLICT_QUESTION), []);

  const keptDocs = order.slice(0, KEEP_N);
  const forumKept = keptDocs.some((d) => d.sourceType === 'forum');
  const forumOnTop = keptDocs[0]?.sourceType === 'forum';

  function reset() {
    setOrder(vectorOrder);
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para perguntas normais
      </button>

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3.5 text-sm leading-relaxed text-amber-100">
        Pergunta: <strong>"{CONFLICT_QUESTION}"</strong>. Um dos documentos abaixo tem
        altíssima similaridade textual com a pergunta, mas é um post de fórum não oficial de
        2019 — e contradiz o documento oficial sobre o mesmo assunto. Reordene pensando: o
        reranking deveria ser só sobre similaridade, ou também sobre confiabilidade da fonte?
      </div>

      <VectorOrderPanel
        items={vectorOrder.map((d) => ({ key: d.documentId, filename: d.filename, score: d.vectorScore }))}
      />

      <DragList
        items={order}
        onReorder={(next) => {
          setOrder(next);
          setChecked(false);
        }}
        getKey={(item) => item.documentId}
        disabled={checked}
        itemClassName={(item, i) => {
          if (!checked || i >= KEEP_N) return '';
          return item.sourceType === 'forum'
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-emerald-500/40 bg-emerald-500/10';
        }}
        renderItem={(item, i) => (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-white">{item.filename}</p>
                <p className="text-xs text-slate-500">{item.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {i < KEEP_N && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
                    mantido
                  </span>
                )}
                <span className="font-mono text-xs text-slate-500">
                  score vetorial {item.vectorScore.toFixed(2)}
                </span>
              </div>
            </div>
            <SourceBadge doc={item} />
            <TermHighlight
              text={item.content}
              questionTokens={qTokens}
              className="text-xs text-slate-500 [&_p]:line-clamp-2"
            />
          </div>
        )}
      />

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          className="w-full rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-6 py-3 font-semibold text-white shadow-lg shadow-blue-primary/25 sm:w-auto"
        >
          Revelar implicação da sua escolha
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-navy-950/50 p-4 text-sm leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100">O que sua ordem significa na prática</p>
          {forumOnTop ? (
            <p>
              Você manteve o <strong>post de fórum</strong> (2019, não oficial) no topo. Ele tem a
              maior similaridade textual — repete várias vezes as palavras da pergunta — mas
              contradiz o documento oficial, que diz que o trancamento pode ser feito a qualquer
              momento pelo Portal do Aluno, sem exigir atestado presencial. Em produção, confiar
              só na similaridade pode fazer a IA responder com informação errada e desatualizada.
            </p>
          ) : forumKept ? (
            <p>
              Você não colocou o post de fórum no topo, mas ele ainda entra no contexto enviado
              para a LLM — o que pode contaminar a resposta com informação desatualizada mesmo
              sem estar em primeiro lugar.
            </p>
          ) : (
            <p>
              Você priorizou as fontes oficiais mesmo com similaridade textual menor que o post de
              fórum. É a abordagem mais comum em RAG de produção: um reranker que combina
              similaridade com um fator de confiabilidade/autoridade da fonte, não só o quanto o
              texto "parece" com a pergunta.
            </p>
          )}
          <p className="text-xs text-slate-500">
            Não existe uma única resposta "certa" aqui — é uma decisão de produto real em sistemas
            RAG: times diferentes pesam esse trade-off de formas diferentes.
          </p>
          <button
            onClick={reset}
            className="text-xs font-medium text-blue-glow hover:text-blue-light"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}

export default function RerankerGame({
  question,
  onCheck,
}: {
  question: string;
  onCheck?: () => void;
}) {
  const [mode, setMode] = useState<'normal' | 'conflict'>('normal');

  if (mode === 'conflict') {
    return <ConflictMode onExit={() => setMode('normal')} />;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setMode('conflict')}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-500/15 sm:w-auto"
      >
        <Flame className="h-4 w-4" />
        Desafio: confiabilidade vs. similaridade (bônus, opcional)
      </button>
      <NormalMode question={question} onCheck={onCheck} />
    </div>
  );
}

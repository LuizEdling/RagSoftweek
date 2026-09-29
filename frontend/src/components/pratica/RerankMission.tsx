import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import ScoreBanner from './ScoreBanner';
import { ActionRow, CodeReveal, DoneNote, MissionCard } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { getDocumentByFilename } from '../../data/documents';
import { CONFLICT_DOCS, CONFLICT_QUESTION } from '../../data/practiceConflict';
import type { ConflictDoc } from '../../data/practiceConflict';
import { keepFiles, nearest, scenarioFor } from '../../data/practiceScenarios';
import type { Verdict } from '../../data/practiceScenarios';
import { excerptFor } from '../../lib/mockRag';

const MAX_PICKS = 2;
const CONFLICT_ANSWER_ID = '017';

const VERDICT_STYLE: Record<Verdict, { label: string; tone: string }> = {
  answers: { label: 'Responde a pergunta', tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  helps: { label: 'Ajuda a responder', tone: 'border-blue-light/40 bg-blue-primary/10 text-blue-glow' },
  noise: { label: 'Só parece parecido', tone: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
};

// Documentos da rodada extra: o post de fórum tem a maior similaridade, mas
// não é uma fonte confiável. (Os outros dois são documentos oficiais.)
const CONFLICT_ROUND: ConflictDoc[] = CONFLICT_DOCS.filter((d) =>
  ['forum-trancamento', CONFLICT_ANSWER_ID, '001'].includes(d.documentId),
).sort((a, b) => b.vectorScore - a.vectorScore);

export default function RerankMission({ question, alreadyDone, onComplete }: MissionProps) {
  const scenario = scenarioFor(question);
  const keep = useMemo(() => keepFiles(scenario), [scenario]);
  const order = useMemo(() => nearest(scenario.pin, scenario.retrieved.length).map((n) => n.file), [scenario]);

  const [picks, setPicks] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [round1Score, setRound1Score] = useState(0);
  const [pick2, setPick2] = useState<string | null>(null);
  const [checked2, setChecked2] = useState(false);

  const right = picks.filter((f) => keep.includes(f)).length;
  const wrong = picks.length - right;
  const computedScore = Math.max(0, right - wrong);

  function toggle(file: string) {
    if (checked) return;
    setPicks((prev) => {
      if (prev.includes(file)) return prev.filter((f) => f !== file);
      if (prev.length >= MAX_PICKS) return prev;
      return [...prev, file];
    });
  }

  function check() {
    setChecked(true);
    setRound1Score(computedScore);
  }

  function giveUp() {
    setPicks([]);
    setChecked(true);
    setRound1Score(0);
  }

  function retry() {
    setPicks([]);
    setChecked(false);
    setRound1Score(0);
    setPick2(null);
    setChecked2(false);
  }

  function check2() {
    if (!pick2) return;
    setChecked2(true);
    onComplete(round1Score + (pick2 === CONFLICT_ANSWER_ID ? 1 : 0), keep.length + 1);
  }

  function giveUp2() {
    setPick2(null);
    setChecked2(true);
    onComplete(round1Score, keep.length + 1);
  }

  return (
    <div className="space-y-6">
      <MissionCard
        role="o reranker"
        fn={`reranquear(pergunta, ${scenario.retrieved.length} candidatos) → os melhores (até ${MAX_PICKS})`}
        receive={
          <>
            a pergunta <strong>"{question}"</strong> e os {scenario.retrieved.length} documentos que a busca vetorial trouxe
          </>
        }
        task={`Leia cada documento e escolha os que a LLM realmente precisa para responder (no máximo ${MAX_PICKS}). Estar perto no mapa não basta: o documento tem que ajudar.`}
        scoring="+1 por documento certo, −1 por documento desnecessário."
      />
      <DoneNote show={alreadyDone && !checked} />

      <div className="grid gap-3 sm:grid-cols-2">
        {order.map((file, i) => {
          const doc = getDocumentByFilename(file)!;
          const item = scenario.retrieved.find((r) => r.file === file)!;
          const isPicked = picks.includes(file);
          const style = VERDICT_STYLE[item.verdict];
          return (
            <button
              key={file}
              onClick={() => toggle(file)}
              disabled={checked}
              aria-pressed={isPicked}
              className={`flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors ${
                isPicked
                  ? 'border-blue-light/60 bg-blue-primary/15'
                  : 'border-white/10 bg-navy-800/50 hover:bg-white/5'
              } disabled:cursor-default`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{doc.title}</p>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                  #{i + 1} na busca
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-500">{file}</p>
              <p className="text-xs leading-relaxed text-slate-400">{excerptFor(file)}</p>
              {isPicked && !checked && (
                <span className="flex items-center gap-1 text-xs font-medium text-blue-glow">
                  <Check className="h-3.5 w-3.5" /> escolhido
                </span>
              )}
              {checked && (
                <div className={`rounded-md border px-2.5 py-2 text-xs leading-relaxed ${style.tone}`}>
                  <p className="font-semibold">
                    {style.label}
                    {isPicked ? ' · você escolheu' : ''}
                  </p>
                  <p className="mt-0.5 opacity-90">{item.why}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <ActionRow
        canCheck={picks.length >= 1}
        checked={checked}
        onCheck={check}
        onGiveUp={giveUp}
        hint="Escolha pelo menos 1 documento."
      />

      {checked && (
        <div className="space-y-3">
          <ScoreBanner
            score={round1Score}
            max={keep.length}
            message={
              round1Score === keep.length
                ? 'Isso! Você separou o que responde do que só parece parecido.'
                : 'A busca vetorial é rápida, mas aproximada — o reranker olha o conteúdo de perto e descarta o que só parece parecido.'
            }
            onRetry={retry}
          />
          <CodeReveal file="backend/app/services/reranker_service.py (trecho)">
            {`title_overlap = len(set(_tokenize(doc.title)) & q_tokens)
body_overlap  = len(set(_tokenize(doc.content)) & q_tokens)
boost = title_overlap * 0.08 + min(body_overlap * 0.015, 0.1)
score = max(0.05, min(0.99, r.similarity + boost))
# ordena pelo novo score e mantém só os \`rerank_keep\` melhores.
# Com RERANKER_MODE=external, um modelo de rerank (Cohere) lê pergunta
# e documento juntos — bem mais preciso que contar palavras.`}
          </CodeReveal>
        </div>
      )}

      {checked && (
        <div className="fade-in-up space-y-4 border-t border-white/10 pt-6">
          <MissionCard
            role="o reranker, rodada extra"
            fn="reranquear(pergunta, candidatos) → 1 documento confiável"
            receive={
              <>
                a pergunta <strong>"{CONFLICT_QUESTION}"</strong>. A busca vetorial trouxe estes 3 — repare
                na similaridade e na origem de cada um
              </>
            }
            task="Escolha 1 documento para mandar à LLM. Lembre: a LLM vai repetir o que estiver aí."
            scoring="1 ponto se você escolher a fonte que responde e é confiável."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {CONFLICT_ROUND.map((doc) => {
              const isPicked = pick2 === doc.documentId;
              const official = doc.sourceType === 'oficial';
              return (
                <button
                  key={doc.documentId}
                  onClick={() => !checked2 && setPick2(doc.documentId)}
                  disabled={checked2}
                  aria-pressed={isPicked}
                  className={`flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors ${
                    isPicked
                      ? 'border-blue-light/60 bg-blue-primary/15'
                      : 'border-white/10 bg-navy-800/50 hover:bg-white/5'
                  } disabled:cursor-default`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        official
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {doc.sourceLabel}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{doc.vectorScore.toFixed(2)}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{doc.title}</p>
                  <p className="text-xs leading-relaxed text-slate-400">{doc.content}</p>
                  {checked2 && isPicked && <span className="text-xs font-medium text-blue-glow">você escolheu</span>}
                </button>
              );
            })}
          </div>

          <ActionRow
            canCheck={pick2 !== null}
            checked={checked2}
            onCheck={check2}
            onGiveUp={giveUp2}
            hint="Escolha 1 documento."
          />

          {checked2 && (
            <ScoreBanner
              score={pick2 === CONFLICT_ANSWER_ID ? 1 : 0}
              max={1}
              message={
                pick2 === CONFLICT_ANSWER_ID
                  ? 'Certo! O documento oficial responde e é confiável, mesmo com similaridade menor.'
                  : 'O post do fórum ganhou na similaridade (0.93), mas é opinião de aluno de 2019 — prazos e regras podem estar errados. Reranking também é sobre confiabilidade da fonte: o oficial é o que responde ("qualquer momento do semestre, vaga preservada por até 4 semestres").'
              }
              onRetry={() => {
                setPick2(null);
                setChecked2(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

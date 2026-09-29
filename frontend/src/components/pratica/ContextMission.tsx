import { useState } from 'react';
import ScoreBanner from './ScoreBanner';
import { ActionRow, CodeReveal, DoneNote, MissionCard, PromptBox } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { getDocumentByFilename } from '../../data/documents';
import { scenarioFor } from '../../data/practiceScenarios';
import { sentencesOf } from '../../lib/sentences';

const SLOTS = 2;

export default function ContextMission({ question, alreadyDone, onComplete }: MissionProps) {
  const scenario = scenarioFor(question);
  const doc = getDocumentByFilename(scenario.answerFile)!;
  const sentences = sentencesOf(doc.content);

  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const hits = selected.filter((i) => scenario.contextKeep.includes(i)).length;
  const ordered = [...selected].sort((a, b) => a - b);

  function toggle(i: number) {
    if (checked) return;
    setSelected((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= SLOTS) return prev;
      return [...prev, i];
    });
  }

  function check() {
    setChecked(true);
    onComplete(hits, SLOTS);
  }

  function giveUp() {
    setSelected([]);
    setChecked(true);
    onComplete(0, SLOTS);
  }

  function retry() {
    setSelected([]);
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <MissionCard
        role="o montador de contexto"
        fn={`montar_contexto(documento, limite=${SLOTS} frases) → texto para o prompt`}
        receive={
          <>
            o documento <strong>{doc.title}</strong> (<span className="font-mono">{doc.filename}</span>), o melhor
            que o reranker escolheu
          </>
        }
        task={`A LLM só aceita ${SLOTS} frases de contexto (a "janela de contexto" é limitada). Escolha as ${SLOTS} mais úteis para responder a pergunta.`}
        scoring={`1 ponto por frase certa (máximo ${SLOTS}).`}
      />
      <DoneNote show={alreadyDone && !checked} />

      <p className="text-sm text-slate-400">
        Frases escolhidas: <strong className="text-slate-200">{selected.length}</strong>/{SLOTS}
      </p>

      <div className="space-y-2">
        {sentences.map((s, i) => {
          const isSelected = selected.includes(i);
          const essential = scenario.contextKeep.includes(i);
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              disabled={checked}
              aria-pressed={isSelected}
              className={`block w-full rounded-lg border p-3 text-left text-sm leading-relaxed transition-colors ${
                checked
                  ? essential
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-200'
                    : 'border-white/10 bg-navy-800/40 text-slate-400'
                  : isSelected
                    ? 'border-blue-light/60 bg-blue-primary/15 text-white'
                    : 'border-white/10 bg-navy-800/50 text-slate-300 hover:bg-white/5'
              } disabled:cursor-default`}
            >
              <span className="mr-2 font-mono text-xs text-slate-500">{i + 1}.</span>
              {s}
              {checked && (
                <span
                  className={`mt-1.5 block text-xs ${essential ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  {isSelected ? (essential ? '✔ você escolheu · ' : '✗ você escolheu · ') : ''}
                  {scenario.contextWhy[i]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <PromptBox title="O prompt que você está montando">
        {`CONTEXTO:\n${
          ordered.length > 0
            ? `[${doc.filename}] ${ordered.map((i) => sentences[i]).join(' ')}`
            : '(nenhuma frase escolhida ainda)'
        }\n\nPERGUNTA:\n${question}`}
      </PromptBox>

      <ActionRow
        canCheck={selected.length === SLOTS}
        checked={checked}
        onCheck={check}
        onGiveUp={giveUp}
        hint={`Escolha ${SLOTS} frases.`}
      />

      {checked && (
        <div className="space-y-3">
          <ScoreBanner
            score={hits}
            max={SLOTS}
            message={
              hits === SLOTS
                ? 'Isso! Menos é mais: só o que ajuda a responder, sem gastar a janela da LLM.'
                : 'Contexto demais confunde a LLM e custa mais; de menos, ela inventa. O verde é o que mais ajudava.'
            }
            onRetry={retry}
          />
          <CodeReveal file="backend/app/services/rag_pipeline.py (trecho)">
            {`def _excerpt(document_id: str) -> str:
    doc = get_document(document_id)
    # aqui o backend pega as 2 primeiras frases do documento
    first_two_sentences = ". ".join(doc.content.split(". ")[:2])
    ...

context_block = "\\n".join(f"[{c.filename}] {c.excerpt}" for c in context)
# esse texto vai dentro do prompt, ao lado da pergunta.`}
          </CodeReveal>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import ScoreBanner from './ScoreBanner';
import { CodeReveal, DoneNote, MissionCard, PromptBox } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { getDocumentByFilename } from '../../data/documents';
import { scenarioFor } from '../../data/practiceScenarios';
import { sentencesOf } from '../../lib/sentences';

const LETTERS = ['A', 'B', 'C'];

type Stage = 'blind' | 'context' | 'done';

export default function LlmMission({ question, alreadyDone, onComplete }: MissionProps) {
  const scenario = scenarioFor(question);
  const doc = getDocumentByFilename(scenario.answerFile)!;
  const sentences = sentencesOf(doc.content);
  const contextText = `[${doc.filename}] ${scenario.contextKeep.map((i) => sentences[i]).join(' ')}`;
  const correctIndex = scenario.llmOptions.findIndex((o) => o.correct);

  const [stage, setStage] = useState<Stage>('blind');
  const [choice, setChoice] = useState<number | null>(null);
  const [blindChoice, setBlindChoice] = useState<number | null>(null);
  const [contextChoice, setContextChoice] = useState<number | null>(null);

  function lock() {
    if (choice === null) return;
    if (stage === 'blind') {
      setBlindChoice(choice);
      setChoice(null);
      setStage('context');
    } else if (stage === 'context') {
      setContextChoice(choice);
      setStage('done');
      onComplete(choice === correctIndex ? 1 : 0, 1);
    }
  }

  function giveUp() {
    setContextChoice(null);
    setStage('done');
    onComplete(0, 1);
  }

  function retry() {
    setStage('blind');
    setChoice(null);
    setBlindChoice(null);
    setContextChoice(null);
  }

  const hasContext = stage !== 'blind';
  const done = stage === 'done';
  const gotIt = contextChoice === correctIndex;

  return (
    <div className="space-y-4">
      <MissionCard
        role="a LLM"
        fn="gerar_resposta(prompt) → resposta"
        receive="um prompt com a pergunta — primeiro sem nenhum contexto, depois com o contexto que você montou"
        task="Responda duas vezes à mesma pergunta, escolhendo a resposta que você daria. Primeiro no escuro; depois lendo o contexto."
        scoring="1 ponto se acertar com o contexto. (Sem contexto ninguém tem como saber — é de propósito.)"
      />
      <DoneNote show={alreadyDone && stage === 'blind'} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PromptBox title={hasContext ? 'Prompt 2 — com contexto' : 'Prompt 1 — sem contexto'}>
          {`CONTEXTO:\n${hasContext ? contextText : '(vazio)'}\n\nPERGUNTA:\n${question}`}
        </PromptBox>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {done
              ? 'As respostas possíveis'
              : stage === 'blind'
                ? 'Que resposta você daria? (sem contexto, é um chute)'
                : 'E agora, com o contexto?'}
          </p>
          {scenario.llmOptions.map((opt, i) => {
            const isCorrect = i === correctIndex;
            const picked = choice === i;
            return (
              <button
                key={i}
                onClick={() => !done && setChoice(i)}
                disabled={done}
                aria-pressed={picked}
                className={`flex w-full gap-3 rounded-lg border p-3 text-left text-sm leading-relaxed transition-colors ${
                  done
                    ? isCorrect
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-200'
                      : 'border-white/10 bg-navy-800/40 text-slate-400'
                    : picked
                      ? 'border-blue-light/60 bg-blue-primary/15 text-white'
                      : 'border-white/10 bg-navy-800/50 text-slate-300 hover:bg-white/5'
                } disabled:cursor-default`}
              >
                <span className="font-mono text-xs font-bold text-blue-glow">{LETTERS[i]}</span>
                <span>
                  {opt.text}
                  {done && (
                    <span
                      className={`mt-1 block text-xs ${isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}
                    >
                      {isCorrect
                        ? 'Bate com o contexto recuperado.'
                        : 'Contradiz o contexto (ou não está nele).'}
                      {blindChoice === i ? ' · sua escolha sem contexto' : ''}
                      {contextChoice === i ? ' · sua escolha com contexto' : ''}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!done && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={lock}
            disabled={choice === null}
            className="rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {stage === 'blind' ? 'Responder no escuro' : 'Responder com o contexto'}
          </button>
          {stage === 'context' && (
            <button
              onClick={giveUp}
              className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Estou travado — mostrar a resposta
            </button>
          )}
        </div>
      )}

      {stage === 'context' && (
        <p className="rounded-lg border border-blue-light/20 bg-blue-primary/10 p-3 text-sm text-slate-300">
          Sua resposta no escuro ficou registrada
          {blindChoice !== null ? ` (${LETTERS[blindChoice]})` : ''}. Agora o prompt chegou com o
          contexto recuperado — escolha de novo.
        </p>
      )}

      {done && (
        <div className="space-y-3">
          <ScoreBanner
            score={gotIt ? 1 : 0}
            max={1}
            message={
              contextChoice === null
                ? 'A resposta certa é a que bate com o contexto recuperado.'
                : gotIt
                  ? blindChoice === correctIndex
                    ? 'Você acertou nas duas — mas sem contexto uma LLM de verdade só acertaria por sorte: ela não conhece as regras desta universidade.'
                    : 'Sem contexto você chutou; com o contexto a resposta certa ficou óbvia. É isso que o RAG dá à LLM: informação para responder sem inventar.'
                  : 'Mesmo com o contexto na mão, escolheu outra. Releia o prompt: a resposta tem que sair do que está lá, não do que parece razoável.'
            }
            onRetry={retry}
          />
          <p className="text-sm leading-relaxed text-slate-400">
            As respostas erradas soam <strong>plausíveis</strong> — é assim que uma LLM "alucina": ela
            completa o texto com o que parece razoável. Com contexto, ela tem onde se apoiar.
          </p>
          <CodeReveal file="backend/app/services/llm_service.py (trecho)">
            {`{"role": "system", "content": "Você é um assistente acadêmico."},
{"role": "user", "content":
    f"CONTEXTO:\\n{context_block}\\n\\n"      # o que o RAG recuperou
    f"PERGUNTA:\\n{question}\\n\\n"
    "Responda utilizando o contexto fornecido."}
# a LLM real recebe exatamente o prompt que você acabou de ler.`}
          </CodeReveal>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import ScoreBanner from './ScoreBanner';
import { ActionRow, CodeReveal, DoneNote, MissionCard } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { getDocumentByFilename } from '../../data/documents';
import { SCENARIOS, scenarioFor } from '../../data/practiceScenarios';
import { sentencesOf } from '../../lib/sentences';

export default function AuditMission({ question, alreadyDone, onComplete }: MissionProps) {
  const scenario = scenarioFor(question);
  const doc = getDocumentByFilename(scenario.answerFile)!;

  // A resposta da LLM = a resposta certa + uma frase inventada, escondida numa
  // posição que varia por pergunta (nunca a primeira, para não denunciar).
  const { claims, inventedIndex } = useMemo(() => {
    const correct = scenario.llmOptions.find((o) => o.correct)!.text;
    const base = sentencesOf(correct);
    const at = 1 + (SCENARIOS.indexOf(scenario) % base.length);
    const all = [...base.slice(0, at), scenario.invented.text, ...base.slice(at)];
    return { claims: all, inventedIndex: at };
  }, [scenario]);

  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const hit = picked === inventedIndex;

  function check() {
    if (picked === null) return;
    setChecked(true);
    onComplete(hit ? 1 : 0, 1);
  }

  function giveUp() {
    setPicked(null);
    setChecked(true);
    onComplete(0, 1);
  }

  function retry() {
    setPicked(null);
    setChecked(false);
  }

  return (
    <div className="space-y-4">
      <MissionCard
        role="o auditor de respostas"
        fn="verificar_fontes(resposta, fontes) → afirmação sem fonte"
        receive="a resposta que a LLM gerou e os documentos que ela recebeu como fonte"
        task="Uma das frases da resposta foi inventada pela LLM: não está em nenhuma fonte. Ache e clique nela."
        scoring="1 ponto se você achar a frase inventada."
      />
      <DoneNote show={alreadyDone && !checked} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Resposta da LLM — clique na frase sem fonte
          </p>
          {claims.map((c, i) => {
            const isInvented = i === inventedIndex;
            const isPicked = picked === i;
            return (
              <button
                key={i}
                onClick={() => !checked && setPicked(i)}
                disabled={checked}
                aria-pressed={isPicked}
                className={`block w-full rounded-lg border p-3 text-left text-sm leading-relaxed transition-colors ${
                  checked
                    ? isInvented
                      ? 'border-red-500/40 bg-red-500/10 text-slate-200'
                      : 'border-emerald-500/30 bg-emerald-500/5 text-slate-300'
                    : isPicked
                      ? 'border-blue-light/60 bg-blue-primary/15 text-white'
                      : 'border-white/10 bg-navy-800/50 text-slate-300 hover:bg-white/5'
                } disabled:cursor-default`}
              >
                <span className="mr-2 font-mono text-xs text-slate-500">{i + 1}.</span>
                {c}
                {checked && (
                  <span
                    className={`mt-1 block text-xs ${isInvented ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {isInvented
                      ? `Inventada! ${scenario.invented.why}`
                      : '✔ Sustentada pela fonte.'}
                    {isPicked ? ' · você marcou' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fonte recebida pela LLM
          </p>
          <div className="rounded-lg border border-white/10 bg-navy-800/50 p-3.5">
            <p className="text-sm font-semibold text-white">{doc.title}</p>
            <p className="mb-2 font-mono text-[11px] text-slate-500">{doc.filename}</p>
            <p className="text-sm leading-relaxed text-slate-400">{doc.content}</p>
          </div>
        </div>
      </div>

      <ActionRow
        canCheck={picked !== null}
        checked={checked}
        onCheck={check}
        onGiveUp={giveUp}
        hint="Clique na frase suspeita."
      />

      {checked && (
        <div className="space-y-3">
          <ScoreBanner
            score={hit ? 1 : 0}
            max={1}
            message={
              hit
                ? 'Achou! Foi só comparar cada afirmação com a fonte — só isso já é verificável.'
                : 'A frase inventada é a marcada em vermelho: não tem apoio na fonte, mas soa natural no meio das outras.'
            }
            onRetry={retry}
          />
          <p className="text-sm leading-relaxed text-slate-400">
            Esse é o valor do RAG: a resposta vem com as <strong>fontes</strong>, então qualquer
            afirmação pode ser conferida no documento original. Uma LLM sozinha não te dá isso.
          </p>
          <CodeReveal file="backend/app/services/rag_pipeline.py (trecho)">
            {`sources = [
    SourceUsed(document_id=c.document_id, filename=c.filename,
               title=c.title, excerpt=c.excerpt)
    for c in context
]
...
return QueryResponse(..., answer=answer, sources=sources)
# a API devolve a resposta junto com as fontes usadas.`}
          </CodeReveal>
        </div>
      )}
    </div>
  );
}

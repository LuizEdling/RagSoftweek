import { useMemo, useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import ScoreBanner from './ScoreBanner';
import { mockRetrieve, mockRerank } from '../../lib/mockRag';
import { getDocumentByFilename } from '../../data/documents';

// Mesma regra usada pelo pipeline "oficial" (mockRag.ts) para escolher o
// trecho de contexto: as duas primeiras frases do documento.
const CORRECT_SENTENCE_INDICES = [0, 1];

function splitSentences(content: string): string[] {
  const parts = content.split('. ');
  return parts.map((p, i) => (i < parts.length - 1 ? p + '.' : p));
}

export default function ContextBuilder({
  question,
  onCheck,
}: {
  question: string;
  onCheck?: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const targetDoc = useMemo(() => {
    const retrieval = mockRetrieve(question, 5);
    const { after } = mockRerank(retrieval, question, 1);
    const top = after[0];
    return top ? getDocumentByFilename(top.filename) : undefined;
  }, [question]);

  const sentences = useMemo(
    () => (targetDoc ? splitSentences(targetDoc.content) : []),
    [targetDoc],
  );

  useEffect(() => {
    setSelected([]);
    setChecked(false);
  }, [question]);

  function toggle(i: number) {
    if (checked) return;
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  const hits = selected.filter((i) => CORRECT_SENTENCE_INDICES.includes(i)).length;
  const extras = selected.filter((i) => !CORRECT_SENTENCE_INDICES.includes(i)).length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-light/20 bg-blue-primary/10 p-3.5 text-sm leading-relaxed text-slate-300">
        Este é o documento mais relevante para a pergunta escolhida. Clique nas frases que{' '}
        <strong>você</strong> enviaria como contexto para a LLM responder — é a Etapa 05 na
        prática. Menos é mais: só o que realmente ajuda a responder.
      </div>

      {targetDoc && (
        <div className="rounded-lg border border-white/10 bg-navy-800/60 p-4">
          <p className="mb-3 font-mono text-xs text-blue-glow">{targetDoc.filename}</p>
          <div className="space-y-2 leading-relaxed">
            {sentences.map((sentence, i) => {
              const isSelected = selected.includes(i);
              const isCorrect = checked && isSelected && CORRECT_SENTENCE_INDICES.includes(i);
              const isWrongPick = checked && isSelected && !CORRECT_SENTENCE_INDICES.includes(i);
              const isMissed = checked && !isSelected && CORRECT_SENTENCE_INDICES.includes(i);
              return (
                <span
                  key={i}
                  onClick={() => toggle(i)}
                  className={`inline cursor-pointer rounded px-1 py-0.5 transition-colors ${
                    isCorrect
                      ? 'bg-emerald-500/25 text-emerald-200'
                      : isWrongPick
                        ? 'bg-red-500/25 text-red-200'
                        : isMissed
                          ? 'bg-amber-500/20 text-amber-200 underline decoration-dotted'
                          : isSelected
                            ? 'bg-blue-primary/30 text-white'
                            : 'text-slate-300 hover:bg-white/5'
                  } ${checked ? 'cursor-default' : ''}`}
                >
                  {sentence}{' '}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {!checked ? (
        <button
          onClick={() => {
            setChecked(true);
            onCheck?.();
          }}
          disabled={selected.length === 0}
          className="w-full rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-6 py-3 font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Verificar
        </button>
      ) : (
        <ScoreBanner
          score={hits}
          max={CORRECT_SENTENCE_INDICES.length}
          message={
            extras === 0 && hits === CORRECT_SENTENCE_INDICES.length
              ? 'Exatamente o trecho que o pipeline usaria como contexto!'
              : `Verde = frases certas que você pegou. Amarelo sublinhado = frases que faltaram. Vermelho = selecionadas além do necessário (${extras}).`
          }
          onRetry={() => {
            setSelected([]);
            setChecked(false);
          }}
        />
      )}

      {checked && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          Na prática, um contexto mais enxuto custa menos e reduz o risco da LLM se distrair com
          informação irrelevante.
        </p>
      )}
    </div>
  );
}

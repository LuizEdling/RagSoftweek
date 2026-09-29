import { useMemo, useState } from 'react';
import { Bot, Search, User } from 'lucide-react';
import ScoreBanner from './ScoreBanner';
import { CodeReveal, DoneNote, MissionCard } from './MissionParts';
import type { MissionProps } from './MissionParts';
import { getDocumentByFilename } from '../../data/documents';
import { DUEL_ROUNDS } from '../../data/practiceScenarios';
import { excerptFor, mockKeywordSearch, tokenize } from '../../lib/mockRag';

const TOTAL = DUEL_ROUNDS.length;
// Posição do documento certo em cada rodada (embaralhada, sem padrão óbvio).
const TARGET_POSITIONS = [2, 0, 3, 1];

function sharedWords(question: string, file: string): string[] {
  const doc = getDocumentByFilename(file);
  if (!doc) return [];
  const docTokens = new Set(tokenize(doc.title + ' ' + doc.content + ' ' + doc.tags.join(' ')));
  return [...new Set(tokenize(question))].filter((t) => docTokens.has(t));
}

export default function DuelMission({ alreadyDone, onComplete }: MissionProps) {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [youCorrect, setYouCorrect] = useState(0);
  const [robotCorrect, setRobotCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const round = DUEL_ROUNDS[idx];
  const options = useMemo(() => {
    const arr: string[] = [...round.distractors];
    arr.splice(TARGET_POSITIONS[idx % TARGET_POSITIONS.length], 0, round.target);
    return arr;
  }, [round, idx]);
  const robot = useMemo(() => mockKeywordSearch(round.question, 1)[0], [round]);
  const robotShared = robot ? sharedWords(round.question, robot.filename) : [];
  const targetDoc = getDocumentByFilename(round.target)!;

  function reveal() {
    if (!choice) return;
    const you = choice === round.target ? 1 : 0;
    const bot = robot?.filename === round.target ? 1 : 0;
    setYouCorrect((n) => n + you);
    setRobotCorrect((n) => n + bot);
    setRevealed(true);
    if (idx === TOTAL - 1) {
      setFinished(true);
      onComplete(youCorrect + you, TOTAL);
    }
  }

  function next() {
    setIdx((i) => i + 1);
    setChoice(null);
    setRevealed(false);
  }

  function retry() {
    setIdx(0);
    setChoice(null);
    setRevealed(false);
    setYouCorrect(0);
    setRobotCorrect(0);
    setFinished(false);
  }

  return (
    <div className="space-y-4">
      <MissionCard
        role="mais esperto que o robô de palavras"
        fn="achar_documento(pergunta, 4 opções) → o que responde"
        receive={`${TOTAL} perguntas escritas com outras palavras — quase nenhuma palavra em comum com o documento certo`}
        task="Em cada rodada, escolha o documento que responde a pergunta. Depois compare com o robô de palavras (busca por palavra-chave) e com a busca vetorial."
        scoring={`1 ponto por rodada acertada (máximo ${TOTAL}).`}
      />
      <DoneNote show={alreadyDone && idx === 0 && !revealed} />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-blue-primary/15 px-3 py-1 font-medium text-blue-glow">
          Rodada {idx + 1} de {TOTAL}
        </span>
        <span className="text-slate-400">
          Você <strong className="text-slate-200">{youCorrect}</strong> × Robô de palavras{' '}
          <strong className="text-slate-200">{robotCorrect}</strong>
        </span>
      </div>

      <div className="rounded-lg border border-white/10 bg-navy-800/50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Pergunta do aluno</p>
        <p className="mt-1 text-lg font-medium text-white">"{round.question}"</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((file) => {
          const doc = getDocumentByFilename(file)!;
          const picked = choice === file;
          const isTarget = file === round.target;
          return (
            <button
              key={file}
              onClick={() => !revealed && setChoice(file)}
              disabled={revealed}
              aria-pressed={picked}
              className={`flex flex-col gap-1.5 rounded-lg border p-3.5 text-left transition-colors ${
                revealed
                  ? isTarget
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : picked
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-white/10 bg-navy-800/40'
                  : picked
                    ? 'border-blue-light/60 bg-blue-primary/15'
                    : 'border-white/10 bg-navy-800/50 hover:bg-white/5'
              } disabled:cursor-default`}
            >
              <p className="text-sm font-semibold text-white">{doc.title}</p>
              <p className="text-xs leading-relaxed text-slate-400">{excerptFor(file)}</p>
              {revealed && isTarget && <span className="text-xs font-medium text-emerald-400">✔ responde a pergunta</span>}
              {revealed && picked && !isTarget && <span className="text-xs font-medium text-red-400">você escolheu</span>}
            </button>
          );
        })}
      </div>

      {!revealed && (
        <button
          onClick={reveal}
          disabled={!choice}
          className="rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Escolher
        </button>
      )}

      {revealed && (
        <div className="fade-in-up space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-navy-800/50 p-3.5 text-sm">
              <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-200">
                <User className="h-4 w-4" /> Você
              </p>
              <p className={choice === round.target ? 'text-emerald-400' : 'text-red-400'}>
                {choice === round.target ? 'Acertou!' : 'Errou.'}
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3.5 text-sm">
              <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-400">
                <Search className="h-4 w-4" /> Robô de palavras
              </p>
              <p className="leading-relaxed text-slate-300">
                {!robot
                  ? 'Nenhum documento tem as palavras da pergunta, então não achou nada.'
                  : robot.filename === round.target
                    ? `Achou ${targetDoc.title}.`
                    : `Escolheu "${getDocumentByFilename(robot.filename)!.title}" só porque tem a palavra ${robotShared.join(', ')}.`}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 text-sm">
              <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-emerald-400">
                <Bot className="h-4 w-4" /> Busca vetorial
              </p>
              <p className="leading-relaxed text-slate-300">
                Acha <strong>{targetDoc.title}</strong>: os vetores ficam perto porque o assunto é o mesmo,
                mesmo sem palavras iguais.
              </p>
              <p className="mt-1 text-[11px] text-slate-500">simulação didática</p>
            </div>
          </div>

          {!finished && (
            <button
              onClick={next}
              className="rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-primary/25"
            >
              Próxima rodada
            </button>
          )}
        </div>
      )}

      {finished && (
        <div className="space-y-3">
          <ScoreBanner
            score={youCorrect}
            max={TOTAL}
            message={`O robô de palavras acertou ${robotCorrect} de ${TOTAL}. Busca por palavra-chave só acha o que usa as mesmas palavras; a vetorial acha o que tem o mesmo significado — por isso os dois se complementam em sistemas reais.`}
            onRetry={retry}
          />
          <CodeReveal file="backend/app/services/vector_store.py (trechos)">
            {`# busca por palavra-chave: só conta palavras IGUAIS
hits = len(q_tokens & doc_tokens)

# busca vetorial: compara o SIGNIFICADO (as coordenadas)
results = self._client.query_points(
    collection_name=..., query=embedding, limit=top_k,
).points`}
          </CodeReveal>
        </div>
      )}
    </div>
  );
}

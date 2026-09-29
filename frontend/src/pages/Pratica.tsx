import { useState } from 'react';
import {
  MessageCircleQuestion,
  Layers,
  Database,
  ArrowUpDown,
  FileText,
  Bot,
  Sparkles,
  Swords,
  SlidersHorizontal,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StepProgress from '../components/pratica/StepProgress';
import QuestionStep from '../components/pratica/QuestionStep';
import EmbedMission from '../components/pratica/EmbedMission';
import SearchMission from '../components/pratica/SearchMission';
import RerankMission from '../components/pratica/RerankMission';
import ContextMission from '../components/pratica/ContextMission';
import LlmMission from '../components/pratica/LlmMission';
import AuditMission from '../components/pratica/AuditMission';
import DuelMission from '../components/pratica/DuelMission';
import ParamsMission from '../components/pratica/ParamsMission';
import type { MissionProps } from '../components/pratica/MissionParts';
import { SUGGESTED_QUESTIONS } from '../lib/mockRag';

// Cada etapa é identificada por `id` (não pela posição), para que inserir
// ou reordenar etapas não desloque a lógica de liberação nem os componentes.
// As etapas com `gated: true` (as missões) só liberam a próxima depois que o
// aluno conclui a missão (onComplete). Pergunta e bônus liberam ao visitar.
const STEPS = [
  { id: 'question', title: 'Pergunta', icon: MessageCircleQuestion, gated: false },
  { id: 'embedding', title: 'Embedding', icon: Layers, gated: true },
  { id: 'search', title: 'Busca vetorial', icon: Database, gated: true },
  { id: 'rerank', title: 'Reranking', icon: ArrowUpDown, gated: true },
  { id: 'context', title: 'Contexto', icon: FileText, gated: true },
  { id: 'llm', title: 'LLM', icon: Bot, gated: true },
  { id: 'audit', title: 'Resposta', icon: Sparkles, gated: true },
  { id: 'duel', title: 'Duelo', icon: Swords, gated: true },
  { id: 'params', title: 'Parâmetros (bônus)', icon: SlidersHorizontal, gated: false },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const STEP_NUMBERS = STEPS.map((_, i) => String(i + 1).padStart(2, '0'));

interface Result {
  got: number;
  max: number;
}

export default function Pratica() {
  const [question, setQuestion] = useState(SUGGESTED_QUESTIONS[3]);
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState<Partial<Record<StepId, Result>>>({});

  function canProceed(i: number): boolean {
    const { id, gated } = STEPS[i];
    if (gated) return Boolean(results[id]);
    if (id === 'question') return question.trim().length > 0;
    return true;
  }

  function handleQuestionChange(q: string) {
    setQuestion(q);
    // Muda a pergunta: as missões já feitas valiam para a pergunta anterior,
    // então precisam ser refeitas.
    setResults({});
  }

  function missionProps(id: StepId): MissionProps {
    return {
      question,
      alreadyDone: Boolean(results[id]),
      onComplete: (got, max) => setResults((prev) => ({ ...prev, [id]: { got, max } })),
    };
  }

  function goTo(i: number) {
    // O indicador só permite voltar para uma etapa já vista — avançar é
    // sempre pelo botão "Próximo", uma etapa de cada vez.
    if (i <= stepIndex) setStepIndex(i);
  }

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canGoNext = canProceed(stepIndex) && !isLast;

  const done = Object.values(results);
  const totalGot = done.reduce((s, r) => s + r.got, 0);
  const totalMax = done.reduce((s, r) => s + r.max, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-white">Modo Prática</h1>
      <p className="mb-8 text-center text-slate-400">
        Antes de ver a IA fazer, faça você mesmo. Uma missão de cada vez.
      </p>

      <StepProgress numbers={STEP_NUMBERS} current={stepIndex} onJump={goTo} />

      {done.length > 0 && (
        <p className="mb-3 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>
            Pontos: <strong className="text-slate-200">{totalGot}</strong> de {totalMax} possíveis nas{' '}
            {done.length} {done.length === 1 ? 'missão concluída' : 'missões concluídas'}
          </span>
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-800/60 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4 border-b border-white/5 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-primary to-blue-light text-sm font-bold text-white shadow">
            {STEP_NUMBERS[stepIndex]}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <step.icon className="h-4 w-4 shrink-0 text-blue-glow" />
            <h2 className="text-[15px] font-semibold text-white">{step.title}</h2>
          </div>
        </div>

        <div className="fade-in-up space-y-4 px-5 py-5">
          {step.id === 'question' && (
            <QuestionStep
              value={question}
              onChange={handleQuestionChange}
              hasProgress={done.length > 0}
            />
          )}
          {step.id === 'embedding' && <EmbedMission {...missionProps('embedding')} />}
          {step.id === 'search' && <SearchMission {...missionProps('search')} />}
          {step.id === 'rerank' && <RerankMission {...missionProps('rerank')} />}
          {step.id === 'context' && <ContextMission {...missionProps('context')} />}
          {step.id === 'llm' && <LlmMission {...missionProps('llm')} />}
          {step.id === 'audit' && <AuditMission {...missionProps('audit')} />}
          {step.id === 'duel' && <DuelMission {...missionProps('duel')} />}
          {step.id === 'params' && (
            <div className="space-y-4">
              <ParamsMission question={question} />
              {done.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <Trophy className="h-5 w-5 shrink-0 text-amber-400" />
                  <p className="text-sm text-amber-200">
                    Você fez <strong>{totalGot}</strong> de {totalMax} pontos nas missões concluídas. Você
                    acabou de percorrer, à mão, o pipeline inteiro de um sistema RAG.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-5 py-4">
          <button
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {!isLast ? (
            <button
              onClick={() => canGoNext && setStepIndex((i) => i + 1)}
              disabled={!canGoNext}
              title={canGoNext ? undefined : 'Conclua a missão acima para continuar'}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setStepIndex(0);
                setResults({});
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Recomeçar do início
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  MessageCircleQuestion,
  Layers,
  Database,
  ArrowUpDown,
  FileText,
  Bot,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import StepProgress from '../components/pratica/StepProgress';
import QuestionPicker from '../components/pratica/QuestionPicker';
import VectorStoreGame from '../components/pratica/VectorStoreGame';
import RerankerGame from '../components/pratica/RerankerGame';
import ContextBuilder from '../components/pratica/ContextBuilder';
import ParamsExplorer from '../components/pratica/ParamsExplorer';
import { CodeBlock } from '../components/ui';
import { fakeEmbedding, SUGGESTED_QUESTIONS } from '../lib/mockRag';

// Etapas 2 (Busca Vetorial), 3 (Reranking) e 4 (Contexto) só liberam a
// próxima etapa depois que o aluno verifica a atividade (onCheck). As
// demais são explicativas e liberam assim que visitadas.
const GAME_STEPS = new Set([2, 3, 4]);

const STEPS = [
  { number: '01', title: 'Pergunta', icon: MessageCircleQuestion },
  { number: '02', title: 'Embedding', icon: Layers },
  { number: '03', title: 'Busca Vetorial', icon: Database },
  { number: '04', title: 'Reranking', icon: ArrowUpDown },
  { number: '05', title: 'Contexto', icon: FileText },
  { number: '06', title: 'LLM', icon: Bot },
  { number: '07', title: 'Resposta', icon: Sparkles },
  { number: '08', title: 'Parâmetros (bônus)', icon: SlidersHorizontal },
];

export default function Pratica() {
  const [question, setQuestion] = useState(SUGGESTED_QUESTIONS[3]);
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  function canProceed(i: number): boolean {
    if (GAME_STEPS.has(i)) return Boolean(checkedSteps[i]);
    if (i === 0) return question.trim().length > 0;
    return true;
  }

  // Quantas etapas, a partir da 0, já foram concluídas em sequência —
  // define até onde dá pra navegar (Próximo ou pulo direto pelo indicador).
  let doneUpTo = 0;
  while (doneUpTo < STEPS.length && canProceed(doneUpTo)) doneUpTo++;

  function handleQuestionChange(q: string) {
    setQuestion(q);
    // Muda a pergunta: as atividades já feitas valiam para a pergunta
    // anterior, então precisam ser refeitas.
    setCheckedSteps({});
  }

  function markChecked(i: number) {
    setCheckedSteps((prev) => ({ ...prev, [i]: true }));
  }

  function goTo(i: number) {
    // O indicador só permite voltar para uma etapa já vista — avançar é
    // sempre pelo botão "Próximo", uma etapa de cada vez.
    if (i <= stepIndex) setStepIndex(i);
  }

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canGoNext = canProceed(stepIndex) && !isLast;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-white">Modo Prática</h1>
      <p className="mb-8 text-center text-slate-400">
        Antes de ver a IA fazer, faça você mesmo. Uma linha do tempo, uma etapa de cada vez.
      </p>

      <StepProgress numbers={STEPS.map((s) => s.number)} current={stepIndex} onJump={goTo} />

      <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-800/60 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4 border-b border-white/5 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-primary to-blue-light text-sm font-bold text-white shadow">
            {step.number}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <step.icon className="h-4 w-4 shrink-0 text-blue-glow" />
            <h2 className="text-[15px] font-semibold text-white">{step.title}</h2>
          </div>
        </div>

        <div className="fade-in-up space-y-4 px-5 py-5">
          {stepIndex === 0 && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-300">
                É o ponto de partida de qualquer RAG: uma pergunta em linguagem natural, sem
                precisar de palavras-chave específicas. Escolha abaixo a pergunta que vai guiar{' '}
                <strong>toda a prática</strong> — as próximas etapas usam exatamente essa pergunta.
              </p>
              <QuestionPicker value={question} onChange={handleQuestionChange} />
            </div>
          )}

          {stepIndex === 1 && (
            <div className="space-y-3">
              <p className="leading-relaxed text-slate-300">
                Um modelo de embeddings lê o texto da pergunta e produz uma sequência fixa de
                números — por exemplo, 768 valores. Perguntas com significados parecidos geram
                vetores próximos entre si, mesmo usando palavras diferentes.
              </p>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">
                Embedding gerado para "{question}"
              </p>
              <CodeBlock>
                [{fakeEmbedding(question).slice(0, 8).map((v) => v.toFixed(3)).join(', ')}, …]
              </CodeBlock>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-300">
                O vetor da pergunta é comparado com os vetores de todos os documentos da base. O
                banco encontra os mais próximos matematicamente — a "busca semântica" — e retorna
                os Top-K mais similares.
              </p>
              <VectorStoreGame question={question} onCheck={() => markChecked(2)} />
            </div>
          )}

          {stepIndex === 3 && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-300">
                A busca vetorial é rápida mas aproximada. O reranker reavalia a relação entre a
                pergunta e cada documento recuperado, reordenando-os pela relevância real.
              </p>
              <RerankerGame question={question} onCheck={() => markChecked(3)} />
            </div>
          )}

          {stepIndex === 4 && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-300">
                Os trechos mais relevantes, já filtrados pelo reranker, são reunidos como
                "contexto" para a LLM. Menos é mais: só o que realmente ajuda a responder.
              </p>
              <ContextBuilder question={question} onCheck={() => markChecked(4)} />
            </div>
          )}

          {stepIndex === 5 && (
            <p className="leading-relaxed text-slate-300">
              A pergunta e o contexto recuperado são combinados num prompt enviado à LLM. Sem RAG,
              a LLM responderia apenas com o que aprendeu no treinamento — podendo "alucinar" ou
              desconhecer informações específicas. Com o contexto recuperado, a resposta fica
              fundamentada nos documentos reais da base.
            </p>
          )}

          {stepIndex === 6 && (
            <p className="leading-relaxed text-slate-300">
              A resposta final vem acompanhada das fontes usadas, para que qualquer afirmação
              possa ser conferida no documento original. É essa rastreabilidade que torna o RAG
              mais verificável do que uma LLM respondendo sozinha.
            </p>
          )}

          {stepIndex === 7 && (
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-300">
                Bônus opcional: mexa nos parâmetros que normalmente ficam fixos no código e veja,
                na hora, o que muda na busca vetorial e no reranking.
              </p>
              <ParamsExplorer question={question} />
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
              title={canGoNext ? undefined : 'Termine a atividade acima para continuar'}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-primary to-blue-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setStepIndex(0);
                setCheckedSteps({});
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

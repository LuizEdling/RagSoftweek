import { Brain, GraduationCap, Layers } from 'lucide-react';

export default function Sobre() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-primary to-blue-light shadow-[0_0_24px_rgba(0,73,255,0.45)]">
          <Brain className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">RAG Lab</h1>
        <p className="text-slate-400">Construindo uma IA com Memória</p>
      </div>

      <div className="space-y-6 rounded-xl border border-white/10 bg-navy-800/60 p-6 leading-relaxed text-slate-300">
        <p>
          O <strong className="text-white">RAG Lab</strong> é uma aplicação educacional criada
          para o workshop universitário{' '}
          <em>"Construindo uma IA com Memória: RAG, Embeddings e Bancos Vetoriais na Prática"</em>.
        </p>
        <p>
          O objetivo é permitir que alunos vejam, na prática e visualmente, como uma
          arquitetura de RAG (Retrieval-Augmented Generation) transforma uma pergunta em uma
          resposta fundamentada — passando por geração de embedding, busca vetorial,
          reranking, montagem de contexto e geração pela LLM.
        </p>
        <p>
          Toda a base de conhecimento utilizada é fictícia, inspirada em uma universidade
          inventada, para que o foco fique na arquitetura e não em dados reais de nenhuma
          instituição.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-navy-800/60 p-5">
          <GraduationCap className="mb-2 h-5 w-5 text-blue-glow" />
          <h3 className="mb-1 font-semibold text-white">Uso pedagógico</h3>
          <p className="text-sm text-slate-400">
            Pensado para ser demonstrado ao vivo em uma aula de 2h30, com um Modo
            Demonstração que anima cada etapa do pipeline.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-navy-800/60 p-5">
          <Layers className="mb-2 h-5 w-5 text-blue-glow" />
          <h3 className="mb-1 font-semibold text-white">Stack</h3>
          <p className="text-sm text-slate-400">
            React + TypeScript + Tailwind no frontend, FastAPI no backend, Qdrant como banco
            vetorial — com modo mock para funcionar sem nenhuma configuração externa.
          </p>
        </div>
      </div>
    </div>
  );
}

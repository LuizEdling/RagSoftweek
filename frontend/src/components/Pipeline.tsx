import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import PipelineStep from './PipelineStep';
import { Explainer, CodeBlock, SimilarityBar, Badge } from './ui';
import SimilarityChart from './SimilarityChart';
import type { RagPipelineResult } from '../types/rag';

export default function Pipeline({ result }: { result: RagPipelineResult }) {
  const [showEmbeddingInfo, setShowEmbeddingInfo] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <PipelineStep number="01" title="Pergunta" subtitle={result.question}>
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-navy-950/60 p-4 text-slate-200">
            “{result.question}”
          </div>
          <Explainer>
            A pergunta original é transformada em um vetor para que possamos compará-la
            semanticamente com os documentos da nossa base.
          </Explainer>
        </div>
      </PipelineStep>

      <PipelineStep number="02" title="Embedding" subtitle={`${result.embedding.dimensions} dimensões`}>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">
              Embedding gerado
            </p>
            <CodeBlock>
              [{result.embedding.vectorPreview.map((v) => v.toFixed(3)).join(', ')}, …]
            </CodeBlock>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Dimensão: {result.embedding.dimensions}</Badge>
          </div>
          <Explainer>
            Um embedding representa o significado de um texto através de uma sequência de
            números. Textos semanticamente semelhantes tendem a possuir vetores próximos no
            espaço vetorial.
          </Explainer>
          <button
            onClick={() => setShowEmbeddingInfo((s) => !s)}
            className="text-sm font-medium text-blue-glow hover:text-blue-light"
          >
            {showEmbeddingInfo ? 'Ocultar explicação' : 'Entenda embeddings →'}
          </button>
          {showEmbeddingInfo && (
            <div className="fade-in-up rounded-lg border border-white/10 bg-navy-950/60 p-4 text-sm leading-relaxed text-slate-300">
              Imagine um mapa onde cada palavra ou frase vira um ponto no espaço. Frases com
              significados parecidos ficam próximas nesse mapa, mesmo que usem palavras
              diferentes — por exemplo, "estágio obrigatório" e "trabalho supervisionado"
              podem ficar perto uma da outra. Um modelo de embeddings aprende esse mapa a
              partir de milhões de textos, e cada ponto é representado por centenas de
              números (dimensões) que juntos capturam nuances de significado.
            </div>
          )}
        </div>
      </PipelineStep>

      <PipelineStep number="03" title="Busca Vetorial" subtitle={`Top-K = ${result.topK}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Procurando documentos semanticamente semelhantes…</p>
          <div className="space-y-2.5">
            {result.retrieval.map((item) => (
              <SimilarityBar key={item.documentId} score={item.similarity} label={item.filename} />
            ))}
          </div>
          <Badge tone="blue">TOP K = {result.topK}</Badge>
          <Explainer>
            O banco vetorial compara o embedding da pergunta com os embeddings armazenados e
            retorna os documentos mais próximos.
          </Explainer>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
              Visualização de similaridade (projeção 2D)
            </p>
            <SimilarityChart question={result.question} items={result.retrieval} />
          </div>
        </div>
      </PipelineStep>

      <PipelineStep number="04" title="Reranking" subtitle={`${result.topK} → ${result.reranking.keptCount} documentos`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Os documentos recuperados agora serão reordenados por um reranker.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Antes (score vetorial)
              </p>
              <ol className="space-y-1.5">
                {result.reranking.before.map((item, i) => (
                  <li
                    key={item.documentId}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-navy-950/40 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-300">
                      {i + 1}. {item.filename}
                    </span>
                    <span className="font-mono text-slate-400">{item.vectorScore.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                Depois (score do reranker)
              </p>
              <ol className="space-y-1.5">
                {result.reranking.after.map((item, i) => (
                  <li
                    key={item.documentId}
                    className="fade-in-up flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="text-slate-200">
                      {i + 1}. {item.filename}
                    </span>
                    <span className="font-mono text-emerald-400">{item.rerankScore.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">TOP K inicial: {result.topK}</Badge>
            <Badge tone="success">Documentos após reranking: {result.reranking.keptCount}</Badge>
          </div>
          <Explainer>
            A busca vetorial recupera candidatos relevantes. O reranker analisa a relação
            entre a pergunta e cada documento para determinar quais são mais relevantes.
          </Explainer>
        </div>
      </PipelineStep>

      <PipelineStep number="05" title="Contexto" subtitle={`${result.context.length} trechos selecionados`}>
        <div className="space-y-3">
          {result.context.map((c) => (
            <div key={c.documentId} className="rounded-lg border border-blue-light/25 bg-blue-primary/[0.06] p-4">
              <p className="mb-1.5 font-mono text-xs text-blue-glow">{c.filename}</p>
              <p className="text-sm leading-relaxed text-slate-200">"{c.excerpt}"</p>
            </div>
          ))}
          <Explainer>
            Neste momento, o sistema seleciona apenas as informações consideradas relevantes
            para responder à pergunta.
          </Explainer>
        </div>
      </PipelineStep>

      <PipelineStep number="06" title="LLM" subtitle="Pergunta + Contexto → Resposta">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-white/10 bg-navy-950/60 p-5 text-center text-sm text-slate-300">
            <span className="rounded-md bg-white/5 px-3 py-1.5">Pergunta</span>
            <span className="text-slate-500">+</span>
            <span className="rounded-md bg-white/5 px-3 py-1.5">Contexto recuperado</span>
            <span className="text-slate-500">↓</span>
            <span className="flex items-center gap-1.5 rounded-md bg-blue-primary/20 px-3 py-1.5 font-medium text-blue-glow">
              <Bot className="h-4 w-4" /> LLM
            </span>
            <span className="text-slate-500">↓</span>
            <span className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-emerald-400">Resposta</span>
          </div>
          <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Prompt (simplificado)</p>
          <CodeBlock>
{`SYSTEM:
${result.llm.systemPrompt}

CONTEXTO:
${result.llm.contextBlock}

PERGUNTA:
${result.llm.userPrompt}

INSTRUÇÃO:
Responda utilizando o contexto fornecido.`}
          </CodeBlock>
        </div>
      </PipelineStep>

      <PipelineStep number="07" title="Resposta" accent="success" defaultOpen>
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <Sparkles className="h-4 w-4" /> Resposta da IA
            </p>
            <p className="leading-relaxed text-slate-100">{result.answer}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-300">Fontes utilizadas</p>
            <div className="space-y-2">
              {result.sources.map((s) => (
                <div key={s.documentId} className="rounded-lg border border-white/10 bg-navy-950/50">
                  <button
                    onClick={() =>
                      setExpandedSource(expandedSource === s.documentId ? null : s.documentId)
                    }
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/[0.03]"
                  >
                    <span className="font-mono">{s.filename}</span>
                    <span className="text-xs text-slate-500">
                      {expandedSource === s.documentId ? 'ocultar' : 'ver trecho'}
                    </span>
                  </button>
                  {expandedSource === s.documentId && (
                    <div className="fade-in-up border-t border-white/5 px-4 py-3 text-sm text-slate-400">
                      "{s.excerpt}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Resposta baseada em {result.sources.length} documento{result.sources.length !== 1 ? 's' : ''} recuperado{result.sources.length !== 1 ? 's' : ''}.
          </p>
        </div>
      </PipelineStep>
    </div>
  );
}

import { Search, Layers, ArrowUpDown, FileText, Bot, GitCompareArrows } from 'lucide-react';

const topics = [
  {
    icon: Layers,
    title: 'O que é um embedding?',
    text: 'É uma forma de representar o significado de um texto como uma lista de números (um vetor). Textos com significados parecidos geram vetores próximos entre si, mesmo usando palavras diferentes.',
  },
  {
    icon: GitCompareArrows,
    title: 'Texto como vetor',
    text: 'Um modelo de embeddings lê o texto e produz uma sequência fixa de números — por exemplo, 768 valores. Esses números não têm significado individual óbvio, mas juntos formam uma "impressão digital semântica" do texto.',
  },
  {
    icon: FileText,
    title: 'Banco de dados vetorial',
    text: 'É um banco especializado em armazenar e buscar vetores rapidamente. Em vez de buscar por palavras exatas, ele encontra os vetores mais próximos matematicamente do vetor de busca — daí o nome "busca semântica".',
  },
  {
    icon: Search,
    title: 'Busca semântica e similaridade',
    text: 'A similaridade mede o quão "próximos" dois vetores estão no espaço (geralmente pela similaridade de cosseno, entre -1 e 1, ou normalizada de 0 a 1). Quanto mais próximo de 1, mais semanticamente parecidos os textos são.',
  },
  {
    icon: Layers,
    title: 'O que é Top-K?',
    text: 'É a quantidade de documentos mais similares que o sistema recupera do banco vetorial. Um Top-K = 5 significa "traga os 5 documentos mais parecidos com a pergunta".',
  },
  {
    icon: ArrowUpDown,
    title: 'Reranking: o que é e por que ajuda',
    text: 'A busca vetorial é rápida mas aproximada. O reranker é um segundo passo, mais lento porém mais preciso, que reavalia a relação entre a pergunta e cada documento recuperado, reordenando-os pela relevância real.',
  },
  {
    icon: Bot,
    title: 'O que é RAG?',
    text: 'RAG (Retrieval-Augmented Generation) é a técnica de buscar informações relevantes em uma base de conhecimento antes de pedir para a LLM gerar uma resposta — em vez de depender apenas do que o modelo "decorou" no treinamento.',
  },
  {
    icon: Bot,
    title: 'Documentos recuperados como contexto',
    text: 'Os trechos mais relevantes, encontrados na busca e reordenados pelo reranker, são inseridos no prompt enviado à LLM como "contexto". A LLM usa esse contexto para fundamentar a resposta.',
  },
  {
    icon: GitCompareArrows,
    title: 'LLM com e sem contexto recuperado',
    text: 'Sem RAG, a LLM responde apenas com o que aprendeu no treinamento — pode "alucinar" ou desconhecer informações específicas e atualizadas. Com RAG, a resposta é fundamentada nos documentos reais da base, tornando-se mais confiável e verificável pelas fontes citadas.',
  },
];

export default function ComoFunciona() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-center text-3xl font-bold text-white">Como funciona</h1>
      <p className="mb-10 text-center text-slate-400">
        Os conceitos por trás do pipeline RAG, explicados de forma simples.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {topics.map((t) => (
          <div key={t.title} className="rounded-xl border border-white/10 bg-navy-800/60 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-primary/15">
              <t.icon className="h-5 w-5 text-blue-glow" />
            </div>
            <h3 className="mb-1.5 font-semibold text-white">{t.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{t.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-blue-light/25 bg-blue-primary/[0.06] p-6 text-center">
        <p className="text-sm text-slate-300">
          Quer ver esses conceitos em ação? Vá até o{' '}
          <a href="/" className="font-medium text-blue-glow hover:underline">
            Laboratório
          </a>{' '}
          e execute uma pergunta.
        </p>
      </div>
    </div>
  );
}

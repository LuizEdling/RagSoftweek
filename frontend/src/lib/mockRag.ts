import { documents, UNIVERSITY_NAME } from '../data/documents';
import type {
  RagPipelineResult,
  RetrievalItem,
  RerankItem,
  ContextChunk,
  SourceUsed,
  VectorRecord,
} from '../types/rag';

const EMBEDDING_DIMENSIONS = 768;
const TOP_K = 5;
const RERANK_KEEP = 2;

export const DEFAULT_TOP_K = TOP_K;
export const DEFAULT_RERANK_KEEP = RERANK_KEEP;

// --- utilidades determinísticas (sem dependências externas) ---

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function fakeEmbedding(text: string, dims = EMBEDDING_DIMENSIONS): number[] {
  const rand = seededRandom(hashString(text));
  return Array.from({ length: dims }, () => Number((rand() * 2 - 1).toFixed(4)));
}

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'é', 'em', 'um', 'uma',
  'que', 'para', 'com', 'no', 'na', 'nos', 'nas', 'por', 'como', 'meu', 'minha',
  'posso', 'faço', 'fazer', 'quero', 'qual', 'quais', 'quando', 'onde',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function keywordOverlapScore(questionTokens: string[], doc: (typeof documents)[number]): number {
  const docTokens = new Set(tokenize(doc.title + ' ' + doc.content + ' ' + doc.tags.join(' ')));
  let hits = 0;
  for (const t of questionTokens) {
    if (docTokens.has(t)) hits += 1;
    // correspondência parcial (stem simples)
    else if ([...docTokens].some((dt) => dt.startsWith(t.slice(0, 4)) && t.length > 3)) hits += 0.5;
  }
  return hits;
}

/** Similaridade de TODOS os documentos com a pergunta, ordenada (sem cortar
 * pelo Top-K). Usada tanto pelo pipeline principal quanto pelos exercícios
 * práticos, que precisam saber o ranking "verdadeiro" completo. */
export function mockRetrieveAll(question: string): RetrievalItem[] {
  const qTokens = tokenize(question);
  const seed = hashString(question);
  const rand = seededRandom(seed);

  const scored = documents.map((doc) => {
    const overlap = keywordOverlapScore(qTokens, doc);
    const base = overlap > 0 ? 0.55 + Math.min(overlap * 0.11, 0.4) : 0.15 + rand() * 0.25;
    const noise = (rand() - 0.5) * 0.05;
    const similarity = Math.max(0.05, Math.min(0.99, base + noise));
    return {
      documentId: doc.id,
      filename: doc.filename,
      title: doc.title,
      similarity: Number(similarity.toFixed(2)),
    };
  });

  return scored.sort((a, b) => b.similarity - a.similarity);
}

export function mockRetrieve(question: string, topK: number = TOP_K): RetrievalItem[] {
  return mockRetrieveAll(question).slice(0, topK);
}

export function mockRerank(
  retrieval: RetrievalItem[],
  question: string,
  keepN: number = RERANK_KEEP,
): {
  before: RerankItem[];
  after: RerankItem[];
} {
  const qTokens = new Set(tokenize(question));
  const before: RerankItem[] = retrieval.map((r) => ({
    documentId: r.documentId,
    filename: r.filename,
    title: r.title,
    vectorScore: r.similarity,
    rerankScore: r.similarity,
  }));

  const after = retrieval
    .map((r) => {
      const doc = documents.find((d) => d.id === r.documentId)!;
      const docTokens = tokenize(doc.title + ' ' + doc.content);
      const titleOverlap = tokenize(doc.title).filter((t) => qTokens.has(t)).length;
      const bodyOverlap = docTokens.filter((t) => qTokens.has(t)).length;
      const boost = titleOverlap * 0.08 + Math.min(bodyOverlap * 0.015, 0.1);
      const rerankScore = Math.max(0.05, Math.min(0.99, r.similarity + boost));
      return {
        documentId: r.documentId,
        filename: r.filename,
        title: r.title,
        vectorScore: r.similarity,
        rerankScore: Number(rerankScore.toFixed(2)),
      };
    })
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, keepN);

  return { before, after };
}

export function excerptFor(filename: string): string {
  const doc = documents.find((d) => d.filename === filename);
  if (!doc) return '';
  const firstSentence = doc.content.split('. ').slice(0, 2).join('. ');
  return firstSentence.endsWith('.') ? firstSentence : firstSentence + '.';
}

export function mockContext(after: RerankItem[]): ContextChunk[] {
  return after.map((item) => ({
    documentId: item.documentId,
    filename: item.filename,
    title: item.title,
    excerpt: excerptFor(item.filename),
  }));
}

// Respostas prontas para as perguntas sugeridas, para que a demonstração
// pareça natural mesmo em modo mock.
const CANNED_ANSWERS: Record<string, string> = {
  'como faço meu tcc':
    'Para iniciar o TCC, você precisa definir um orientador e ter o tema aprovado pela coordenação do curso, no início do penúltimo semestre. É necessário entregar um pré-projeto até a sexta semana letiva e passar por duas bancas: qualificação e defesa final. A formatação deve seguir as normas da ABNT disponíveis no Portal Acadêmico.',
  'quantas faltas posso ter':
    'A frequência mínima exigida é de 75% das aulas. Em uma disciplina de 80 horas, você pode faltar no máximo 20 horas, justificadas ou não. Ultrapassar esse limite leva à reprovação por frequência, mesmo com notas suficientes.',
  'como funciona o estagio':
    'O estágio obrigatório pode começar a partir do 5º período, em empresas conveniadas ou por convênio individual. É preciso ter um professor orientador de estágio, entregar relatórios bimestrais e um relatório final, além de assinar o contrato antes de iniciar as atividades — do contrário, as horas não são validadas.',
  'como faço minha matricula':
    'A matrícula é feita pelo Portal do Aluno entre os dias 10 e 20 do mês anterior ao início do semestre. Calouros fazem a matrícula presencialmente na Central de Atendimento com RG, CPF e histórico escolar; veteranos sem pendências são renovados automaticamente.',
  'como posso conseguir uma bolsa':
    'Existem bolsas de mérito acadêmico, bolsas socioeconômicas (mediante análise de renda) e bolsas de iniciação científica. As inscrições para bolsas socioeconômicas abrem no início de cada semestre no setor de Assistência Estudantil, exigindo comprovação de renda e documentação familiar.',
  'como funciona a biblioteca':
    'A Biblioteca Central funciona de segunda a sábado, das 7h às 22h. É possível pegar até 5 livros emprestados por até 14 dias, renováveis pelo Portal do Aluno. Atrasos geram bloqueio de novos empréstimos proporcional aos dias de atraso.',
  'quando posso fazer uma prova substitutiva':
    'A prova substitutiva pode ser solicitada em até 5 dias úteis após a avaliação original, caso a falta tenha sido justificada (atestado médico, óbito familiar ou convocação legal). Ela é única e cobre todo o conteúdo do semestre até a data de aplicação.',
};

function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[?!.]/g, '')
    .trim();
}

/** Busca lexical pura (palavras exatas, sem radical nem ruído). Espelha
 * `VectorStore.keyword_search` do backend. Documentos sem nenhuma palavra em
 * comum com a pergunta não aparecem. */
export function mockKeywordSearch(question: string, topK: number = TOP_K): RetrievalItem[] {
  const qTokens = new Set(tokenize(question));
  if (qTokens.size === 0) return [];
  return documents
    .map((doc) => {
      const docTokens = new Set(tokenize(doc.title + ' ' + doc.content + ' ' + doc.tags.join(' ')));
      const hits = [...qTokens].filter((t) => docTokens.has(t)).length;
      return { doc, hits };
    })
    .filter(({ hits }) => hits > 0)
    .map(({ doc, hits }) => ({
      documentId: doc.id,
      filename: doc.filename,
      title: doc.title,
      similarity: Number((hits / qTokens.size).toFixed(2)),
    }))
    .sort((a, b) => b.similarity - a.similarity || a.filename.localeCompare(b.filename))
    .slice(0, topK);
}

function generateAnswer(question: string, context: ContextChunk[]): string {
  const canned = CANNED_ANSWERS[normalizeQuestion(question)];
  if (canned) return canned;

  if (context.length === 0) {
    return `Não encontrei documentos suficientemente relevantes na base de conhecimento do ${UNIVERSITY_NAME} para responder com segurança a essa pergunta. Tente reformular ou consulte a Central de Atendimento.`;
  }

  const parts = context.map((c) => c.excerpt);
  return `Com base nos documentos recuperados (${context.map((c) => c.filename).join(', ')}), a resposta é: ${parts.join(' ')}`;
}

export function runMockPipeline(question: string): RagPipelineResult {
  const retrieval = mockRetrieve(question);
  const { before, after } = mockRerank(retrieval, question);
  const context = mockContext(after);
  const answer = generateAnswer(question, context);

  const sources: SourceUsed[] = context.map((c) => ({
    documentId: c.documentId,
    filename: c.filename,
    title: c.title,
    excerpt: c.excerpt,
  }));

  const systemPrompt = 'Você é um assistente acadêmico.';
  const contextBlock = context.map((c) => `[${c.filename}] ${c.excerpt}`).join('\n');
  const userPrompt = question;

  return {
    question,
    embedding: {
      vectorPreview: fakeEmbedding(question).slice(0, 8),
      dimensions: EMBEDDING_DIMENSIONS,
    },
    retrieval,
    topK: TOP_K,
    reranking: {
      before,
      after,
      keptCount: after.length,
    },
    context,
    llm: {
      systemPrompt,
      contextBlock,
      userPrompt,
    },
    answer,
    sources,
    usedMock: true,
  };
}

export function mockVectorStore(): VectorRecord[] {
  return documents.map((doc) => ({
    id: doc.id,
    filename: doc.filename,
    vectorPreview: fakeEmbedding(doc.content).slice(0, 6),
    dimensions: EMBEDDING_DIMENSIONS,
    category: doc.category,
  }));
}

export const SUGGESTED_QUESTIONS = [
  'Como faço meu TCC?',
  'Quantas faltas posso ter?',
  'Como funciona o estágio?',
  'Como faço minha matrícula?',
  'Como posso conseguir uma bolsa?',
  'Como funciona a biblioteca?',
  'Quando posso fazer uma prova substitutiva?',
];

export interface KnowledgeDocument {
  id: string;
  filename: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface RetrievalItem {
  documentId: string;
  filename: string;
  title: string;
  similarity: number; // 0-1, cosine similarity (mock)
}

export interface RerankItem {
  documentId: string;
  filename: string;
  title: string;
  vectorScore: number; // original similarity score
  rerankScore: number; // score from reranker
}

export interface ContextChunk {
  documentId: string;
  filename: string;
  title: string;
  excerpt: string;
}

export interface SourceUsed {
  documentId: string;
  filename: string;
  title: string;
  excerpt: string;
}

export interface RagPipelineResult {
  question: string;
  embedding: {
    vectorPreview: number[];
    dimensions: number;
  };
  retrieval: RetrievalItem[];
  topK: number;
  reranking: {
    before: RerankItem[];
    after: RerankItem[];
    keptCount: number;
  };
  context: ContextChunk[];
  llm: {
    systemPrompt: string;
    contextBlock: string;
    userPrompt: string;
  };
  answer: string;
  sources: SourceUsed[];
  usedMock: boolean;
  timings?: Partial<Record<'embedding' | 'retrieval' | 'reranking' | 'llm', number>>;
}

export interface VectorRecord {
  id: string;
  filename: string;
  vectorPreview: number[];
  dimensions: number;
  category: string;
}

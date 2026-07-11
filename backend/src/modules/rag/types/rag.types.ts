export type KnowledgeCategory = 'culture' | 'festival' | 'food' | 'history' | 'destination';

export interface AddDocumentDto {
  title: string;
  body: string;
  category: KnowledgeCategory;
  questions: string[];
  answers: string[];
}

export interface RetrievedDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
  similarity?: number;
}

export interface QueryRagDto {
  query: string;
  category?: KnowledgeCategory;
  topK?: number;
}


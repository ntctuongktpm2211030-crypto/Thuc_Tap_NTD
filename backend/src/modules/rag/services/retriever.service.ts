import { EmbeddingsService } from './embeddings.service';
import { VectorStoreService } from './vector-store.service';
import { KnowledgeCategory, RetrievedDoc } from '../types/rag.types';

export class RetrieverService {
  private embeddingsService: EmbeddingsService;
  private vectorStoreService: VectorStoreService;

  constructor(embeddingsService: EmbeddingsService, vectorStoreService: VectorStoreService) {
    this.embeddingsService = embeddingsService;
    this.vectorStoreService = vectorStoreService;
  }

  /**
   * Truy xuất tài liệu bằng công nghệ Hybrid Search (Vector + FTS RRF)
   */
  async retrieve(query: string, category?: KnowledgeCategory, topK: number = 4): Promise<RetrievedDoc[]> {
    // 1. Sinh vector embedding cho câu hỏi
    const queryEmbedding = await this.embeddingsService.generate(query);

    // 2. Gọi tìm kiếm lai Hybrid Search
    return this.vectorStoreService.searchHybrid(query, queryEmbedding, category, topK);
  }
}

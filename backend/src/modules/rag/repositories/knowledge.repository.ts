import { VectorStoreService } from '../services/vector-store.service';
import { RetrievedDoc } from '../types/rag-enterprise.types';
import { KnowledgeCategory } from '../types/rag.types';

export class KnowledgeRepository {
  private vectorStoreService: VectorStoreService;

  constructor() {
    this.vectorStoreService = new VectorStoreService();
  }

  /**
   * Search knowledge using Hybrid Vector + BM25 Text search with RRF scoring
   */
  async searchHybrid(query: string, queryEmbedding: number[], category?: string, topK: number = 5): Promise<RetrievedDoc[]> {
    const rawDocs = await this.vectorStoreService.searchHybrid(
      query,
      queryEmbedding,
      category as KnowledgeCategory,
      topK
    );

    return rawDocs.map((doc) => {
      // Map to enterprise source type for authority scoring
      let sourceType: RetrievedDoc['sourceType'] = 'db';
      if (doc.category === 'food') sourceType = 'blog';
      else if (doc.category === 'culture') sourceType = 'wiki';
      else if (doc.category === 'history') sourceType = 'government';
      else if (doc.category === 'festival') sourceType = 'enterprise';

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category as KnowledgeCategory,
        similarity: doc.similarity ?? doc.score ?? 0.7,
        score: doc.score ?? 0.7,
        sourceType,
        updatedAt: (doc as any).updatedAt || new Date(),
      };
    });
  }
}

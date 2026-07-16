import crypto from 'crypto';
import { RagAuditRepository } from '../repositories/rag-audit.repository';
import { removeDiacritics } from '../../ai-agents/utils/agent.utils';

export class SemanticCacheService {
  private auditRepository: RagAuditRepository;

  constructor() {
    this.auditRepository = new RagAuditRepository();
  }

  /**
   * Generates a unique cache key based on the clean semantic representation of the query
   */
  private generateCacheKey(query: string): string {
    const cleanQuery = removeDiacritics(query.toLowerCase())
      .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric chars for semantic normalization
      .trim();

    return crypto.createHash('sha256').update(cleanQuery).digest('hex');
  }

  /**
   * Look up cached response by query text
   */
  async get(query: string): Promise<any | null> {
    const cacheKey = this.generateCacheKey(query);
    const cached = await this.auditRepository.getCacheMetadata(cacheKey);

    if (!cached) return null;

    // Check expiration
    if (new Date() > cached.expiresAt) {
      return null;
    }

    // Increment hit count asynchronously
    this.auditRepository.saveCacheMetadata(cacheKey, cached.queryText, cached.responseJson, 3600).catch(() => {});

    return JSON.parse(cached.responseJson);
  }

  /**
   * Store response in semantic cache
   */
  async set(query: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const cacheKey = this.generateCacheKey(query);
    const responseJson = JSON.stringify(data);
    await this.auditRepository.saveCacheMetadata(cacheKey, query, responseJson, ttlSeconds);
  }
}

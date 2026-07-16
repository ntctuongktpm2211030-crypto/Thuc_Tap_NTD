import { describe, it, expect } from 'vitest';
import { RetrievedDoc } from '../../types/rag.types';
import { EVAL_QUERIES, createMockDocs } from '../helpers/test-data';

// ─── Metric Calculators ──────────────────────────────────

/**
 * Calculates Recall@K: fraction of relevant docs retrieved in top K.
 * Recall = |relevant ∩ retrieved| / |relevant|
 */
function recallAtK(retrieved: RetrievedDoc[], relevantIds: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  const retrievedIds = new Set(topK.map(d => d.id));
  const hits = relevantIds.filter(id => retrievedIds.has(id)).length;
  return relevantIds.length > 0 ? hits / relevantIds.length : 0;
}

/**
 * Calculates Precision@K: fraction of retrieved docs that are relevant in top K.
 * Precision = |relevant ∩ retrieved| / K
 */
function precisionAtK(retrieved: RetrievedDoc[], relevantIds: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  if (topK.length === 0) return 0;
  const retrievedIds = new Set(topK.map(d => d.id));
  const hits = relevantIds.filter(id => retrievedIds.has(id)).length;
  return hits / k;
}

/**
 * Hit Rate: whether at least one relevant doc appears in top K.
 */
function hitRate(retrieved: RetrievedDoc[], relevantIds: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  const retrievedIds = new Set(topK.map(d => d.id));
  return relevantIds.some(id => retrievedIds.has(id)) ? 1 : 0;
}

/**
 * Average retrieval latency from an array of latencies.
 */
function averageLatency(latenciesMs: number[]): number {
  if (latenciesMs.length === 0) return 0;
  return latenciesMs.reduce((sum, l) => sum + l, 0) / latenciesMs.length;
}

// ─── Mock Retrieval Simulator ────────────────────────────

/**
 * Simulates retrieval by finding docs that match query terms in their title/content.
 * This allows us to test metric calculations without hitting a real DB.
 */
function simulateRetrieval(query: string, allDocs: RetrievedDoc[], topK: number): RetrievedDoc[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  const scored = allDocs.map(doc => {
    const searchable = `${doc.title} ${doc.content}`.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (searchable.includes(term)) score += 1;
    }
    // Boost exact title matches
    if (doc.title.toLowerCase().includes(queryTerms.join(' '))) score += 3;
    return { doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.doc);
}

// ─── Tests: Metric Calculators ───────────────────────────
describe('Retrieval Metrics', () => {
  const allDocs = createMockDocs();

  describe('Recall@K', () => {
    it('should return 1.0 when all relevant docs are retrieved in top K', () => {
      const retrieved = [allDocs[0], allDocs[6]]; // doc-1 (Phở HN), doc-7 (Phở bò HN)
      const relevantIds = ['doc-1', 'doc-7'];
      expect(recallAtK(retrieved, relevantIds, 5)).toBe(1.0);
    });

    it('should return 0.5 when half of relevant docs are retrieved', () => {
      const retrieved = [allDocs[0]];
      const relevantIds = ['doc-1', 'doc-7'];
      expect(recallAtK(retrieved, relevantIds, 5)).toBe(0.5);
    });

    it('should return 0 when no relevant docs are retrieved', () => {
      const retrieved = [allDocs[2], allDocs[3]];
      const relevantIds = ['doc-1', 'doc-7'];
      expect(recallAtK(retrieved, relevantIds, 5)).toBe(0);
    });

    it('should return 0 for empty retrieved list', () => {
      expect(recallAtK([], ['doc-1'], 5)).toBe(0);
    });

    it('should return 0 for empty relevant list', () => {
      expect(recallAtK([allDocs[0]], [], 5)).toBe(0);
    });

    it('should respect K limit (Recall@1)', () => {
      const retrieved = [allDocs[0], allDocs[6]];
      const relevantIds = ['doc-1', 'doc-7'];
      // Recall@1: only 1 relevant doc out of 2 should be found in top 1
      expect(recallAtK(retrieved, relevantIds, 1)).toBe(0.5);
    });
  });

  describe('Precision@K', () => {
    it('should return 1.0 when all top K results are relevant', () => {
      const retrieved = [allDocs[0], allDocs[6]]; // both are food docs
      const relevantIds = ['doc-1', 'doc-7'];
      expect(precisionAtK(retrieved, relevantIds, 2)).toBe(1.0);
    });

    it('should return 0.5 when half of top K results are relevant', () => {
      const retrieved = [allDocs[0], allDocs[2]]; // doc-1 is food, doc-2 is history
      const relevantIds = ['doc-1'];
      expect(precisionAtK(retrieved, relevantIds, 2)).toBe(0.5);
    });

    it('should return 0 when none of top K results are relevant', () => {
      const retrieved = [allDocs[2], allDocs[3]];
      const relevantIds = ['doc-1'];
      expect(precisionAtK(retrieved, relevantIds, 2)).toBe(0);
    });
  });

  describe('Hit Rate', () => {
    it('should return 1 when at least one relevant doc is in top K', () => {
      const retrieved = [allDocs[1], allDocs[0]]; // doc-2 (history), doc-1 (food)
      const relevantIds = ['doc-1'];
      expect(hitRate(retrieved, relevantIds, 5)).toBe(1);
    });

    it('should return 0 when no relevant doc is in top K', () => {
      const retrieved = [allDocs[2], allDocs[3]];
      const relevantIds = ['doc-1'];
      expect(hitRate(retrieved, relevantIds, 5)).toBe(0);
    });
  });

  describe('Average Latency', () => {
    it('should calculate correct average', () => {
      expect(averageLatency([100, 200, 300])).toBe(200);
    });

    it('should return 0 for empty array', () => {
      expect(averageLatency([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(averageLatency([150])).toBe(150);
    });
  });
});

// ─── Tests: Simulated Retrieval ──────────────────────────
describe('Simulated Retrieval (evaluation testbed)', () => {
  const allDocs = createMockDocs();

  // Run evaluation metrics against our test queries
  const kValues = [1, 3, 5, 10];

  for (const k of kValues) {
    describe(`Metrics @${k}`, () => {
      let totalRecall = 0;
      let totalPrecision = 0;
      let totalHitRate = 0;

      for (const eq of EVAL_QUERIES) {
        it(`should evaluate "${eq.query}"`, () => {
          const retrieved = simulateRetrieval(eq.query, allDocs, k);
          const recall = recallAtK(retrieved, eq.expectedDocIds, k);
          const precision = precisionAtK(retrieved, eq.expectedDocIds, k);
          const hit = hitRate(retrieved, eq.expectedDocIds, k);

          // Log for manual inspection
          console.log(`  Query: "${eq.query}"`);
          console.log(`    Retrieved: [${retrieved.map(d => d.id).join(', ')}]`);
          console.log(`    Expected: [${eq.expectedDocIds.join(', ')}]`);
          console.log(`    Recall@${k}: ${recall.toFixed(2)}, Precision@${k}: ${precision.toFixed(2)}, Hit: ${hit}`);

          // For k >= 3, food queries should return at least one relevant doc
          if (eq.category === 'food' && k >= 3) {
            expect(recall).toBeGreaterThan(0);
          }
        });
      }
    });
  }

  it('should have non-zero aggregate metrics across all test queries', () => {
    const k = 5;
    let totalRecall = 0;
    let totalPrecision = 0;
    let totalHitRate = 0;

    for (const eq of EVAL_QUERIES) {
      const retrieved = simulateRetrieval(eq.query, allDocs, k);
      totalRecall += recallAtK(retrieved, eq.expectedDocIds, k);
      totalPrecision += precisionAtK(retrieved, eq.expectedDocIds, k);
      totalHitRate += hitRate(retrieved, eq.expectedDocIds, k);
    }

    const avgRecall = totalRecall / EVAL_QUERIES.length;
    const avgPrecision = totalPrecision / EVAL_QUERIES.length;
    const avgHitRate = totalHitRate / EVAL_QUERIES.length;

    console.log('\n=== Retrieval Evaluation Summary ===');
    console.log(`Queries evaluated: ${EVAL_QUERIES.length}`);
    console.log(`Average Recall@5: ${(avgRecall * 100).toFixed(1)}%`);
    console.log(`Average Precision@5: ${(avgPrecision * 100).toFixed(1)}%`);
    console.log(`Hit Rate@5: ${(avgHitRate * 100).toFixed(1)}%`);

    // Expect reasonable minimum performance from keyword-based retrieval
    expect(avgRecall).toBeGreaterThan(0.3);
    expect(avgHitRate).toBeGreaterThan(0.6);
  });
});

// ─── Export metric functions for reuse ───────────────────
export { recallAtK, precisionAtK, hitRate, averageLatency, simulateRetrieval };

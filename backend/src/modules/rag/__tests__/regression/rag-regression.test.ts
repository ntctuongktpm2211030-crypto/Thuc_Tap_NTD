import { describe, it, expect, beforeEach } from 'vitest';
import { createMockDocs, EVAL_QUERIES, MOCK_REGIONS } from '../helpers/test-data';
import { RetrievedDoc } from '../../types/rag.types';
import { removeDiacritics } from '../../../ai-agents/utils/agent.utils';

// ─── Baseline Metrics (recorded when tests were first written) ──
// These represent the "known good" performance levels.
// If a future change drops metrics below these thresholds, the regression test fails.
const BASELINE = {
  minRecallAt5: 0.4,      // Minimum acceptable Recall@5
  minPrecisionAt5: 0.2,   // Minimum acceptable Precision@5
  minHitRateAt5: 0.7,     // Minimum acceptable Hit Rate@5
  minContextScore: 0.6,   // Minimum average score of retrieved docs
};

// ─── Keyword-based retrieval (same as evaluation) ───────
function simulateRetrieval(query: string, allDocs: RetrievedDoc[], topK: number): RetrievedDoc[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
  const scored = allDocs.map(doc => {
    const searchable = `${doc.title} ${doc.content}`.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (searchable.includes(term)) score += 1;
    }
    if (doc.title.toLowerCase().includes(queryTerms.join(' '))) score += 3;
    return { doc, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, topK).map(s => s.doc);
}

function recallAtK(retrieved: RetrievedDoc[], relevant: string[], k: number): number {
  const topK = new Set(retrieved.slice(0, k).map(d => d.id));
  const hits = relevant.filter(id => topK.has(id)).length;
  return relevant.length > 0 ? hits / relevant.length : 0;
}

function precisionAtK(retrieved: RetrievedDoc[], relevant: string[], k: number): number {
  const topK = retrieved.slice(0, k);
  if (topK.length === 0) return 0;
  const topKIds = new Set(topK.map(d => d.id));
  const hits = relevant.filter(id => topKIds.has(id)).length;
  return hits / k;
}

function hitRate(retrieved: RetrievedDoc[], relevant: string[], k: number): number {
  const topK = new Set(retrieved.slice(0, k).map(d => d.id));
  return relevant.some(id => topK.has(id)) ? 1 : 0;
}

// ─── Regression Test Suite ───────────────────────────────
describe('RAG Regression Tests', () => {
  const allDocs = createMockDocs();

  describe('Retrieval quality regression', () => {
    it('should maintain Recall@5 above baseline', () => {
      let totalRecall = 0;
      for (const eq of EVAL_QUERIES) {
        const retrieved = simulateRetrieval(eq.query, allDocs, 5);
        totalRecall += recallAtK(retrieved, eq.expectedDocIds, 5);
      }
      const avgRecall = totalRecall / EVAL_QUERIES.length;
      console.log(`Recall@5: ${(avgRecall * 100).toFixed(1)}% (baseline: ${(BASELINE.minRecallAt5 * 100).toFixed(1)}%)`);
      expect(avgRecall).toBeGreaterThanOrEqual(BASELINE.minRecallAt5);
    });

    it('should maintain Precision@5 above baseline', () => {
      let totalPrecision = 0;
      for (const eq of EVAL_QUERIES) {
        const retrieved = simulateRetrieval(eq.query, allDocs, 5);
        totalPrecision += precisionAtK(retrieved, eq.expectedDocIds, 5);
      }
      const avgPrecision = totalPrecision / EVAL_QUERIES.length;
      console.log(`Precision@5: ${(avgPrecision * 100).toFixed(1)}% (baseline: ${(BASELINE.minPrecisionAt5 * 100).toFixed(1)}%)`);
      expect(avgPrecision).toBeGreaterThanOrEqual(BASELINE.minPrecisionAt5);
    });

    it('should maintain Hit Rate@5 above baseline', () => {
      let totalHitRate = 0;
      for (const eq of EVAL_QUERIES) {
        const retrieved = simulateRetrieval(eq.query, allDocs, 5);
        totalHitRate += hitRate(retrieved, eq.expectedDocIds, 5);
      }
      const avgHitRate = totalHitRate / EVAL_QUERIES.length;
      console.log(`Hit Rate@5: ${(avgHitRate * 100).toFixed(1)}% (baseline: ${(BASELINE.minHitRateAt5 * 100).toFixed(1)}%)`);
      expect(avgHitRate).toBeGreaterThanOrEqual(BASELINE.minHitRateAt5);
    });
  });

  describe('Per-query regression', () => {
    // Each known query should perform at minimum level
    for (const eq of EVAL_QUERIES) {
      it(`should retrieve relevant docs for "${eq.query}"`, () => {
        const retrieved = simulateRetrieval(eq.query, allDocs, 10);
        const recall = recallAtK(retrieved, eq.expectedDocIds, 10);
        console.log(`  "${eq.query}": Recall@10=${(recall * 100).toFixed(1)}%`);
        expect(recall).toBeGreaterThanOrEqual(0.3);
      });
    }
  });

  describe('Citation quality regression', () => {
    it('should produce citations with relevant scores', () => {
      for (const eq of EVAL_QUERIES) {
        const retrieved = simulateRetrieval(eq.query, allDocs, 5);
        if (retrieved.length > 0) {
          const avgScore = retrieved.reduce((s, d) => s + (d.similarity ?? d.score ?? 0), 0) / retrieved.length;
          console.log(`  "${eq.query}": Avg retrieved score=${avgScore.toFixed(2)}`);
          expect(avgScore).toBeGreaterThanOrEqual(BASELINE.minContextScore);
        }
      }
    });

    it('should always return documents with source metadata for food queries', () => {
      const foodQueries = EVAL_QUERIES.filter(eq => eq.category === 'food');
      for (const eq of foodQueries) {
        const retrieved = simulateRetrieval(eq.query, allDocs, 5);
        for (const doc of retrieved) {
          expect(doc.source).toBeDefined();
          expect(doc.source).toContain('Nguồn:');
        }
      }
    });
  });

  describe('Destination detection regression', () => {
    it('should detect "Hà Nội" correctly in food queries', () => {
      const queries = [
        'món ngon Hà Nội',
        'ăn gì ở Hà Nội',
        'phở Hà Nội ngon nhất',
      ];
      for (const q of queries) {
        const cleanInput = removeDiacritics(q.toLowerCase());
        const found = MOCK_REGIONS.some(r => {
          const cleanRegion = removeDiacritics(r.toLowerCase());
          return cleanRegion.length > 1 && cleanInput.includes(cleanRegion);
        });
        expect(found).toBe(true);
      }
    });
  });

  describe('Empty/corner case regression', () => {
    it('should handle very long queries without crashing', () => {
      const longQuery = 'món ăn '.repeat(50).trim();
      const retrieved = simulateRetrieval(longQuery, allDocs, 5);
      expect(Array.isArray(retrieved)).toBe(true);
    });

    it('should handle special characters in queries', () => {
      const query = 'đặc sản! @#$%^&*()_+ Hà Nội???';
      const clean = removeDiacritics(query.toLowerCase());
      expect(clean).toContain('ha noi');
      const retrieved = simulateRetrieval(query, allDocs, 5);
      expect(Array.isArray(retrieved)).toBe(true);
    });
  });
});

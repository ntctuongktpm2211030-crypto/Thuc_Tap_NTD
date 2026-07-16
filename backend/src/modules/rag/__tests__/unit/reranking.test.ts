import { describe, it, expect } from 'vitest';
import { RetrievedDoc } from '../../types/rag.types';
import { createMockDocs, RERANK_CASES } from '../helpers/test-data';
import { removeDiacritics } from '../../../ai-agents/utils/agent.utils';

/**
 * Replica of the rerankDocs function from rag-pipeline.service.ts
 * for isolated unit testing.
 */
function rerankDocs(
  docs: RetrievedDoc[],
  destination: string | null,
  scoreThreshold: number = 0.5
): { docs: RetrievedDoc[]; filtered: number; strategy: string } {
  if (!docs || docs.length === 0) {
    return { docs: [], filtered: 0, strategy: 'no-docs' };
  }

  let filtered = docs;
  const beforeCount = docs.length;

  // Step 1: Sort by score descending
  filtered = filtered.sort((a, b) => {
    const scoreA = a.similarity ?? a.score ?? 0;
    const scoreB = b.similarity ?? b.score ?? 0;
    return scoreB - scoreA;
  });

  // Step 2: Apply score threshold filter
  filtered = filtered.filter(d => {
    const score = d.similarity ?? d.score ?? 0;
    return score >= scoreThreshold;
  });

  // Step 3: Filter by destination relevance (if destination is known)
  if (destination) {
    const cleanDest = removeDiacritics(destination.toLowerCase()).replace(/\s+/g, '');
    filtered = filtered.filter(d => {
      const cleanTitle = removeDiacritics(d.title.toLowerCase()).replace(/\s+/g, '');
      const cleanContent = removeDiacritics(d.content.toLowerCase()).replace(/\s+/g, '');
      return cleanTitle.includes(cleanDest) || cleanContent.includes(cleanDest);
    });
  }

  const filteredCount = beforeCount - filtered.length;
  return { docs: filtered, filtered: filteredCount, strategy: `filtered(${filteredCount})` };
}

// ─── Tests ───────────────────────────────────────────────
describe('rerankDocs() — document filtering & scoring', () => {
  describe('Score threshold filtering', () => {
    it('should filter out docs below threshold', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 0.8);
      // Docs with score >= 0.8: doc-1(0.92), doc-2(0.88), doc-3(0.85), doc-5(0.95), doc-6(0.82)
      expect(result.docs.length).toBe(5);
    });

    it('should include all docs with threshold of 0', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 0);
      expect(result.docs.length).toBe(docs.length);
    });

    it('should exclude all docs with threshold of 1.0', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 1.0);
      expect(result.docs.length).toBe(0);
    });

    it('should return empty for empty input', () => {
      const result = rerankDocs([], null, 0.5);
      expect(result.docs).toEqual([]);
      expect(result.filtered).toBe(0);
    });
  });

  describe('Sorting by score', () => {
    it('should return docs sorted descending by score', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 0.5);
      for (let i = 1; i < result.docs.length; i++) {
        const prevScore = result.docs[i - 1].similarity ?? result.docs[i - 1].score ?? 0;
        const currScore = result.docs[i].similarity ?? result.docs[i].score ?? 0;
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    });

    it('should put highest-scoring doc first', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 0.5);
      expect(result.docs[0].id).toBe('doc-5'); // score 0.95
    });
  });

  describe('Destination filtering', () => {
    it('should only return docs matching Hà Nội', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, 'Hà Nội', 0.5);
      expect(result.docs.length).toBeGreaterThan(0);
      for (const doc of result.docs) {
        const combined = removeDiacritics(`${doc.title} ${doc.content}`).replace(/\s+/g, '');
        expect(combined).toContain('hanoi');
      }
    });

    it('should only return docs matching Huế', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, 'Huế', 0.5);
      expect(result.docs.length).toBe(1);
      expect(result.docs[0].title).toContain('Huế');
    });

    it('should return empty when no docs match destination', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, 'NonExistentPlace', 0.5);
      expect(result.docs.length).toBe(0);
    });
  });

  describe('Combined filtering', () => {
    it('should apply both score and destination filters', () => {
      const docs = createMockDocs();
      // Hà Nội docs with score >= 0.8
      const result = rerankDocs(docs, 'Hà Nội', 0.8);
      for (const doc of result.docs) {
        const score = doc.similarity ?? doc.score ?? 0;
        expect(score).toBeGreaterThanOrEqual(0.8);
        const combined = removeDiacritics(`${doc.title} ${doc.content}`).replace(/\s+/g, '');
        expect(combined).toContain('hanoi');
      }
    });

    it('should preserve doc metadata through filtering', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 0.5);
      for (const doc of result.docs) {
        expect(doc.id).toBeDefined();
        expect(doc.title).toBeDefined();
        expect(doc.content).toBeDefined();
        expect(doc.category).toBeDefined();
        expect(doc.score).toBeDefined();
        expect(typeof doc.score).toBe('number');
      }
    });

    it('should report correct filtered count', () => {
      const docs = createMockDocs();
      const result = rerankDocs(docs, null, 0.8);
      const aboveThreshold = docs.filter(d => (d.similarity ?? d.score ?? 0) >= 0.8).length;
      expect(result.docs.length).toBe(aboveThreshold);
      expect(result.filtered).toBe(docs.length - aboveThreshold);
    });
  });
});

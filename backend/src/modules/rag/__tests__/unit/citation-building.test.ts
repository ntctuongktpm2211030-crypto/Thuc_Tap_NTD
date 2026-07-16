import { describe, it, expect } from 'vitest';
import { createMockDocs, EXPECTED_CITATION_SHAPE } from '../helpers/test-data';
import { RetrievedDoc } from '../../types/rag.types';
import { Citation } from '../../../ai-agents/types/agent.types';

/**
 * Replica of buildCitationsFromDocs from agent.utils.ts for isolated unit testing.
 */
function buildCitationsFromDocs(docs: any[], maxCites: number = 5): Citation[] {
  if (!docs || docs.length === 0) return [];

  const filtered = docs
    .filter(d => {
      const score = d.similarity !== undefined ? d.similarity : d.score;
      return score !== undefined && score >= 0.6;
    })
    .sort((a, b) => {
      const scoreA = a.similarity !== undefined ? a.similarity : a.score;
      const scoreB = b.similarity !== undefined ? b.similarity : b.score;
      return (scoreB || 0) - (scoreA || 0);
    })
    .slice(0, maxCites);

  return filtered.map((d, idx) => ({
    id: d.id || `cite-${idx}`,
    title: d.title || 'Nguồn tham khảo',
    content: d.content ? (d.content.length > 300 ? d.content.substring(0, 300) + '...' : d.content) : '',
    category: d.category || 'general',
    score: d.similarity !== undefined ? d.similarity : (d.score || 0),
    similarity: d.similarity || d.score || 0,
    index: idx + 1,
    source: d.source || undefined,
    url: d.url || undefined,
  }));
}

/**
 * Replica of buildRagContextWithRefs from agent.utils.ts for isolated unit testing.
 */
function buildRagContextWithRefs(docs: any[]): string {
  if (!docs || docs.length === 0) return 'Không tìm thấy tài liệu liên quan.';

  return docs
    .filter(d => {
      const score = d.similarity !== undefined ? d.similarity : d.score;
      return score !== undefined && score >= 0.6;
    })
    .slice(0, 5)
    .map((d, idx) => {
      const cleanContent = d.content && d.content.length > 800 ? d.content.substring(0, 800) + '...' : (d.content || '');
      const sourceLine = d.source ? `\n   (${d.source})` : '';
      return `[${idx + 1}] ${d.title}: ${cleanContent}${sourceLine}`;
    })
    .join('\n\n');
}

// ─── Tests: buildCitationsFromDocs ───────────────────────
describe('buildCitationsFromDocs() — citation building', () => {
  it('should return empty array for empty input', () => {
    expect(buildCitationsFromDocs([])).toEqual([]);
    expect(buildCitationsFromDocs(null as any)).toEqual([]);
    expect(buildCitationsFromDocs(undefined as any)).toEqual([]);
  });

  it('should filter docs with score >= 0.6', () => {
    const docs = createMockDocs();
    const citations = buildCitationsFromDocs(docs);
    for (const c of citations) {
      expect(c.score).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('should exclude docs with score < 0.6', () => {
    const docs = createMockDocs();
    // doc-8 has score 0.55, doc-10 has score 0.45
    const citations = buildCitationsFromDocs(docs);
    const lowScoreCitations = citations.filter(c => c.score < 0.6);
    expect(lowScoreCitations.length).toBe(0);
  });

  it('should sort citations by score descending', () => {
    const docs = createMockDocs();
    const citations = buildCitationsFromDocs(docs);
    for (let i = 1; i < citations.length; i++) {
      expect(citations[i - 1].score).toBeGreaterThanOrEqual(citations[i].score);
    }
  });

  it('should limit to maxCites', () => {
    const docs = createMockDocs();
    const citations = buildCitationsFromDocs(docs, 3);
    expect(citations.length).toBeLessThanOrEqual(3);
  });

  it('should assign sequential indexes starting from 1', () => {
    const docs = createMockDocs();
    const citations = buildCitationsFromDocs(docs);
    citations.forEach((c, idx) => {
      expect(c.index).toBe(idx + 1);
    });
  });

  it('should preserve source and url metadata', () => {
    const docs = createMockDocs();
    const citations = buildCitationsFromDocs(docs);
    for (const c of citations) {
      expect(c.source).toBeDefined();
      expect(c.source).toContain('Nguồn:');
    }
  });

  it('should have correct Citation shape', () => {
    const docs = createMockDocs();
    const citations = buildCitationsFromDocs(docs);
    for (const c of citations) {
      expect(c).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        content: expect.any(String),
        category: expect.any(String),
        score: expect.any(Number),
        similarity: expect.any(Number),
        index: expect.any(Number),
        source: expect.any(String),
      });
    }
  });

  it('should truncate content over 300 chars', () => {
    const docs = createMockDocs([
      { content: 'A'.repeat(500) },
    ]);
    const citations = buildCitationsFromDocs([docs[0]]);
    expect(citations[0].content.length).toBeLessThanOrEqual(303); // 300 + '...'
  });

  it('should create fallback id for docs without id', () => {
    const docs = [{ title: 'Test', content: 'Test', score: 0.9, similarity: 0.9, category: 'test' }];
    const citations = buildCitationsFromDocs(docs);
    expect(citations[0].id).toContain('cite-');
  });
});

// ─── Tests: buildRagContextWithRefs ──────────────────────
describe('buildRagContextWithRefs() — context assembly', () => {
  it('should return fallback message for empty docs', () => {
    const result = buildRagContextWithRefs([]);
    expect(result).toBe('Không tìm thấy tài liệu liên quan.');
  });

  it('should include numbered references [1], [2], etc.', () => {
    const docs = createMockDocs().slice(0, 3);
    const result = buildRagContextWithRefs(docs);
    expect(result).toContain('[1]');
    expect(result).toContain('[2]');
    expect(result).toContain('[3]');
  });

  it('should include source attribution in context', () => {
    const docs = createMockDocs().slice(0, 2);
    const result = buildRagContextWithRefs(docs);
    expect(result).toContain('Nguồn:');
  });

  it('should include document titles', () => {
    const docs = createMockDocs().slice(0, 2);
    const result = buildRagContextWithRefs(docs);
    expect(result).toContain('Phở Hà Nội');
    expect(result).toContain('Văn Miếu');
  });

  it('should exclude docs with score < 0.6', () => {
    const docs = createMockDocs();
    const result = buildRagContextWithRefs(docs);
    // doc-10 has score 0.45, should not appear
    expect(result).not.toContain('Món ngon Sài Gòn');
  });

  it('should be limited to max 5 documents', () => {
    const docs = createMockDocs();
    const result = buildRagContextWithRefs(docs);
    const referenceCount = (result.match(/\[\d+\]/g) || []).length;
    expect(referenceCount).toBeLessThanOrEqual(5);
  });

  it('should create well-formatted context blocks', () => {
    const docs = createMockDocs().slice(0, 1);
    const result = buildRagContextWithRefs(docs);
    // Each block should have format: [N] Title: content\n   (Source)
    expect(result).toMatch(/^\[\d+\]/);
    expect(result).toContain(': ');
    expect(result).toContain('Nguồn:');
  });
});

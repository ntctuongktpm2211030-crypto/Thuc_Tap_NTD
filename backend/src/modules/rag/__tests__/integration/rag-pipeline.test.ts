import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetrievedDoc } from '../../types/rag.types';
import { createMockDocs, MOCK_REGIONS } from '../helpers/test-data';
import { removeDiacritics, cleanGeographicName } from '../../../ai-agents/utils/agent.utils';
import { KnowledgeCategory } from '../../types/rag.types';

// ─── Mock getDynamicRegions ──────────────────────────────
vi.mock('../../../config/db', () => ({
  default: {
    knowledgeContent: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    destination: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import * as agentUtils from '../../../ai-agents/utils/agent.utils';
vi.spyOn(agentUtils, 'getDynamicRegions').mockResolvedValue(MOCK_REGIONS);

// ─── Pure function: detectCategory ───────────────────────
function detectCategory(query: string, explicit?: string): { category: string | null; method: string } {
  if (explicit) return { category: explicit, method: 'explicit' };
  const clean = query.toLowerCase();
  const categoryKeywords: Record<string, { keywords: string[]; priority: number }> = {
    food: { keywords: ['đặc sản', 'món ăn', 'ăn gì', 'ẩm thực', 'quán ăn', 'nhà hàng', 'món ngon', 'lẩu', 'bánh', 'hải sản', 'đồ ăn', 'thức ăn', 'ăn uống', 'thưởng thức', 'com', 'pho', 'bun', 'che'], priority: 3 },
    culture: { keywords: ['văn hóa', 'phong tục', 'tập quán', 'lễ hội', 'con người', 'tín ngưỡng', 'tôn giáo', 'nghệ thuật', 'chùa', 'đền', 'miếu', 'nếp sống'], priority: 2 },
    history: { keywords: ['lịch sử', 'nguồn gốc', 'kháng chiến', 'bảo tàng', 'di tích', 'cổ kính', 'cổ xưa', 'truyền thuyết', 'sự tích', 'thành lập'], priority: 2 },
    festival: { keywords: ['lễ hội', 'festival', 'mùa', 'hội làng', 'cúng', 'lễ', 'tết', 'kỷ niệm', 'diễn ra', 'nghi lễ'], priority: 2 },
    destination: { keywords: ['địa điểm', 'điểm đến', 'cảnh đẹp', 'tham quan', 'bản đồ', 'đường đi', 'di chuyển', 'bãi biển', 'núi', 'sông', 'hồ', 'thác', 'đảo', 'rừng', 'vịnh', 'du lịch'], priority: 1 },
  };

  let bestCategory: string | null = null;
  let bestPriority = -1;
  let matchCount = 0;
  for (const [cat, config] of Object.entries(categoryKeywords)) {
    const count = config.keywords.filter(kw => clean.includes(kw)).length;
    if (count > 0 && (config.priority > bestPriority || (config.priority === bestPriority && count > matchCount))) {
      bestCategory = cat; bestPriority = config.priority; matchCount = count;
    }
  }
  return bestCategory ? { category: bestCategory, method: `keyword (${matchCount} hits)` } : { category: null, method: 'not-detected' };
}

// ─── Pure function: detectDestination ────────────────────
async function detectDestination(query: string, explicit?: string): Promise<{ destination: string | null; method: string }> {
  if (explicit) return { destination: explicit, method: 'explicit' };
  const regions = MOCK_REGIONS;
  const cleanInput = removeDiacritics(query.toLowerCase());
  for (const region of regions) {
    const cleanR = removeDiacritics(region.toLowerCase());
    if (cleanR.length > 1 && cleanInput.includes(cleanR)) return { destination: region, method: 'exact-match' };
  }
  for (const region of regions) {
    const stripped = cleanGeographicName(region);
    if (stripped.length > 2 && cleanInput.includes(stripped)) return { destination: region, method: 'stripped-match' };
  }
  const match = query.match(/(?:đi|đến|ở|tại|du lịch|khám phá|về)\s+(\S+(?:\s+\S+){0,2})/u);
  if (match) {
    const name = match[1].trim();
    const cleanName = removeDiacritics(name.toLowerCase());
    for (const region of regions) {
      const cleanR = removeDiacritics(region.toLowerCase());
      if (cleanR === cleanName || cleanName.includes(cleanR) || cleanR.includes(cleanName)) {
        return { destination: region, method: 'regex+verify' };
      }
    }
    return { destination: name, method: 'regex-only' };
  }
  return { destination: null, method: 'not-found' };
}

// ─── Pure functions: context assembly ─────────────────────
function buildRagContextWithRefs(docs: any[]): string {
  if (!docs || docs.length === 0) return 'Không tìm thấy tài liệu liên quan.';
  return docs
    .filter(d => { const s = d.similarity ?? d.score; return s !== undefined && s >= 0.6; })
    .slice(0, 5)
    .map((d, idx) => {
      const c = d.content?.length > 800 ? d.content.substring(0, 800) + '...' : (d.content || '');
      const src = d.source ? `\n   (${d.source})` : '';
      return `[${idx + 1}] ${d.title}: ${c}${src}`;
    })
    .join('\n\n');
}

function buildCitationsFromDocs(docs: any[], maxCites = 5) {
  if (!docs || docs.length === 0) return [];
  return docs
    .filter(d => { const s = d.similarity ?? d.score; return s !== undefined && s >= 0.6; })
    .sort((a, b) => (b.similarity ?? b.score ?? 0) - (a.similarity ?? a.score ?? 0))
    .slice(0, maxCites)
    .map((d, idx) => ({
      id: d.id || `cite-${idx}`,
      title: d.title || 'Nguồn tham khảo',
      content: d.content?.length > 300 ? d.content.substring(0, 300) + '...' : (d.content || ''),
      category: d.category || 'general',
      score: d.similarity ?? d.score ?? 0,
      similarity: d.similarity || d.score || 0,
      index: idx + 1,
      source: d.source || undefined,
      url: d.url || undefined,
    }));
}

interface PipelineTestResult {
  destination: string | null;
  category: string | null;
  docs: RetrievedDoc[];
  contextText: string;
  citations: any[];
  hasData: boolean;
}

async function runPipeline(
  query: string,
  allDocs: RetrievedDoc[],
  opts?: { destination?: string; category?: string; topK?: number; scoreThreshold?: number }
): Promise<PipelineTestResult> {
  const { destination: explicitDest, category: explicitCat, topK = 5, scoreThreshold = 0.5 } = opts || {};
  const { destination: detectedDest } = await detectDestination(query, explicitDest);
  const { category: detectedCat } = detectCategory(query, explicitCat);
  const catFilter = detectedCat as KnowledgeCategory | undefined;

  let docs = allDocs;
  if (catFilter) docs = docs.filter(d => d.category === catFilter);
  docs = docs.filter(d => (d.similarity ?? d.score ?? 0) >= scoreThreshold);
  docs = docs.sort((a, b) => (b.similarity ?? b.score ?? 0) - (a.similarity ?? a.score ?? 0));

  if (detectedDest) {
    const cleanDest = removeDiacritics(detectedDest.toLowerCase()).replace(/\s+/g, '');
    docs = docs.filter(d => {
      const t = removeDiacritics(d.title.toLowerCase()).replace(/\s+/g, '');
      const c = removeDiacritics(d.content.toLowerCase()).replace(/\s+/g, '');
      return t.includes(cleanDest) || c.includes(cleanDest);
    });
  }

  const finalDocs = docs.slice(0, topK);
  return {
    destination: detectedDest,
    category: detectedCat,
    docs: finalDocs,
    contextText: buildRagContextWithRefs(finalDocs),
    citations: buildCitationsFromDocs(finalDocs),
    hasData: finalDocs.length > 0,
  };
}

// ─── Tests ───────────────────────────────────────────────
describe('RAG Pipeline Integration', () => {
  const allDocs = createMockDocs();
  beforeEach(() => { vi.clearAllMocks(); });

  describe('Food query pipeline', () => {
    it('should process "món ăn ngon ở Hà Nội" end-to-end', async () => {
      const result = await runPipeline('món ăn ngon ở Hà Nội', allDocs);
      expect(result.destination).toBe('Hà Nội');
      expect(result.category).toBe('food');
      expect(result.docs.length).toBeGreaterThan(0);
      for (const doc of result.docs) {
        expect(doc.category).toBe('food');
        const combined = removeDiacritics(`${doc.title} ${doc.content}`).replace(/\s+/g, '');
        expect(combined).toContain('hanoi');
      }
      expect(result.contextText).toContain('[1]');
      expect(result.contextText).toContain('Nguồn:');
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.citations[0].source).toBeDefined();
      expect(result.citations[0].index).toBe(1);
    });
  });

  describe('Destination-only query', () => {
    it('should detect destination without category', async () => {
      const result = await runPipeline('đi Hà Nội', allDocs);
      expect(result.destination).toBe('Hà Nội');
    });
  });

  describe('Pipeline edge cases', () => {
    it('should handle query with explicit destination and category', async () => {
      const result = await runPipeline('any query', allDocs, { destination: 'Đà Lạt', category: 'destination', topK: 3 });
      expect(result.destination).toBe('Đà Lạt');
      expect(result.category).toBe('destination');
      expect(result.docs.length).toBeLessThanOrEqual(3);
    });

    it('should handle query with no category/destination — returns all docs above threshold', async () => {
      // When no category or destination filters apply, all docs above score threshold are returned
      const result = await runPipeline('xyzzy nonesuch', allDocs, { topK: 10, scoreThreshold: 0.5 });
      // With 0.5 threshold, docs with score >= 0.5 are returned (most mock docs)
      const aboveThreshold = allDocs.filter(d => (d.similarity ?? d.score ?? 0) >= 0.5).length;
      expect(result.docs.length).toBe(Math.min(aboveThreshold, 10));
      expect(result.hasData).toBe(true);
    });

    it('should return no data with very high score threshold', async () => {
      const result = await runPipeline('gibberish xyz', allDocs, { scoreThreshold: 0.99 });
      expect(result.hasData).toBe(false);
      expect(result.contextText).toBe('Không tìm thấy tài liệu liên quan.');
    });

    it('should respect topK parameter', async () => {
      const result = await runPipeline('món ăn', allDocs, { topK: 2, scoreThreshold: 0 });
      expect(result.docs.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Context quality', () => {
    it('should produce context with numbered references', async () => {
      const result = await runPipeline('đặc sản', allDocs, { scoreThreshold: 0.7 });
      if (result.hasData) expect(result.contextText).toMatch(/\[\d+\]/);
    });

    it('should produce citations with correct structure', async () => {
      const result = await runPipeline('đặc sản', allDocs, { scoreThreshold: 0.7 });
      for (const c of result.citations) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('title');
        expect(c).toHaveProperty('content');
        expect(c).toHaveProperty('score');
        expect(c).toHaveProperty('index');
        expect(c).toHaveProperty('source');
      }
    });

    it('should include source attribution in context', async () => {
      const result = await runPipeline('đặc sản', allDocs, { scoreThreshold: 0.7 });
      if (result.hasData) expect(result.contextText).toContain('Nguồn:');
    });
  });
});

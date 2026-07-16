import { EmbeddingsService } from './embeddings.service';
import { VectorStoreService } from './vector-store.service';
import { RetrieverService } from './retriever.service';
import { PromptBuilderService } from './prompt-builder.service';
import { KnowledgeCategory, RetrievedDoc } from '../types/rag.types';
import { logger } from '../../../utils/logger';
import { removeDiacritics, cleanGeographicName, getDynamicRegions, buildCitationsFromDocs, buildRagContextWithRefs, mapTourismToProvince } from '../../ai-agents/utils/agent.utils';

export interface RagPipelineOptions {
  /** The user's raw query text */
  query: string;
  /** (Optional) Pre-detected destination name */
  destination?: string;
  /** (Optional) Pre-detected category */
  category?: string;
  /** Max documents to return after reranking */
  topK?: number;
  /** Request ID for logging correlation */
  requestId?: string;
  /** Whether to enhance query with destination prefix */
  enhanceQuery?: boolean;
}

export interface RagPipelineMetadata {
  destinationDetected: boolean;
  destination: string | null;
  categoryDetected: boolean;
  category: string | null;
  rawRetrievalCount: number;
  rerankedCount: number;
  finalDocCount: number;
  latencyMs: number;
  retrievalStrategy: string;
  destinationFilterApplied: boolean;
  scoreThreshold: number;
}

export interface RagPipelineResult {
  /** Reranked/filtered documents ready for prompt */
  docs: RetrievedDoc[];
  /** Formatted context string for LLM prompt injection */
  contextText: string;
  /** Citation objects for frontend display */
  citations: ReturnType<typeof buildCitationsFromDocs>;
  /** Whether any documents were found */
  hasData: boolean;
  /** Detected destination (may be inferred) */
  destination: string | null;
  /** Detected category (may be inferred) */
  category: string | null;
  /** Pipeline execution metadata */
  metadata: RagPipelineMetadata;
}

/**
 * Detects destination from query text using fuzzy matching against known regions.
 */
async function detectDestination(
  query: string,
  explicit?: string
): Promise<{ destination: string | null; method: string }> {
  if (explicit) {
    const mapped = mapTourismToProvince(explicit);
    return { destination: mapped, method: `explicit (${mapped})` };
  }

  try {
    const regions = await getDynamicRegions();
    const cleanInput = removeDiacritics(query.toLowerCase());

    // 1. Map địa danh du lịch phổ biến trực tiếp trước (ví dụ "Đà Lạt" -> "Lâm Đồng")
    const tourismPlaces = ['da lat', 'sapa', 'sa pa', 'phu quoc', 'nha trang', 'ha long', 'hue', 'vung tau', 'sai gon', 'tp hcm', 'hcm'];
    for (const place of tourismPlaces) {
      if (cleanInput.includes(place)) {
        const mapped = mapTourismToProvince(place);
        for (const region of regions) {
          if (removeDiacritics(region.toLowerCase()) === removeDiacritics(mapped.toLowerCase())) {
            return { destination: region, method: `tourism-place-match (${place} -> ${region})` };
          }
        }
      }
    }

    // 2. Exact match
    for (const region of regions) {
      const cleanRegion = removeDiacritics(region.toLowerCase());
      if (cleanRegion.length > 1 && cleanInput.includes(cleanRegion)) {
        return { destination: region, method: `exact-match (${region})` };
      }
    }

    // 3. Stripped match (remove geographic prefixes)
    for (const region of regions) {
      const stripped = cleanGeographicName(region);
      if (stripped.length > 2 && cleanInput.includes(stripped)) {
        return { destination: region, method: `stripped-match (${region})` };
      }
    }

    // 4. Check travel/food patterns like "đi X", "ở X", "đặc sản X"
    const match = query.match(/(?:đi|đến|ở|tại|du lịch|khám phá|về|đặc sản|mon an o|quan an o)\s+([AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬBCDĐEÈẺẼÉẸÊỀỂỄẾỆGHIÌỈĨÍỊJKLMNOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢPQRSTUÙỦŨÚỤƯỪỬỮỨỰVXYỲỶỸÝỴZ][aàảãáạăằẳẵắặâầẩẫấậbcdđeèẻẽéẹêềểễếệghiìỉĩíịjklmnoòỏõóọôồổỗốộơờởỡớợpqrstuùủũúụưừửữứựvxyỳỷỹýỵz]+(?:\s+[AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬBCDĐEÈẺẼÉẸÊỀỂỄẾỆGHIÌỈĨÍỊJKLMNOÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢPQRSTUÙỦŨÚỤƯỪỬỮỨỰVXYỲỶỸÝỴZ][aàảãáạăằẳẵắặâầẩẫấậbcdđeèẻẽéẹêềểễếệghiìỉĩíịjklmnoòỏõóọôồổỗốộơờởỡớợpqrstuùủũúụưừửữứựvxyỳỷỹýỵz]+){0,2})/u);
    if (match) {
      const name = match[1].trim();
      const cleanName = removeDiacritics(name.toLowerCase());
      for (const region of regions) {
        const cleanRegion = removeDiacritics(region.toLowerCase());
        if (cleanRegion === cleanName || cleanName.includes(cleanRegion) || cleanRegion.includes(cleanName)) {
          return { destination: region, method: `regex+verify (${name} -> ${region})` };
        }
      }
      
      const mapped = mapTourismToProvince(name);
      if (mapped !== name) {
        for (const region of regions) {
          if (removeDiacritics(region.toLowerCase()) === removeDiacritics(mapped.toLowerCase())) {
            return { destination: region, method: `regex+mapped-verify (${name} -> ${region})` };
          }
        }
      }
      return { destination: name, method: `regex-only (${name})` };
    }
  } catch (_) {
    logger.warn('RagPipeline', 'Destination detection failed', { error: (_ as Error).message });
  }

  return { destination: null, method: 'not-found' };
}

/**
 * Detects category from query text using keyword matching.
 * Maps to KnowledgeCategory types: 'food', 'culture', 'festival', 'history', 'destination'
 */
function detectCategory(query: string, explicit?: string): { category: string | null; method: string } {
  if (explicit) {
    return { category: explicit, method: 'explicit' };
  }

  const clean = query.toLowerCase();

  const categoryKeywords: Record<string, { keywords: string[]; priority: number }> = {
    food: {
      keywords: ['đặc sản', 'món ăn', 'ăn gì', 'ẩm thực', 'quán ăn', 'nhà hàng', 'món ngon', 'lẩu', 'bánh', 'hải sản', 'đồ ăn', 'thức ăn', 'ăn uống', 'thưởng thức', 'com', 'pho', 'bun', 'che'],
      priority: 3,
    },
    culture: {
      keywords: ['văn hóa', 'phong tục', 'tập quán', 'lễ hội', 'con người', 'tín ngưỡng', 'tôn giáo', 'nghệ thuật', 'chùa', 'đền', 'miếu', 'nếp sống'],
      priority: 2,
    },
    history: {
      keywords: ['lịch sử', 'nguồn gốc', 'kháng chiến', 'bảo tàng', 'di tích', 'cổ kính', 'cổ xưa', 'truyền thuyết', 'sự tích', 'thành lập'],
      priority: 2,
    },
    festival: {
      keywords: ['lễ hội', 'festival', 'mùa', 'hội làng', 'cúng', 'lễ', 'tết', 'kỷ niệm', 'diễn ra', 'nghi lễ'],
      priority: 2,
    },
    destination: {
      keywords: ['địa điểm', 'điểm đến', 'cảnh đẹp', 'tham quan', 'bản đồ', 'đường đi', 'di chuyển', 'bãi biển', 'núi', 'sông', 'hồ', 'thác', 'đảo', 'rừng', 'vịnh', 'du lịch'],
      priority: 1,
    },
  };

  let bestCategory: string | null = null;
  let bestPriority = -1;
  let matchCount = 0;

  for (const [cat, config] of Object.entries(categoryKeywords)) {
    const count = config.keywords.filter(kw => clean.includes(kw)).length;
    if (count > 0 && (config.priority > bestPriority || (config.priority === bestPriority && count > matchCount))) {
      bestCategory = cat;
      bestPriority = config.priority;
      matchCount = count;
    }
  }

  if (bestCategory) {
    return { category: bestCategory, method: `keyword (${matchCount} hits on "${bestCategory}")` };
  }

  return { category: null, method: 'not-detected' };
}

/**
 * Reranks and filters retrieved documents by destination relevance and score threshold.
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
  let strategy = 'none';
  let beforeCount = docs.length;

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
  let filteredOutByScore = beforeCount - filtered.length;

  // Step 3: Filter by destination relevance (if destination is known)
  let filteredOutByDest = 0;
  if (destination) {
    const cleanDest = removeDiacritics(destination.toLowerCase()).replace(/\s+/g, '');
    const beforeDestFilter = filtered.length;
    filtered = filtered.filter(d => {
      const cleanTitle = removeDiacritics(d.title.toLowerCase()).replace(/\s+/g, '');
      const cleanContent = removeDiacritics(d.content.toLowerCase()).replace(/\s+/g, '');
      return cleanTitle.includes(cleanDest) || cleanContent.includes(cleanDest);
    });
    filteredOutByDest = beforeDestFilter - filtered.length;
  }

  strategy = `score-filter(${filteredOutByScore}removed)${destination ? `+dest-filter(${filteredOutByDest}removed)` : ''}`;

  return { docs: filtered, filtered: beforeCount - filtered.length, strategy };
}

export class RagPipelineService {
  private retriever: RetrieverService;
  private promptBuilder: PromptBuilderService;
  private embeddingsService: EmbeddingsService;
  private vectorStoreService: VectorStoreService;

  constructor() {
    this.embeddingsService = new EmbeddingsService();
    this.vectorStoreService = new VectorStoreService();
    this.retriever = new RetrieverService(this.embeddingsService, this.vectorStoreService);
    this.promptBuilder = new PromptBuilderService();
  }

  /**
   * Execute the full RAG pipeline:
   *   destination detection → category detection → retrieval → reranking → context assembly → logging
   */
  async execute(options: RagPipelineOptions): Promise<RagPipelineResult> {
    const pipelineStart = Date.now();
    const { query, destination: explicitDest, category: explicitCat, topK = 5, requestId, enhanceQuery = true } = options;

    logger.info('RagPipeline', 'Pipeline starting', { queryLength: query.length, explicitDest, explicitCat, topK }, requestId);

    // ── Step 1: Destination Detection ──
    const destStart = Date.now();
    const { destination: detectedDest, method: destMethod } = await detectDestination(query, explicitDest);
    const destLatency = Date.now() - destStart;
    logger.info('RagPipeline', 'Destination detection', {
      detected: detectedDest,
      method: destMethod,
      latencyMs: destLatency,
    }, requestId);

    // ── Step 2: Category Detection ──
    const catStart = Date.now();
    const { category: detectedCat, method: catMethod } = detectCategory(query, explicitCat);
    const catLatency = Date.now() - catStart;
    logger.info('RagPipeline', 'Category detection', {
      detected: detectedCat,
      method: catMethod,
      latencyMs: catLatency,
    }, requestId);

    // ── Step 3: Build enhanced query ──
    let searchQuery = query;
    if (enhanceQuery && detectedDest) {
      searchQuery = `${detectedDest} ${query}`;
    }
    const categoryParam = detectedCat ? detectedCat as KnowledgeCategory : undefined;

    logger.info('RagPipeline', 'Retrieving with', {
      searchQuery,
      category: categoryParam || 'none',
      topK: topK + 3, // Fetch extra for reranking buffer
    }, requestId);

    // ── Step 4: Retrieval (fetch extra for reranking buffer) ──
    const retStart = Date.now();
    let rawDocs: RetrievedDoc[] = [];
    let retrievalStrategy = 'hybrid';
    try {
      rawDocs = await this.retriever.retrieve(searchQuery, categoryParam, topK + 3);
    } catch (retErr) {
      logger.warn('RagPipeline', 'Primary retrieval failed, retrying without category', { error: (retErr as Error).message }, requestId);
      try {
        rawDocs = await this.retriever.retrieve(searchQuery, undefined, topK + 3);
        retrievalStrategy = 'hybrid-fallback-no-category';
      } catch (retErr2) {
        logger.error('RagPipeline', 'All retrieval attempts failed', { error: (retErr2 as Error).message }, requestId);
        rawDocs = [];
      }
    }
    const retLatency = Date.now() - retStart;
    logger.info('RagPipeline', 'Raw retrieval completed', {
      rawCount: rawDocs.length,
      strategy: retrievalStrategy,
      latencyMs: retLatency,
      categories: [...new Set(rawDocs.map(d => d.category))],
    }, requestId);

    // ── Step 5: Rerank & Filter ──
    const rerankStart = Date.now();
    const scoreThreshold = parseFloat(process.env.RAG_SCORE_THRESHOLD || '0.5');
    const { docs: rerankedDocs, filtered, strategy: rerankStrategy } = rerankDocs(
      rawDocs,
      detectedDest,
      scoreThreshold
    );
    const rerankLatency = Date.now() - rerankStart;
    logger.info('RagPipeline', 'Reranking completed', {
      beforeCount: rawDocs.length,
      afterCount: rerankedDocs.length,
      filteredOut: filtered,
      strategy: rerankStrategy,
      scoreThreshold,
      latencyMs: rerankLatency,
    }, requestId);

    // ── Step 6: Slice to final topK ──
    const finalDocs = rerankedDocs.slice(0, topK);

    // ── Step 7: Assemble context ──
    const contextText = buildRagContextWithRefs(finalDocs);
    const citations = buildCitationsFromDocs(finalDocs);
    const hasData = finalDocs.length > 0;

    const totalLatency = Date.now() - pipelineStart;
    logger.info('RagPipeline', 'Pipeline completed', {
      destination: detectedDest,
      category: detectedCat,
      rawDocs: rawDocs.length,
      finalDocs: finalDocs.length,
      hasData,
      citationCount: citations.length,
      totalLatencyMs: totalLatency,
      retrieverProvider: retrievalStrategy,
    }, requestId);

    const metadata: RagPipelineMetadata = {
      destinationDetected: !!detectedDest,
      destination: detectedDest,
      categoryDetected: !!detectedCat,
      category: detectedCat,
      rawRetrievalCount: rawDocs.length,
      rerankedCount: rerankedDocs.length,
      finalDocCount: finalDocs.length,
      latencyMs: totalLatency,
      retrievalStrategy,
      destinationFilterApplied: !!detectedDest,
      scoreThreshold,
    };

    return {
      docs: finalDocs,
      contextText,
      citations,
      hasData,
      destination: detectedDest,
      category: detectedCat,
      metadata,
    };
  }
}

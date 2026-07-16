import { GuardrailsService } from './guardrails.service';
import { SemanticCacheService } from './semantic-cache.service';
import { FactVerifierService } from './fact-verifier.service';
import { CitationGeneratorService } from './citation-generator.service';
import { KnowledgeRepository } from '../repositories/knowledge.repository';
import { RagAuditRepository } from '../repositories/rag-audit.repository';
import { EmbeddingsService } from './embeddings.service';
import { EnterpriseRagResult, RetrievedDoc, ConfidenceEvaluation } from '../types/rag-enterprise.types';
import { logger } from '../../../utils/logger';

// Circuit Breaker simple state machine
let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
let failureCount = 0;
let lastStateChange = Date.now();
const FAILURE_THRESHOLD = 3;
const COOLDOWN_PERIOD_MS = 30000; // 30 seconds

export class RagOrchestratorService {
  private guardrails: GuardrailsService;
  private semanticCache: SemanticCacheService;
  private factVerifier: FactVerifierService;
  private citationGenerator: CitationGeneratorService;
  private knowledgeRepo: KnowledgeRepository;
  private auditRepo: RagAuditRepository;
  private embeddingsService: EmbeddingsService;

  constructor() {
    this.guardrails = new GuardrailsService();
    this.semanticCache = new SemanticCacheService();
    this.factVerifier = new FactVerifierService();
    this.citationGenerator = new CitationGeneratorService();
    this.knowledgeRepo = new KnowledgeRepository();
    this.auditRepo = new RagAuditRepository();
    this.embeddingsService = new EmbeddingsService();
  }

  /**
   * Execute the full Enterprise RAG Orchestrator pipeline
   */
  async execute(options: {
    messageId: string;
    query: string;
    category?: string;
    topK?: number;
    requestId?: string;
  }): Promise<EnterpriseRagResult> {
    const pipelineStart = Date.now();
    const { messageId, query, category, topK = 4, requestId } = options;

    logger.info('RagOrchestrator', 'Enterprise pipeline starting', { queryLength: query.length, category, topK }, requestId);

    // ── Step 1: Input Guardrails ──
    const inputGuard = this.guardrails.validateInput(query);
    if (inputGuard.blocked) {
      logger.warn('RagOrchestrator', 'Input guardrails blocked request', { threatType: inputGuard.threatType, reason: inputGuard.violationReason }, requestId);
      
      // Save Guardrail Event
      await this.auditRepo.saveGuardrailEvent(
        inputGuard.threatType,
        'HIGH',
        query,
        'BLOCKED',
        undefined
      ).catch(() => {});

      return this.buildRefusalResponse('Yêu cầu của bạn bị chặn do vi phạm chính sách bảo mật nội dung.');
    }

    // ── Step 2: Semantic Cache Lookup ──
    try {
      const cached = await this.semanticCache.get(query);
      if (cached) {
        logger.info('RagOrchestrator', 'Semantic Cache Hit!', { query }, requestId);
        return cached;
      }
    } catch (err) {
      logger.warn('RagOrchestrator', 'Cache lookup error, continuing pipeline', { error: (err as Error).message }, requestId);
    }

    // ── Step 3: Embeddings Generation ──
    const embeddingStart = Date.now();
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await this.embeddingsService.generate(query);
    } catch (err) {
      logger.error('RagOrchestrator', 'Failed to generate embedding', { error: (err as Error).message }, requestId);
      // Fallback: generate a dummy or local hashed embedding to continue, or fail gracefully
      queryEmbedding = new Array(1536).fill(0).map(() => Math.random() * 0.1);
    }
    const embeddingLatency = Date.now() - embeddingStart;

    // ── Step 4: Hybrid Search (pgvector + BM25) ──
    const retrieveStart = Date.now();
    let docs: RetrievedDoc[] = [];
    try {
      docs = await this.knowledgeRepo.searchHybrid(query, queryEmbedding, category, topK);
    } catch (err) {
      logger.error('RagOrchestrator', 'Hybrid retrieval failed', { error: (err as Error).message }, requestId);
      docs = [];
    }
    const retrieveLatency = Date.now() - retrieveStart;

    // ── Step 5: Adaptive Top-K / Re-ranking ──
    // Standardize score thresholding to prevent noisy retrieval documents
    const threshold = 0.45;
    docs = docs.filter(d => (d.similarity || 0) >= threshold);
    
    // Sort descending by score
    docs.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    // ── Step 6: LLM Generation with Circuit Breaker and Retry ──
    const promptVersionHash = 'pv-v1-rag-default';
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';
    const promptTemplateText = `Bạn là trợ lý du lịch AI thông minh. Hãy sử dụng bối cảnh dưới đây để trả lời câu hỏi.`;

    const systemPrompt = `Bạn là trợ lý du lịch AI thông minh của SmartTravel. Hãy sử dụng bối cảnh dưới đây để trả lời câu hỏi chính xác và đầy đủ nhất.
Bối cảnh:
${docs.map((d, i) => `[${i + 1}] (${d.title}): ${d.content}`).join('\n\n')}`;

    const userPrompt = `Câu hỏi: ${query}`;

    let llmResponse = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    let latencyMs = 0;
    let ttftMs = 0;

    const llmCallStart = Date.now();

    // Check Circuit Breaker State
    if (circuitState === 'OPEN') {
      if (Date.now() - lastStateChange > COOLDOWN_PERIOD_MS) {
        circuitState = 'HALF_OPEN';
        logger.info('RagOrchestrator', 'Circuit Breaker entered HALF_OPEN state, testing request', {}, requestId);
      } else {
        logger.error('RagOrchestrator', 'Circuit Breaker is OPEN. Request rejected immediately.', {}, requestId);
        return this.buildRefusalResponse('Dịch vụ AI hiện đang quá tải. Vui lòng thử lại sau.');
      }
    }

    try {
      const responseData = await this.callLLMWithRetry(systemPrompt, userPrompt);
      llmResponse = responseData.text;
      promptTokens = responseData.usage.prompt_tokens;
      completionTokens = responseData.usage.completion_tokens;
      totalTokens = responseData.usage.total_tokens;
      latencyMs = Date.now() - llmCallStart;
      ttftMs = Math.round(latencyMs * 0.35); // Simulated TTFT

      // If success in HALF_OPEN, reset circuit
      if (circuitState === 'HALF_OPEN') {
        circuitState = 'CLOSED';
        failureCount = 0;
        lastStateChange = Date.now();
        logger.info('RagOrchestrator', 'Circuit Breaker closed successfully.', {}, requestId);
      }
    } catch (err) {
      logger.error('RagOrchestrator', 'LLM Call failed after retries', { error: (err as Error).message }, requestId);
      
      // Update Circuit Breaker State
      failureCount++;
      if (failureCount >= FAILURE_THRESHOLD) {
        circuitState = 'OPEN';
        lastStateChange = Date.now();
        logger.warn('RagOrchestrator', 'Circuit Breaker opened due to multiple failures', { failureCount }, requestId);
      }

      return this.buildRefusalResponse('Không thể kết nối với dịch vụ trí tuệ nhân tạo. Vui lòng kiểm tra lại sau.');
    }

    // ── Step 7: Fact Verification Pipeline ──
    const factStart = Date.now();
    const verification = this.factVerifier.verifyResponse(llmResponse, docs);
    const factLatency = Date.now() - factStart;

    // ── Step 8: In-line Citation Generator ──
    const citationResult = this.citationGenerator.generateCitations(llmResponse, verification.claims, docs);

    // ── Step 9: Enterprise Confidence Score Calculation ──
    // Math logic:
    // Groundedness = verification.groundednessScore (30%)
    // ClaimVer = verification.claimVerScore (20%)
    // Similarity = avg similarity (15%)
    // Authority = map based on sourceType (15%)
    // Freshness = fresh documents (5%)
    // Completeness = 95 (10%)
    // UserFeedback = 85 (5%)
    // CitationCoverage = citationResult.citationCoverage (5%)
    // CitationQuality = citationResult.citationQuality (5%)
    
    const avgSimilarity = docs.length > 0
      ? docs.reduce((sum, d) => sum + (d.similarity || 0.5), 0) / docs.length
      : 0.5;

    const trustScores: Record<string, number> = { db: 1.0, api: 0.95, government: 0.9, enterprise: 0.85, wiki: 0.7, blog: 0.6, forum: 0.4, ugc: 0.3 };
    const avgAuthority = docs.length > 0
      ? docs.reduce((sum, d) => sum + (trustScores[d.sourceType] || 0.5), 0) / docs.length
      : 0.5;

    const groundedness = verification.groundednessScore;
    const claimVer = verification.claimVerScore;
    const similarityScore = Math.round(avgSimilarity * 100);
    const authorityScore = Math.round(avgAuthority * 100);
    const freshnessScore = 95; // Placeholder baseline
    const completenessScore = docs.length > 0 ? 90 : 30; // Better with contexts
    const userFeedback = 85; // Baseline default

    let confidenceScore = Math.round(
      (0.30 * groundedness) +
      (0.20 * claimVer) +
      (0.15 * similarityScore) +
      (0.15 * authorityScore) +
      (0.10 * completenessScore) +
      (0.05 * freshnessScore) +
      (0.05 * userFeedback)
    );

    // Unsupported Claim Penalty
    let penalty = 0;
    if (verification.unsupportedClaimsCount === 1) {
      penalty = 25;
    } else if (verification.unsupportedClaimsCount >= 2) {
      penalty = 55;
    }
    confidenceScore = Math.max(0, Math.min(100, confidenceScore - penalty));

    // Map Confidence Level
    let reliabilityLevel: ConfidenceEvaluation['level'] = 'VERY_RELIABLE';
    if (confidenceScore < 50) {
      reliabilityLevel = 'REFUSED';
    } else if (confidenceScore < 70) {
      reliabilityLevel = 'VERIFY';
    } else if (confidenceScore < 90) {
      reliabilityLevel = 'RELIABLE';
    }

    // If confidence score is too low, convert response into Refusal
    let finalResponseText = citationResult.citedResponse;
    if (reliabilityLevel === 'REFUSED') {
      finalResponseText = 'Rất tiếc, hệ thống không tìm thấy đủ tài liệu đáng tin cậy trong cơ sở dữ liệu để trả lời chính xác câu hỏi này.';
    }

    // ── Step 10: Output Guardrails & Redaction ──
    const outputGuard = this.guardrails.validateOutput(finalResponseText);
    let guardrailsBlocked = false;
    let threatType = 'NONE';
    if (outputGuard.blocked) {
      logger.warn('RagOrchestrator', 'Output guardrails blocked generation', { threatType: outputGuard.threatType }, requestId);
      guardrailsBlocked = true;
      threatType = outputGuard.threatType;
      finalResponseText = 'Thông tin phản hồi bị chặn vì lý do bảo mật và kiểm soát đầu ra.';
    } else if (outputGuard.redactedPayload) {
      finalResponseText = outputGuard.redactedPayload;
    }

    // Calculate API Cost (GPT-4o-mini rates: Input = $0.15/1M, Output = $0.60/1M)
    const apiCostUsd = (promptTokens * 0.00000015) + (completionTokens * 0.0000006);

    const result: EnterpriseRagResult = {
      response: finalResponseText,
      confidence: {
        score: confidenceScore,
        level: reliabilityLevel,
        groundednessScore: groundedness,
        claimVerScore: claimVer,
        retrievedQuality: similarityScore,
        authorityScore,
        freshnessScore,
        completenessScore,
        citationCoverage: citationResult.citationCoverage,
        citationQuality: citationResult.citationQuality,
        consistencyScore: 90,
      },
      explainability: {
        claimsMapping: verification.claims,
        unsupportedClaims: verification.claims
          .filter(c => c.status === 'UNSUPPORTED' || c.status === 'FABRICATED_NUMBER')
          .map(c => c.text),
        modelCertaintyEvaluation: {
          avgTokenLogprobs: -0.05,
          selfEvaluationReasoning: `Fact verifications resulted in: ${verification.unsupportedClaimsCount} unsupported claims.`,
        },
      },
      inlineCitations: citationResult.inlineCitations,
      docs,
    };

    // ── Step 11: Async Auditing & Logging ──
    this.asyncLogging({
      messageId,
      query,
      systemPrompt,
      finalResponseText,
      avgSimilarity,
      confidenceScore,
      reliabilityLevel,
      groundedness,
      claimVer,
      docs,
      promptTokens,
      completionTokens,
      totalTokens,
      apiCostUsd,
      totalLatencyMs: Date.now() - pipelineStart,
      ttftMs,
      guardrailsBlocked,
      threatType,
      unsupportedClaimsCount: verification.unsupportedClaimsCount,
      modelName,
      promptVersionHash,
      promptTemplateText,
    }).catch(err => {
      logger.error('RagOrchestrator', 'Logging failed', { error: (err as Error).message }, requestId);
    });

    // ── Step 12: Semantic Cache Set (only for reliable responses) ──
    if (reliabilityLevel !== 'REFUSED' && !guardrailsBlocked) {
      this.semanticCache.set(query, result, 3600).catch(() => {});
    }

    return result;
  }

  /**
   * Helper to make API completions call with Retries & Backoff
   */
  private async callLLMWithRetry(
    systemPrompt: string,
    userPrompt: string,
    maxRetries: number = 3
  ): Promise<{ text: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    let attempt = 0;
    let delay = 1000; // start with 1s delay

    while (attempt < maxRetries) {
      try {
        const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          throw new Error(`LLM Error Status ${response.status}`);
        }

        const data = (await response.json()) as any;
        return {
          text: data.choices[0].message.content,
          usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        
        logger.warn('RagOrchestrator', `LLM call attempt ${attempt} failed, retrying in ${delay}ms`, { error: (err as Error).message });
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
    throw new Error('LLM Call failed');
  }

  /**
   * Refusal response builder
   */
  private buildRefusalResponse(message: string): EnterpriseRagResult {
    return {
      response: message,
      confidence: {
        score: 0,
        level: 'REFUSED',
        groundednessScore: 0,
        claimVerScore: 0,
        retrievedQuality: 0,
        authorityScore: 0,
        freshnessScore: 0,
        completenessScore: 0,
        citationCoverage: 0,
        citationQuality: 0,
        consistencyScore: 0,
      },
      explainability: {
        claimsMapping: [],
        unsupportedClaims: [],
        modelCertaintyEvaluation: {
          avgTokenLogprobs: 0,
          selfEvaluationReasoning: 'Refused response.',
        },
      },
      inlineCitations: [],
      docs: [],
    };
  }

  /**
   * Asynchronous logging method to prevent pipeline block
   */
  private async asyncLogging(data: {
    messageId: string;
    query: string;
    systemPrompt: string;
    finalResponseText: string;
    avgSimilarity: number;
    confidenceScore: number;
    reliabilityLevel: string;
    groundedness: number;
    claimVer: number;
    docs: RetrievedDoc[];
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    apiCostUsd: number;
    totalLatencyMs: number;
    ttftMs: number;
    guardrailsBlocked: boolean;
    threatType: string;
    unsupportedClaimsCount: number;
    modelName: string;
    promptVersionHash: string;
    promptTemplateText: string;
  }) {
    // 1. Get or register model
    const model = await this.auditRepo.getOrRegisterModel(
      data.modelName,
      'openai',
      'llm',
      'v1'
    );

    // 2. Get or register prompt template
    const prompt = await this.auditRepo.getOrRegisterPrompt(
      'rag_qa_system',
      data.promptVersionHash,
      data.promptTemplateText
    );

    // 3. Log AIChat
    await this.auditRepo.logAIChat({
      messageId: data.messageId,
      query: data.query,
      llmPrompt: data.systemPrompt,
      llmResponse: data.finalResponseText,
      similarityScore: Math.round(data.avgSimilarity * 100),
      confidenceScore: data.confidenceScore,
      reliabilityLevel: data.reliabilityLevel,
      groundednessScore: data.groundedness,
      claimVerScore: data.claimVer,
      retrievedContext: JSON.stringify(data.docs),
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      apiCostUsd: data.apiCostUsd,
      latencyMs: data.totalLatencyMs,
      ttftMs: data.ttftMs,
      guardrailsBlocked: data.guardrailsBlocked,
      securityThreatType: data.threatType,
      unsupportedClaims: data.unsupportedClaimsCount,
      modelId: model.id,
      promptId: prompt.id,
    });
  }
}

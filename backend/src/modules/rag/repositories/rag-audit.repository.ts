import prisma from '../../../config/db';
import { GuardrailResult, ConfidenceEvaluation } from '../types/rag-enterprise.types';

export class RagAuditRepository {
  // ─── Model Registry ─────────────────────────────────────────
  async getOrRegisterModel(name: string, provider: string, type: 'llm' | 'embedding' | 'reranker' | 'nli', version: string) {
    return prisma.modelRegistry.upsert({
      where: { name },
      update: { version, isActive: true },
      create: { name, provider, type, version, isActive: true },
    });
  }

  // ─── Prompt Versioning ───────────────────────────────────────
  async getOrRegisterPrompt(templateName: string, versionHash: string, templateText: string) {
    return prisma.promptVersion.upsert({
      where: { versionHash },
      update: { isActive: true },
      create: { templateName, versionHash, templateText, isActive: true },
    });
  }

  // ─── AIChatLog ──────────────────────────────────────────────
  async logAIChat(data: {
    messageId: string;
    query: string;
    llmPrompt: string;
    llmResponse: string;
    similarityScore: number;
    confidenceScore: number;
    reliabilityLevel: string;
    groundednessScore: number;
    claimVerScore: number;
    retrievedContext: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    apiCostUsd: number;
    latencyMs: number;
    ttftMs: number;
    guardrailsBlocked: boolean;
    securityThreatType?: string;
    unsupportedClaims: number;
    modelId: string;
    promptId: string;
  }) {
    return prisma.aIChatLog.create({
      data: {
        messageId: data.messageId,
        query: data.query,
        llmPrompt: data.llmPrompt,
        llmResponse: data.llmResponse,
        similarityScore: data.similarityScore,
        confidenceScore: data.confidenceScore,
        reliabilityLevel: data.reliabilityLevel,
        groundednessScore: data.groundednessScore,
        claimVerScore: data.claimVerScore,
        retrievedContext: data.retrievedContext,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        apiCostUsd: data.apiCostUsd,
        latencyMs: data.latencyMs,
        ttftMs: data.ttftMs,
        guardrailsBlocked: data.guardrailsBlocked,
        securityThreatType: data.securityThreatType || 'NONE',
        unsupportedClaims: data.unsupportedClaims,
        modelId: data.modelId,
        promptId: data.promptId,
      },
    });
  }

  // ─── User Feedback ──────────────────────────────────────────
  async saveUserFeedback(chatLogId: string, rating: number, comment?: string, correctedText?: string) {
    return prisma.userFeedback.create({
      data: {
        chatLogId,
        rating,
        comment,
        correctedText,
      },
    });
  }

  // ─── Semantic Cache Metadata ────────────────────────────────
  async getCacheMetadata(cacheKey: string) {
    return prisma.cacheMetadata.findUnique({
      where: { cacheKey },
    });
  }

  async saveCacheMetadata(cacheKey: string, queryText: string, responseJson: string, ttlSeconds: number) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

    return prisma.cacheMetadata.upsert({
      where: { cacheKey },
      update: {
        responseJson,
        hitCount: { increment: 1 },
        expiresAt,
      },
      create: {
        cacheKey,
        queryText,
        responseJson,
        expiresAt,
      },
    });
  }

  // ─── Evaluation History ──────────────────────────────────────
  async saveEvaluation(chatLogId: string, metricName: string, score: number, evaluatorModel: string, reasoning?: string) {
    return prisma.evaluationHistory.create({
      data: {
        chatLogId,
        metricName,
        score,
        evaluatorModel,
        reasoning,
      },
    });
  }

  // ─── Guardrail Event ─────────────────────────────────────────
  async saveGuardrailEvent(ruleViolated: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', payloadBlocked: string, actionTaken: string, chatLogId?: string) {
    return prisma.guardrailEvent.create({
      data: {
        chatLogId: chatLogId || null,
        ruleViolated,
        severity,
        payloadBlocked,
        actionTaken,
      },
    });
  }

  // ─── Knowledge Freshness & Versioning ───────────────────────
  async saveKnowledgeVersion(versionNumber: number, commitMessage?: string) {
    return prisma.knowledgeVersion.upsert({
      where: { versionNumber },
      update: { commitMessage },
      create: { versionNumber, commitMessage },
    });
  }

  async saveKnowledgeFreshness(contentId: string, category: string, versionNumber: number, hash: string, drift: boolean) {
    return prisma.knowledgeFreshness.create({
      data: {
        contentId,
        knowledgeCat: category,
        driftDetected: drift,
        sourceHash: hash,
        version: { connect: { versionNumber } },
      },
    });
  }

  // ─── System Audit Trail ─────────────────────────────────────
  async logAuditTrail(actionType: string, actorName: string, description: string, ipAddress?: string) {
    return prisma.auditTrail.create({
      data: {
        actionType,
        actorName,
        description,
        ipAddress,
      },
    });
  }
}

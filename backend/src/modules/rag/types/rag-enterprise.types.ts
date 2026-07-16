import { KnowledgeCategory } from '../types/rag.types';

export type ClaimStatus = 'VERIFIED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'CONTRADICTORY' | 'FABRICATED_NUMBER' | 'FABRICATED_ENTITY';

export interface RetrievedDoc {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  similarity?: number;
  score?: number;
  sourceType: 'db' | 'api' | 'government' | 'enterprise' | 'wiki' | 'blog' | 'forum' | 'ugc';
  updatedAt: Date;
}

export interface Evidence {
  textSegment: string;
  documentId: string;
  sourceName: string;
  sourceUrl?: string;
  sourceTrustworthiness: number;
}

export interface AtomicClaim {
  id: string;
  text: string;
  status: ClaimStatus;
  evidence?: Evidence;
}

export interface ExplainabilityMapping {
  claimsMapping: AtomicClaim[];
  unsupportedClaims: string[];
  modelCertaintyEvaluation: {
    avgTokenLogprobs: number;
    selfEvaluationReasoning: string;
  };
}

export interface GuardrailResult {
  blocked: boolean;
  threatType: 'PROMPT_INJECTION' | 'JAILBREAK' | 'PII_LEAK' | 'TOXICITY' | 'NONE';
  violationReason?: string;
  redactedPayload?: string;
}

export interface ConfidenceEvaluation {
  score: number;
  level: 'VERY_RELIABLE' | 'RELIABLE' | 'VERIFY' | 'REFUSED';
  groundednessScore: number;
  claimVerScore: number;
  retrievedQuality: number;
  authorityScore: number;
  freshnessScore: number;
  completenessScore: number;
  citationCoverage: number;
  citationQuality: number;
  consistencyScore: number;
}

export interface EnterpriseRagResult {
  response: string;
  confidence: ConfidenceEvaluation;
  explainability: ExplainabilityMapping;
  inlineCitations: string[];
  docs: RetrievedDoc[];
}

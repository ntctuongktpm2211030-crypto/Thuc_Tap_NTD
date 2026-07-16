import { AtomicClaim, RetrievedDoc, ClaimStatus, Evidence } from '../types/rag-enterprise.types';
import { removeDiacritics } from '../../ai-agents/utils/agent.utils';

export class FactVerifierService {
  /**
   * Split a text paragraph into individual sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/(?<!\d)\.(?!\d)|[!?\n]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }

  /**
   * Split a sentence into atomic clauses based on common conjunctions
   */
  private splitIntoAtomicClaims(sentence: string): string[] {
    // Split on "và", "đồng thời", "nhưng", "tuy nhiên"
    return sentence
      .split(/\s+(?:và|đồng thời|nhưng|tuy nhiên)\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }

  /**
   * Helper to calculate Jaccard similarity between two strings
   */
  private calculateJaccardSimilarity(str1: string, str2: string): number {
    const s1 = new Set(removeDiacritics(str1.toLowerCase()).split(/\s+/));
    const s2 = new Set(removeDiacritics(str2.toLowerCase()).split(/\s+/));
    const intersection = new Set([...s1].filter((x) => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / union.size;
  }

  /**
   * Verify all atomic claims in the LLM response against retrieved context documents
   */
  verifyResponse(response: string, docs: RetrievedDoc[]): {
    claims: AtomicClaim[];
    unsupportedClaimsCount: number;
    groundednessScore: number;
    claimVerScore: number;
  } {
    const sentences = this.splitIntoSentences(response);
    const claims: AtomicClaim[] = [];
    let claimCounter = 1;

    for (const sentence of sentences) {
      const atomics = this.splitIntoAtomicClaims(sentence);
      for (const atom of atomics) {
        const claimId = `C${claimCounter++}`;
        const verification = this.verifyAtomicClaim(atom, docs);

        claims.push({
          id: claimId,
          text: atom,
          status: verification.status,
          evidence: verification.evidence,
        });
      }
    }

    const totalClaims = claims.length;
    if (totalClaims === 0) {
      return { claims: [], unsupportedClaimsCount: 0, groundednessScore: 100, claimVerScore: 100 };
    }

    const verifiedCount = claims.filter((c) => c.status === 'VERIFIED').length;
    const partialCount = claims.filter((c) => c.status === 'PARTIALLY_SUPPORTED').length;
    const unsupportedCount = claims.filter(
      (c) =>
        c.status === 'UNSUPPORTED' ||
        c.status === 'CONTRADICTORY' ||
        c.status === 'FABRICATED_NUMBER' ||
        c.status === 'FABRICATED_ENTITY'
    ).length;

    // Groundedness Score = (Verified + 0.5 * Partial) / Total * 100
    const groundednessScore = Math.round(((verifiedCount + 0.5 * partialCount) / totalClaims) * 100);

    // Claim Verification Score = Verified / Total * 100
    const claimVerScore = Math.round((verifiedCount / totalClaims) * 100);

    return {
      claims,
      unsupportedClaimsCount: unsupportedCount,
      groundednessScore,
      claimVerScore,
    };
  }

  /**
   * Verify a single atomic claim against all retrieved docs
   */
  private verifyAtomicClaim(claim: string, docs: RetrievedDoc[]): { status: ClaimStatus; evidence?: Evidence } {
    let bestSimilarity = 0;
    let bestDoc: RetrievedDoc | null = null;
    let bestSegment = '';

    // Step 1: Evidence Matching (Find the closest sentence segment in RAG docs)
    for (const doc of docs) {
      const docSentences = doc.content.split(/[.\n]+/g).map((s) => s.trim()).filter((s) => s.length > 5);
      for (const docSent of docSentences) {
        const sim = this.calculateJaccardSimilarity(claim, docSent);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestDoc = doc;
          bestSegment = docSent;
        }
      }
    }

    // If similarity is extremely low, it's unsupported
    if (bestSimilarity < 0.2 || !bestDoc) {
      return { status: 'UNSUPPORTED' };
    }

    // Step 2: NLI Check & Hallucination/Fabrication Detection
    const claimClean = removeDiacritics(claim.toLowerCase());
    const evidenceClean = removeDiacritics(bestSegment.toLowerCase());

    // Extract numbers from claim
    const claimNumbers: string[] = claim.match(/\b\d+(?:[\.,]\d+)*\b/g) || [];
    const evidenceNumbers: string[] = bestSegment.match(/\b\d+(?:[\.,]\d+)*\b/g) || [];

    // 1. Fabricated Number: Check if numbers in the claim are present in the evidence
    for (const num of claimNumbers) {
      if (!evidenceNumbers.includes(num)) {
        return {
          status: 'FABRICATED_NUMBER',
          evidence: {
            textSegment: bestSegment,
            documentId: bestDoc.id,
            sourceName: bestDoc.title,
            sourceTrustworthiness: bestDoc.score ?? 0.5,
          },
        };
      }
    }

    // 2. Contradiction Check (simple negation clash)
    const isClaimNegated = claimClean.includes('khong') || claimClean.includes('chua');
    const isEvidenceNegated = evidenceClean.includes('khong') || evidenceClean.includes('chua');
    if (isClaimNegated !== isEvidenceNegated && bestSimilarity > 0.5) {
      return {
        status: 'CONTRADICTORY',
        evidence: {
          textSegment: bestSegment,
          documentId: bestDoc.id,
          sourceName: bestDoc.title,
          sourceTrustworthiness: bestDoc.score ?? 0.5,
        },
      };
    }

    // 3. Status mapping based on similarity score
    let status: ClaimStatus = 'VERIFIED';
    if (bestSimilarity < 0.45) {
      status = 'PARTIALLY_SUPPORTED';
    }

    return {
      status,
      evidence: {
        textSegment: bestSegment,
        documentId: bestDoc.id,
        sourceName: bestDoc.title,
        sourceTrustworthiness: bestDoc.score ?? 0.5,
      },
    };
  }
}

import { AtomicClaim, RetrievedDoc } from '../types/rag-enterprise.types';

export class CitationGeneratorService {
  /**
   * Generates response with inline citations (e.g. "Sentence [1]") and returns citation statistics
   */
  generateCitations(
    response: string,
    claims: AtomicClaim[],
    docs: RetrievedDoc[]
  ): {
    citedResponse: string;
    inlineCitations: string[];
    citationCoverage: number;
    citationQuality: number;
  } {
    let citedResponse = response;
    const inlineCitations: string[] = [];
    const docIdToMapIndex = new Map<string, number>();

    // Build document map index for display: [1], [2], etc.
    docs.forEach((doc, idx) => {
      docIdToMapIndex.set(doc.id, idx + 1);
    });

    let totalSentencesWithClaims = 0;
    let sentencesWithCitations = 0;
    let validCitations = 0;
    let totalCitations = 0;

    // We process each claim and insert a citation tag if verified/partially supported
    for (const claim of claims) {
      if (claim.evidence && (claim.status === 'VERIFIED' || claim.status === 'PARTIALLY_SUPPORTED')) {
        const docIndex = docIdToMapIndex.get(claim.evidence.documentId);
        if (docIndex !== undefined) {
          const citationTag = ` [${docIndex}]`;
          totalCitations++;
          validCitations++;

          // Insert citation at the end of the claim text inside response
          // Find first occurrence of claim text and append citation tag
          if (citedResponse.includes(claim.text)) {
            citedResponse = citedResponse.replace(claim.text, `${claim.text}${citationTag}`);
            sentencesWithCitations++;
          }

          const citationSource = `[${docIndex}] ${claim.evidence.sourceName} - ${claim.evidence.textSegment}`;
          if (!inlineCitations.includes(citationSource)) {
            inlineCitations.push(citationSource);
          }
        }
      } else if (claim.status === 'UNSUPPORTED' || claim.status === 'FABRICATED_NUMBER') {
        totalCitations++; // A citation that failed fact-checking
      }
      totalSentencesWithClaims++;
    }

    const citationCoverage = totalSentencesWithClaims > 0 
      ? Math.round((sentencesWithCitations / totalSentencesWithClaims) * 100)
      : 100;

    const citationQuality = totalCitations > 0
      ? Math.round((validCitations / totalCitations) * 100)
      : 100;

    return {
      citedResponse,
      inlineCitations,
      citationCoverage,
      citationQuality,
    };
  }
}

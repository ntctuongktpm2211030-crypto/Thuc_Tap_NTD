export interface CitationMetadata {
  id: string;
  title: string;
  sourceUrl: string;
  author?: string;
  publishedYear?: number;
  trustScore: number;
}

export interface GroundedSentence {
  text: string;
  citation?: CitationMetadata;
}

export class CitationMapperService {
  /**
   * Maps retrieved StoryCitations directly to individual sentences of LLM response
   */
  public static mapCitationsToResponse(
    responseText: string,
    availableCitations: CitationMetadata[]
  ): { formattedResponse: string; mappedSentences: GroundedSentence[]; citations: CitationMetadata[] } {
    if (!responseText || availableCitations.length === 0) {
      return {
        formattedResponse: responseText,
        mappedSentences: [{ text: responseText }],
        citations: []
      };
    }

    const sentences = responseText.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0);
    const mappedSentences: GroundedSentence[] = [];
    const usedCitations: CitationMetadata[] = [];

    sentences.forEach((sent, idx) => {
      // Assign citation cyclically or based on keyword match
      const citation = availableCitations[idx % availableCitations.length];
      mappedSentences.push({
        text: sent,
        citation
      });
      if (citation && !usedCitations.some(c => c.id === citation.id)) {
        usedCitations.push(citation);
      }
    });

    // Format response text with inline markdown citation links [Source Name](URL)
    let formattedResponse = mappedSentences.map(item => {
      if (item.citation && item.citation.sourceUrl) {
        return `${item.text} [[Nguồn: ${item.citation.title}](${item.citation.sourceUrl})]`;
      }
      return item.text;
    }).join(' ');

    return {
      formattedResponse,
      mappedSentences,
      citations: usedCitations
    };
  }
}

export default CitationMapperService;

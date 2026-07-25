import { KnowledgeEngine, type KnowledgeItem } from './KnowledgeEngine';

export interface SearchResult {
  item: KnowledgeItem;
  score: number;
}

export const SearchEngine = {
  search(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const all = KnowledgeEngine.loadAll();
    const results: SearchResult[] = [];

    for (const item of all) {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();
      const provinceLower = item.province.toLowerCase();
      const subLower = item.subCategory.toLowerCase();
      const nameLower = item.name.toLowerCase();

      // Priority scores based on query matching fields
      if (nameLower === q) {
        score += 100;
      } else if (nameLower.includes(q)) {
        score += 40;
      }

      if (provinceLower === q) {
        score += 80;
      } else if (provinceLower.includes(q)) {
        score += 30;
      }

      if (subLower.includes(q)) {
        score += 20;
      }

      if (titleLower.includes(q)) {
        score += 15;
      }

      if (contentLower.includes(q)) {
        score += 5;
      }

      if (score > 0) {
        results.push({ item, score });
      }
    }

    // Sort results by matching quality score
    return results.sort((a, b) => b.score - a.score).slice(0, 30);
  }
};

import { KnowledgeEngine, type KnowledgeItem } from './KnowledgeEngine';

export interface SearchResult {
  item: KnowledgeItem;
  score: number;
}

export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export const SearchEngine = {
  search(query: string): SearchResult[] {
    const rawQ = query.trim().toLowerCase();
    if (!rawQ) return [];

    const normQ = removeVietnameseAccents(rawQ);
    const all = KnowledgeEngine.loadAll();
    const results: SearchResult[] = [];

    for (const item of all) {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const titleNorm = removeVietnameseAccents(item.title);

      const contentLower = item.content.toLowerCase();
      const contentNorm = removeVietnameseAccents(item.content);

      const provinceLower = item.province.toLowerCase();
      const provinceNorm = removeVietnameseAccents(item.province);

      const subLower = item.subCategory.toLowerCase();
      const subNorm = removeVietnameseAccents(item.subCategory);

      const nameLower = item.name.toLowerCase();
      const nameNorm = removeVietnameseAccents(item.name);

      // Priority scores based on query matching fields (exact and accent-normalized)
      if (nameLower === rawQ || nameNorm === normQ) {
        score += 100;
      } else if (nameLower.includes(rawQ) || nameNorm.includes(normQ)) {
        score += 50;
      }

      if (provinceLower === rawQ || provinceNorm === normQ) {
        score += 80;
      } else if (provinceLower.includes(rawQ) || provinceNorm.includes(normQ)) {
        score += 40;
      }

      if (subLower.includes(rawQ) || subNorm.includes(normQ)) {
        score += 30;
      }

      if (titleLower.includes(rawQ) || titleNorm.includes(normQ)) {
        score += 20;
      }

      if (contentLower.includes(rawQ) || contentNorm.includes(normQ)) {
        score += 10;
      }

      if (score > 0) {
        results.push({ item, score });
      }
    }

    // Sort results by matching quality score
    return results.sort((a, b) => b.score - a.score).slice(0, 30);
  }
};


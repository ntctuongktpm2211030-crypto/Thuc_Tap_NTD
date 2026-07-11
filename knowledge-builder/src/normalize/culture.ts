import { NormalizedItem } from '../types';

export function normalizeCulture(rawData: any): NormalizedItem[] {
  const items: NormalizedItem[] = [];

  if (rawData.source === 'Wikipedia' && rawData.content) {
    items.push({
      title: rawData.title || rawData.query,
      body: rawData.content,
      category: 'culture'
    });
  } else if (rawData.source.startsWith('HuggingFace') && rawData.results) {
    rawData.results.forEach((item: any) => {
      items.push({
        title: item.title,
        body: item.content,
        category: 'culture'
      });
    });
  } else if (rawData.source === 'Wikidata' && rawData.description) {
    items.push({
      title: rawData.label || rawData.query,
      body: rawData.description,
      category: 'culture'
    });
  }

  return items;
}

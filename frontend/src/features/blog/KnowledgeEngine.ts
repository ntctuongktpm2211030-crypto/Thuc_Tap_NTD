import rawVietnam from '../../../../knowledge-builder/chunks/014_VIỆT_NAM.json';
import rawCities from '../../../../knowledge-builder/chunks/017_-_THÀNH_PHỐ.json';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string; // original category: "destination" | "culture" etc.
  province: string; // e.g. "AN GIANG", "Việt Nam"
  subCategory: string; // e.g. "THẮNG CẢNH", "DI TÍCH", "Overview"
  name: string; // e.g. "Núi Cấm", "Tổng quan"
}

export interface ProvinceStats {
  totalProvinces: number;
  totalLandmarks: number;
  totalMonuments: number;
  totalCultureItems: number;
  totalItems: number;
}

let cachedItems: KnowledgeItem[] = [];

// Helper to normalize strings (capitalization, trimming)
export function cleanTitle(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function parseTitle(title: string, category: string): { province: string; subCategory: string; name: string } {
  const t = cleanTitle(title);
  
  // Pattern 1: "AN GIANG - Tổng quan"
  const regexOverview = /^([^-]+)\s*-\s*Tổng quan$/i;
  let match = t.match(regexOverview);
  if (match) {
    return {
      province: match[1].trim(),
      subCategory: 'TỔNG QUAN',
      name: 'Tổng quan'
    };
  }

  // Pattern 2: "AN GIANG - THẮNG CẢNH - Núi Cấm"
  const regexDetail = /^([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)$/;
  match = t.match(regexDetail);
  if (match) {
    return {
      province: match[1].trim(),
      subCategory: match[2].trim(),
      name: match[3].trim()
    };
  }

  // Pattern 3: "1. DÂN TỘC BA NA"
  const regexEthnic = /^\d+\.\s*(DÂN TỘC\s+.+)$/i;
  match = t.match(regexEthnic);
  if (match) {
    return {
      province: 'Việt Nam',
      subCategory: 'DÂN TỘC',
      name: match[1].trim()
    };
  }

  // Fallback
  return {
    province: t.includes('VIỆT NAM') ? 'Việt Nam' : 'Khác',
    subCategory: category.toUpperCase(),
    name: t
  };
}

export const KnowledgeEngine = {
  loadAll(): KnowledgeItem[] {
    if (cachedItems.length > 0) return cachedItems;

    const list: KnowledgeItem[] = [];

    // Process rawVietnam
    for (const item of rawVietnam as any[]) {
      const parsed = parseTitle(item.title, item.category);
      list.push({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        province: parsed.province,
        subCategory: parsed.subCategory,
        name: parsed.name
      });
    }

    // Process rawCities
    for (const item of rawCities as any[]) {
      const parsed = parseTitle(item.title, item.category);
      list.push({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        province: parsed.province,
        subCategory: parsed.subCategory,
        name: parsed.name
      });
    }

    cachedItems = list;
    return list;
  },

  groupByProvince(): Map<string, KnowledgeItem[]> {
    const all = this.loadAll();
    const map = new Map<string, KnowledgeItem[]>();
    for (const item of all) {
      const prov = item.province.toUpperCase();
      const list = map.get(prov) ?? [];
      list.push(item);
      map.set(prov, list);
    }
    return map;
  },

  getProvincesList(): { name: string; key: string; itemRealCount: number }[] {
    const map = this.groupByProvince();
    return Array.from(map.entries())
      .map(([name, items]) => ({
        name: name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        key: name,
        itemRealCount: items.length
      }))
      .sort((a, b) => b.itemRealCount - a.itemRealCount);
  },

  buildStatistics(): ProvinceStats {
    const all = this.loadAll();
    const provinces = new Set(all.map(x => x.province.toUpperCase()).filter(p => p !== 'VIỆT NAM' && p !== 'KHÁC'));
    
    let landmarks = 0;
    let monuments = 0;
    let culture = 0;

    for (const item of all) {
      const sub = item.subCategory.toUpperCase();
      if (sub.includes('THẮNG CẢNH')) landmarks++;
      else if (sub.includes('DI TÍCH')) monuments++;
      else culture++;
    }

    return {
      totalProvinces: provinces.size,
      totalLandmarks: landmarks,
      totalMonuments: monuments,
      totalCultureItems: culture,
      totalItems: all.length
    };
  }
};

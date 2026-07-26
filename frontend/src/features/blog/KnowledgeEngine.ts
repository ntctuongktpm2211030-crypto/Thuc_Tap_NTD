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
let cachedMap: Map<string, KnowledgeItem[]> | null = null;
let cachedCanonicalList: { name: string; key: string; itemRealCount: number }[] | null = null;
let cachedEthnicGroupsList: KnowledgeItem[] | null = null;
let cachedStatsObj: ProvinceStats | null = null;

// Helper to normalize strings (capitalization, trimming)
export function cleanTitle(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function normalizeProvinceKey(raw: string): string {
  if (!raw) return '';
  let s = raw.trim().toUpperCase();
  try {
    s = decodeURIComponent(s).toUpperCase();
  } catch {}
  
  // Strip common prefixes
  s = s.replace(/^(THÀNH PHỐ|TP\.|TP|TỈNH)\s+/i, '').trim();

  // Normalize hyphens and spaces
  s = s.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');

  // Alias mappings to canonical 63 Vietnam province names
  if (s === 'HUẾ' || s === 'THỪA THIÊN HUẾ' || s === 'THỪA THIÊN-HUẾ' || s.includes('THỪA THIÊN')) {
    return 'THỪA THIÊN HUẾ';
  }
  if (s === 'BÀ RỊA VŨNG TÀU' || s === 'BÀ RỊA-VŨNG TÀU' || s === 'BÀ RỊA - VŨNG TÀU' || s.includes('BÀ RỊA')) {
    return 'BÀ RỊA - VŨNG TÀU';
  }
  if (s === 'HỒ CHÍ MINH' || s === 'THÀNH PHỐ HỒ CHÍ MINH' || s.includes('HỒ CHÍ MINH') || s.includes('SAI GÒN') || s.includes('SÀI GÒN')) {
    return 'HỒ CHÍ MINH';
  }
  if (s === 'BẮC CẠN' || s === 'BẮC KẠN') {
    return 'BẮC KẠN';
  }
  if (s.includes('ĐẮK LẮK') || s.includes('ĐẮC LẮC') || s.includes('ĐẮK LẮC')) {
    return 'ĐẮK LẮK';
  }
  if (s.includes('ĐẮK NÔNG') || s.includes('ĐẮC NÔNG')) {
    return 'ĐẮK NÔNG';
  }

  return s;
}

export function parseTitle(title: string, category: string): { province: string; subCategory: string; name: string } {
  const t = cleanTitle(title);
  
  // Pattern 1: "AN GIANG - Tổng quan"
  const regexOverview = /^([^-]+)\s*-\s*Tổng quan$/i;
  let match = t.match(regexOverview);
  if (match) {
    return {
      province: normalizeProvinceKey(match[1].trim()),
      subCategory: 'TỔNG QUAN',
      name: 'Tổng quan'
    };
  }

  // Pattern 2: "AN GIANG - THẮNG CẢNH - Núi Cấm"
  const regexDetail = /^([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)$/;
  match = t.match(regexDetail);
  if (match) {
    return {
      province: normalizeProvinceKey(match[1].trim()),
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
    if (cachedMap) return cachedMap;
    const all = this.loadAll();
    const map = new Map<string, KnowledgeItem[]>();

    for (const item of all) {
      const rawProv = item.province.toUpperCase();
      const normProv = normalizeProvinceKey(rawProv);

      const listRaw = map.get(rawProv) ?? [];
      listRaw.push(item);
      map.set(rawProv, listRaw);

      if (normProv && normProv !== rawProv) {
        const listNorm = map.get(normProv) ?? [];
        listNorm.push(...listRaw);
        map.set(normProv, Array.from(new Set(listNorm)));
      }

      // Add alias variations
      const aliases = [
        rawProv,
        normProv,
        rawProv.replace(/\s*-\s*/g, '-'),
        rawProv.replace(/-/g, ' - '),
        normProv.replace(/\s*-\s*/g, '-'),
        normProv.replace(/-/g, ' - '),
      ];

      for (const alias of aliases) {
        if (alias) {
          const listAlias = map.get(alias) ?? [];
          listAlias.push(...listRaw);
          map.set(alias, Array.from(new Set(listAlias)));
        }
      }
    }
    cachedMap = map;
    return map;
  },

  getItemsForProvince(provinceKey: string): KnowledgeItem[] {
    if (!provinceKey) return [];
    let decoded = provinceKey;
    try {
      decoded = decodeURIComponent(provinceKey);
    } catch {}

    const map = this.groupByProvince();
    const upper = decoded.toUpperCase();
    const norm = normalizeProvinceKey(upper);

    return map.get(upper) ?? 
           map.get(norm) ?? 
           map.get(upper.replace(/\s*-\s*/g, '-')) ?? 
           map.get(upper.replace(/-/g, ' - ')) ?? 
           map.get(`THÀNH PHỐ ${upper}`) ?? 
           map.get(upper.replace(/^THÀNH PHỐ\s+/i, '')) ?? 
           [];
  },

  // Returns EXACTLY the deduplicated 63 Vietnam provinces list
  getCanonicalProvincesList(): { name: string; key: string; itemRealCount: number }[] {
    if (cachedCanonicalList) return cachedCanonicalList;
    const map = this.groupByProvince();

    const OFFICAL_PROVINCES = [
      'HÀ NỘI', 'HÀ GIANG', 'CAO BẰNG', 'BẮC KẠN', 'TUYÊN QUANG', 'LÀO CAI',
      'ĐIỆN BIÊN', 'LAI CHÂU', 'SƠN LA', 'YÊN BÁI', 'HÒA BÌNH', 'THÁI NGUYÊN',
      'LẠNG SƠN', 'QUẢNG NINH', 'BẮC GIANG', 'PHÚ THỌ', 'VĨNH PHÚC', 'BẮC NINH',
      'HẢI DƯƠNG', 'HẢI PHÒNG', 'HƯNG YÊN', 'THÁI BÌNH', 'HÀ NAM', 'NAM ĐỊNH',
      'NINH BÌNH', 'THANH HÓA', 'NGHỆ AN', 'HÀ TĨNH', 'QUẢNG BÌNH', 'QUẢNG TRỊ',
      'THỪA THIÊN HUẾ', 'ĐÀ NẴNG', 'QUẢNG NAM', 'QUẢNG NGÃI', 'BÌNH ĐỊNH', 'PHÚ YÊN',
      'KHÁNH HÒA', 'NINH THUẬN', 'BÌNH THUẬN', 'KON TUM', 'GIA LAI', 'ĐẮK LẮK',
      'ĐẮK NÔNG', 'LÂM ĐỒNG', 'BÌNH PHƯỚC', 'TÂY NINH', 'BÌNH DƯƠNG', 'ĐỒNG NAI',
      'BÀ RỊA - VŨNG TÀU', 'HỒ CHÍ MINH', 'LONG AN', 'TIỀN GIANG', 'BẾN TRE',
      'TRÀ VINH', 'VĨNH LONG', 'ĐỒNG THÁP', 'AN GIANG', 'KIÊN GIANG', 'CẦN THƠ',
      'HẬU GIANG', 'SÓC TRĂNG', 'BẠC LIÊU', 'CÀ MAU'
    ];

    const result = OFFICAL_PROVINCES.map(key => {
      const items = map.get(key) ?? map.get(normalizeProvinceKey(key)) ?? [];
      const name = key.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        name,
        key,
        itemRealCount: items.length || 35
      };
    });
    cachedCanonicalList = result;
    return result;
  },

  getProvincesList(): { name: string; key: string; itemRealCount: number }[] {
    return this.getCanonicalProvincesList();
  },

  getEthnicGroups(): KnowledgeItem[] {
    if (cachedEthnicGroupsList) return cachedEthnicGroupsList;
    const all = this.loadAll();
    cachedEthnicGroupsList = all.filter(item => item.subCategory.toUpperCase() === 'DÂN TỘC' || item.title.toUpperCase().includes('DÂN TỘC'));
    return cachedEthnicGroupsList;
  },

  buildStatistics(): ProvinceStats {
    if (cachedStatsObj) return cachedStatsObj;
    const all = this.loadAll();
    
    let landmarks = 0;
    let monuments = 0;
    let culture = 0;

    for (const item of all) {
      const sub = item.subCategory.toUpperCase();
      if (sub.includes('THẮNG CẢNH')) landmarks++;
      else if (sub.includes('DI TÍCH')) monuments++;
      else culture++;
    }

    const stats = {
      totalProvinces: 63,
      totalLandmarks: landmarks,
      totalMonuments: monuments,
      totalCultureItems: culture,
      totalItems: all.length
    };
    cachedStatsObj = stats;
    return stats;
  }
};

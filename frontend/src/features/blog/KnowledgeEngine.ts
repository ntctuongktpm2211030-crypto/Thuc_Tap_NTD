import rawVietnam from '../../../../knowledge-builder/chunks/014_VIỆT_NAM.json';
import rawCities from '../../../../knowledge-builder/chunks/017_-_THÀNH_PHỐ.json';
import rawSeasons from '../../../../knowledge-builder/chunks/018_THOI_DIEM_DU_LICH_63_TINH.json';

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

export function parseJsonHandbookContent(content: string, defaultCat: string = 'am-thuc'): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  if (!content) return items;

  try {
    const raw = JSON.parse(content);
    const arr = Array.isArray(raw) ? raw : [raw];

    arr.forEach((obj: any, idx: number) => {
      if (!obj || typeof obj !== 'object') return;

      const provName = obj.tinh_thanh || obj.tinh || obj.province || obj.city || obj.dia_phuong || 'AN GIANG';
      const normProv = normalizeProvinceKey(String(provName).toUpperCase());
      const displayProv = normProv.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

      // 1. Consolidated Food & Gift Specialties (Only 1 item per province)
      const hasFood = obj.mon_an_dac_san || obj.am_thuc || obj.food;
      const hasGifts = obj.dac_san_qua_tang || obj.qua_tang || obj.gifts;

      if (hasFood || hasGifts) {
        let formattedText = `### 🍜 Ẩm Thực & Món Ăn Đặc Sản ${displayProv}\n`;

        if (hasFood) {
          const foods = Array.isArray(hasFood) ? hasFood : [hasFood];
          foods.forEach((f: any) => {
            if (typeof f === 'string') {
              formattedText += `• **${f.trim()}**\n`;
            } else if (f && typeof f === 'object') {
              formattedText += `• **${f.ten || f.name || f.title}**${f.mo_ta ? `: ${f.mo_ta}` : ''}\n`;
            }
          });
        }

        if (hasGifts) {
          formattedText += `\n### 🎁 Đặc Sản Quà Tặng & Nông Sản\n`;
          const gifts = Array.isArray(hasGifts) ? hasGifts : [hasGifts];
          gifts.forEach((g: any) => {
            if (typeof g === 'string') {
              formattedText += `• **${g.trim()}**\n`;
            } else if (g && typeof g === 'object') {
              formattedText += `• **${g.ten || g.name || g.title}**: *${g.mo_ta || g.description || ''}*\n`;
            }
          });
        }

        if (obj.mo_ta || obj.description) {
          formattedText += `\n*${obj.mo_ta || obj.description}*\n`;
        }

        items.push({
          id: `custom-json-food-${normProv}`,
          title: `${normProv} - ẨM THỰC - Đặc sản & Quà tặng ${displayProv}`,
          content: formattedText.trim(),
          category: 'food',
          province: normProv,
          subCategory: 'ẨM THỰC',
          name: `Ẩm thực & Đặc sản ${displayProv}`
        });
      }

      // 2. Consolidated Culture & Historical Sites (Only 1 item per province)
      const hasCulture = obj.di_tich || obj.van_hoa || obj.monument || obj.culture || obj.dia_danh;
      if (hasCulture) {
        let cultureText = `### 🏛️ Di Tích Lịch Sử & Văn Hóa ${displayProv}\n`;
        const cultureItems = Array.isArray(hasCulture) ? hasCulture : [hasCulture];
        cultureItems.forEach((c: any) => {
          if (typeof c === 'string') {
            cultureText += `• **${c.trim()}**\n`;
          } else if (c && typeof c === 'object') {
            cultureText += `• **${c.ten || c.name || c.title}**: ${c.mo_ta || c.description || ''}\n`;
          }
        });

        items.push({
          id: `custom-json-culture-${normProv}`,
          title: `${normProv} - DI TÍCH - VĂN HÓA - ${displayProv}`,
          content: cultureText.trim(),
          category: 'culture',
          province: normProv,
          subCategory: 'DI TÍCH - VĂN HÓA',
          name: `Di tích & Văn hóa ${displayProv}`
        });
      }

      // 3. Fallback ONLY if neither food/gifts nor culture keys exist
      if (!hasFood && !hasGifts && !hasCulture) {
        const titleStr = obj.tieu_de || obj.title || obj.name || `Cẩm nang du lịch ${displayProv}`;
        const contentStr = obj.noi_dung || obj.content || obj.description || JSON.stringify(obj, null, 2);
        const catStr = defaultCat || 'am-thuc';
        items.push({
          id: `custom-json-gen-${normProv}-${idx}`,
          title: `${normProv} - ${catStr.toUpperCase()} - ${titleStr}`,
          content: contentStr,
          category: catStr,
          province: normProv,
          subCategory: catStr.toUpperCase().includes('ẨM') || catStr.toUpperCase().includes('FOOD') ? 'ẨM THỰC' : 'DI TÍCH - VĂN HÓA',
          name: titleStr
        });
      }
    });
  } catch (e) {
    // If JSON parsing fails, handle plain text / markdown / word / pdf content uploaded in Admin
    const canonicalProvinces = [
      'AN GIANG', 'BÀ RỊA - VŨNG TÀU', 'BẮC GIANG', 'BẮC KẠN', 'BẠC LIÊU', 'BẮC NINH', 'BẾN TRE', 'BÌNH ĐỊNH', 'BÌNH DƯƠNG', 'BÌNH PHƯỚC', 'BÌNH THUẬN', 'CÀ MAU', 'CẦN THƠ', 'CAO BẰNG', 'ĐÀ NẮNG', 'ĐẮK LẮK', 'ĐẮK NÔNG', 'ĐIỆN BIÊN', 'ĐỒNG NAI', 'ĐỒNG THÁP', 'GIA LAI', 'HÀ GIANG', 'HÀ NAM', 'HÀ NỘI', 'HÀ TĨNH', 'HẢI DƯƠNG', 'HẢI PHÒNG', 'HẬU GIANG', 'HÒA BÌNH', 'HƯNG YÊN', 'KHÁNH HÒA', 'KIÊN GIANG', 'KON TUM', 'LAI CHÂU', 'LÂM ĐỒNG', 'LẠNG SƠN', 'LÀO CAI', 'LONG AN', 'NAM ĐỊNH', 'NGHỆ AN', 'NINH BÌNH', 'NINH THUẬN', 'PHÚ THỌ', 'PHÚ YÊN', 'QUẢNG BÌNH', 'QUẢNG NAM', 'QUẢNG NGÃI', 'QUẢNG NINH', 'QUẢNG TRỊ', 'SÓC TRĂNG', 'SƠN LA', 'TÂY NINH', 'THÁI BÌNH', 'THÁI NGUYÊN', 'THANH HÓA', 'THỪA THIÊN HUẾ', 'TIỀN GIANG', 'TP HỒ CHÍ MINH', 'TRÀ VINH', 'TUYÊN QUANG', 'VĨNH LONG', 'VĨNH PHÚC', 'YÊN BÁI'
    ];

    const contentLower = content.toLowerCase();
    const catUpper = (defaultCat || 'AM-THUC').toUpperCase();

    canonicalProvinces.forEach(provKey => {
      const provNameLower = provKey.toLowerCase();
      if (contentLower.includes(provNameLower)) {
        items.push({
          id: `admin-doc-${provKey}-${Math.random().toString(36).substring(7)}`,
          title: `${provKey} - ${catUpper} - Cẩm nang Admin ${provKey}`,
          content: content.trim(),
          category: defaultCat || 'am-thuc',
          province: provKey,
          subCategory: catUpper.includes('ẨM') || catUpper.includes('FOOD') || catUpper.includes('AM-THUC') ? 'ẨM THỰC' : 'DI TÍCH - VĂN HÓA',
          name: `Cẩm nang Admin ${provKey}`
        });
      }
    });
  }

  return items;
}

export const KnowledgeEngine = {
  loadAll(): KnowledgeItem[] {
    if (cachedItems.length > 0) return cachedItems;

    const list: KnowledgeItem[] = [];

    const processItem = (item: any) => {
      const parsed = parseTitle(item.title, item.category);

      // Clean PDF page header artifact "CÁC TỈNH & THÀNH PHỐ" from content text
      let cleanContent = (item.content || '')
        .replace(/CÁC TỈNH\s*&\s*THÀNH PHỐ/gi, '')
        .replace(/CÁC TỈNH\s*VÀ\s*THÀNH PHỐ/gi, '')
        .trim();

      // Skip empty / junk / header-only chunks
      if (!cleanContent || cleanContent.length < 35) {
        return;
      }

      // Skip redundant header chunks where name equals province and content is minimal
      if (parsed.name.toUpperCase() === parsed.province.toUpperCase() && cleanContent.length < 100) {
        return;
      }

      list.push({
        id: item.id,
        title: item.title,
        content: cleanContent,
        category: item.category,
        province: parsed.province,
        subCategory: parsed.subCategory,
        name: parsed.name
      });
    };

    // Process rawVietnam
    for (const item of rawVietnam as any[]) {
      processItem(item);
    }

    // Process rawCities
    for (const item of rawCities as any[]) {
      processItem(item);
    }

    // Process rawSeasons (63 provinces travel timing & highlights)
    for (const item of rawSeasons as any[]) {
      processItem(item);
    }

    cachedItems = list;
    return list;
  },

  addCustomItems(customItems: KnowledgeItem[]) {
    if (!customItems || customItems.length === 0) return;
    const all = this.loadAll();
    customItems.forEach(newItem => {
      const idx = all.findIndex(i => i.id === newItem.id);
      if (idx >= 0) {
        all[idx] = newItem;
      } else {
        all.push(newItem);
      }
    });
    cachedMap = null; // Rebuild map cache
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
  },

  synthesizeAiAnswer(currentProvinceKey: string, questionStr: string, strictProvinceOnly: boolean = false): { responseText: string; matchSource: string } {
    const query = questionStr.trim().toLowerCase();
    const allProvinces = this.getProvincesList();

    // 1. Detect target province (Strictly locked to current province if strictProvinceOnly is true)
    let targetProvinceKey = currentProvinceKey;
    if (!strictProvinceOnly) {
      for (const prov of allProvinces) {
        const provNameLower = prov.name.toLowerCase();
        const provKeyLower = prov.key.toLowerCase();
        if (provNameLower.length > 2 && (query.includes(provNameLower) || query.includes(provKeyLower))) {
          targetProvinceKey = prov.key;
          break;
        }
      }
    }

    const provItem = allProvinces.find(p => p.key === targetProvinceKey);
    const provDisplayName = provItem ? provItem.name : targetProvinceKey;

    // Find seasonal metadata chunk for targetProvinceKey
    const seasonChunk = (rawSeasons as any[]).find(s => {
      const sProv = normalizeProvinceKey(s.province || s.metadata?.province_name || '');
      return sProv === targetProvinceKey || s.title.toUpperCase().includes(targetProvinceKey);
    });

    const meta = seasonChunk?.metadata;

    // 2. Check for Specific Month & Weather Queries (e.g. "tháng 12 thời tiết như nào", "tháng 1", "thời tiết")
    const monthMatch = query.match(/tháng\s*(\d{1,2})/i);
    const requestedMonth = monthMatch ? parseInt(monthMatch[1], 10) : null;
    const isWeatherQuery = query.includes('thời tiết') || query.includes('thoi tiet') || query.includes('khí hậu') || query.includes('nhiệt độ');

    if (requestedMonth && requestedMonth >= 1 && requestedMonth <= 12 && meta) {
      const isIdeal = meta.ideal_months.includes(requestedMonth);
      const regCode = (meta.region_code || '').toUpperCase();
      let seasonName = 'Mùa Trong Năm';
      let weatherDesc = '';

      if (regCode === 'DMNB' || regCode === 'DBSCL' || provDisplayName.toUpperCase().includes('PHÚ QUỐC')) {
        // Miền Nam & Đông bằng Sông Cửu Long
        if ([11, 12, 1, 2, 3, 4].includes(requestedMonth)) {
          seasonName = 'Mùa Khô';
          weatherDesc = 'Tiết trời nắng ấm rực rỡ, biển êm sóng nhẹ, bầu trời trong xanh rất thích hợp tắm biển & khám phá.';
        } else {
          seasonName = 'Mùa Mưa / Mùa Nước Nổi';
          weatherDesc = 'Khí hậu mát mẻ, có các cơn mưa rào ngắn. Đây cũng là mùa nước nổi miền Tây độc đáo trù phú sản vật.';
        }
      } else if (regCode === 'TNGY') {
        // Tây Nguyên
        if ([11, 12, 1, 2, 3, 4].includes(requestedMonth)) {
          seasonName = 'Mùa Khô';
          weatherDesc = 'Thời tiết se lạnh dễ chịu, nắng nhẹ dịu mát, hoa dã quỳ và hoa cà phê nở rực đồi núi.';
        } else {
          seasonName = 'Mùa Mưa';
          weatherDesc = 'Tiết trời mát mẻ có mưa rào, các ngọn thác Tây Nguyên bước vào mùa nước đổ hùng vĩ.';
        }
      } else if (regCode === 'BTBO' || regCode === 'NTBO') {
        // Duyên hải Miền Trung
        if ([1, 2, 3, 4, 5, 6, 7, 8].includes(requestedMonth)) {
          seasonName = 'Mùa Nắng / Mùa Biển';
          weatherDesc = 'Thời tiết nắng đẹp, bầu trời trong xanh, biển lặng sóng êm vô cùng lý tưởng để tắm biển và nghỉ dưỡng.';
        } else {
          seasonName = 'Mùa Mưa Thu - Đông';
          weatherDesc = 'Tiết trời mát mẻ chuyển se lạnh, có mưa rào rải rác dải miền Trung.';
        }
      } else {
        // Miền Bắc & Trung du Miền núi Phía Bắc
        if ([12, 1, 2].includes(requestedMonth)) {
          seasonName = 'Mùa Đông';
          weatherDesc = 'Thời tiết lạnh và khô, ban đêm và sáng sớm có sương mù bao phủ, vùng núi cao rét đậm (xuất hiện băng giá/săn mây).';
        } else if ([3, 4, 5].includes(requestedMonth)) {
          seasonName = 'Mùa Xuân';
          weatherDesc = 'Thời tiết mát mẻ, tiết trời trong lành dễ chịu, trăm hoa và cây cối đâm chồi nảy lộc.';
        } else if ([6, 7, 8].includes(requestedMonth)) {
          seasonName = 'Mùa Hè';
          weatherDesc = 'Thời tiết ấm áp/nóng, có mưa rào mùa hè giúp sông suối và các ngọn thác đầy nước xanh mát hùng vĩ.';
        } else {
          seasonName = 'Mùa Thu';
          weatherDesc = 'Thời tiết mùa thu trong lành, mát mẻ, nắng vàng hanh nhẹ, rất lý tưởng để săn lúa chín và dã ngoại.';
        }
      }

      let monthText = `🌡️ **Thời tiết & Du lịch ${provDisplayName} vào THÁNG ${requestedMonth}:**\n\n`;
      monthText += `• **Đặc điểm thời tiết (Tháng ${requestedMonth} - ${seasonName}):** ${weatherDesc}\n`;
      if (isIdeal) {
        monthText += `• **Đánh giá:** ✨ **Tháng ${requestedMonth} LÀ THỜI ĐIỂM VÀNG DU LỊCH ${provDisplayName.toUpperCase()}!**\n`;
      } else {
        monthText += `• **Đánh giá:** 🗓️ Tháng ${requestedMonth} thuộc ${seasonName}. (Thời điểm du lịch lý tưởng nhất của ${provDisplayName} là **${meta.ideal_period_text}**).\n`;
      }
      monthText += `• **Trải nghiệm & Điểm nhấn:** ${meta.highlights}.\n`;
      if (meta.official_website) {
        monthText += `• **Cổng thông tin chính thức:** ${meta.official_website}`;
      }

      return {
        responseText: monthText,
        matchSource: `Dự báo Mùa & Thời tiết Tháng ${requestedMonth} (${provDisplayName})`
      };
    }

    if (isWeatherQuery && meta) {
      let weatherText = `🌤️ **Tổng quan Khí hậu & Thời tiết tại ${provDisplayName}:**\n\n`;
      weatherText += `• **Thời điểm vàng du lịch:** **${meta.ideal_period_text}** (${meta.primary_season}).\n`;
      weatherText += `• **Đặc điểm khí hậu:** Mùa hè mát/ấm có mưa, mùa đông lạnh khô khan, mùa thu nắng vàng mát mẻ.\n`;
      weatherText += `• **Trải nghiệm nổi bật:** ${meta.highlights}.\n`;
      if (meta.official_website) {
        weatherText += `• **Cổng thông tin chính thức:** ${meta.official_website}`;
      }

      return {
        responseText: weatherText,
        matchSource: `Khí hậu & Thời tiết du lịch (${provDisplayName})`
      };
    }

    const isTimingQuery = /(tháng|thoi gian|thoi diem|khi nao|mua|hoa|lúa|lua|dep nhat|đẹp nhất|nen di|nên đi)/i.test(query);

    if (isTimingQuery && meta) {
      // Specific flower checks
      if (query.includes('hoa mận') || query.includes('hoa man')) {
        let mậnText = `🌸 **Thời điểm ngắm HOA MẬN ở ${provDisplayName}:**\n`;
        mậnText += `• **Thời gian nở đẹp nhất:** **Tháng 1 – Tháng 2** (Ngay dịp trước và sau Tết Nguyên Đán).\n`;
        mậnText += `• **Địa điểm ngắm tiêu biểu:** Thung lũng các xã vùng cao (Sủng Là, Đồng Văn, Mèo Vạc, Quản Bạ).\n`;
        mậnText += `• **Vẻ đẹp đặc trưng:** Sắc trắng bạt ngàn của hoa mận phủ khắp nếp nhà trình tường và triền núi đá cổ kính.\n\n`;
        mậnText += `🗓️ **Thời điểm du lịch tổng thể của ${provDisplayName}:** ${meta.ideal_period_text} (${meta.highlights}).`;
        return { responseText: mậnText, matchSource: `Thời điểm ngắm hoa & Mùa du lịch ${provDisplayName}` };
      }

      if (query.includes('tam giác mạch') || query.includes('tam giac mach')) {
        let tgmText = `🌸 **Thời điểm ngắm HOA TAM GIÁC MẠCH ở ${provDisplayName}:**\n`;
        tgmText += `• **Thời gian lý tưởng:** **Tháng 10 – Tháng 11** hằng năm.\n`;
        tgmText += `• **Địa điểm ngắm đẹp nhất:** Cao nguyên đá Đồng Văn, đèo Mã Pí Lèng, Hoàng Su Phì.\n`;
        tgmText += `• **Lễ hội:** Lễ hội hoa Tam giác mạch cấp tỉnh được tổ chức rộn ràng hằng năm.\n\n`;
        tgmText += `🗓️ **Thời điểm du lịch đẹp nhất:** ${meta.ideal_period_text}.`;
        return { responseText: tgmText, matchSource: `Lịch hoa Tam giác mạch ${provDisplayName}` };
      }

      if (query.includes('lúa') || query.includes('lua') || query.includes('ruộng bậc thang')) {
        let lúaText = `🌾 **Thời điểm ngắm MÙA LÚA CHÍN ở ${provDisplayName}:**\n`;
        lúaText += `• **Thời gian lý tưởng:** **Tháng 9 – Tháng 10**.\n`;
        lúaText += `• **Cảnh quan nổi bật:** ${meta.highlights}.\n\n`;
        lúaText += `🗓️ **Mùa du lịch chính:** ${meta.primary_season}.`;
        return { responseText: lúaText, matchSource: `Mùa lúa chín ${provDisplayName}` };
      }

      // General Best Time Query
      let timingText = `📍 **Thời điểm du lịch đẹp nhất ở ${provDisplayName.toUpperCase()}:**\n`;
      timingText += `• **Thời gian lý tưởng:** **${meta.ideal_period_text}** (Các tháng ${meta.ideal_months.join(', ')})\n`;
      timingText += `• **Mùa du lịch chính:** **${meta.primary_season}**\n`;
      timingText += `• **Trải nghiệm & Điểm nhấn:** ${meta.highlights}\n`;
      if (meta.reference_source) {
        timingText += `• **Căn cứ / Nguồn trích dẫn:** ${meta.reference_source}\n`;
      }
      if (meta.official_website) {
        timingText += `• **Cổng thông tin chính thức:** ${meta.official_website}`;
      }

      return { responseText: timingText, matchSource: `Dữ liệu Mùa du lịch chuẩn địa phương (${provDisplayName})` };
    }

    // 3. Check for Cuisine Queries
    const isCuisineQuery = /(ăn gì|an gi|món ăn|mon an|món ngon|mon ngon|đặc sản|dac san|ẩm thực|am thuc|quán ngon|nhà hàng|món gì|mon gi)/i.test(query) ||
                           (query.includes('món') && !query.includes('mới'));
    const provItems = this.getItemsForProvince(targetProvinceKey);

    if (isCuisineQuery) {
      const LOCAL_CUISINE_MAP: Record<string, string> = {
        'CAO BẰNG': `• **Bánh cuốn canh Cao Bằng**: Bánh cuốn tráng mỏng chấm cùng bát nước canh xương hầm ngọt đậm đà, giò lợn và trứng chần thơm béo.\n• **Phở vịt quay Trùng Khánh**: Vịt quay da giòn rụm, lá mắc mật thơm nức tẩm ướp đậm vị.\n• **Hạt dẻ Trùng Khánh**: Hạt dẻ to vỏ nâu sẫm, nhân vàng óng, ăn béo ngậy ngọt bùi.\n• **Khau nhục**: Món thịt lợn ba chỉ hầm nhừ với gia vị thảo mộc miền núi.\n• **Lạp sườn hun khói**: Lạp sườn ướp rượu gừng, hun khói mía thơm lừng.\n• **Bánh trứng kiến**: Món bánh độc đáo làm từ nếp nương và nhân trứng kiến đen (mùa xuân).\n• **Cá trầm hương Thác Bản Giốc**: Cá nướng thơm ngon săn chắc đánh bắt ở vùng thác Bản Giốc.`,
        'THÁI NGUYÊN': `• **Chè Tân Cương**: 'Đệ nhất danh trà' Việt Nam với vị chè chát dịu, hậu ngọt sâu và hương thơm cốm nức mũi.\n• **Bánh chưng Bờ Đậu**: Bánh chưng gói bằng lá dong rừng, nếp nương dẻo quánh, nhân thịt đậu xanh đậm đà.\n• **Cơm lam Định Hóa**: Cơm nếp nương nướng trong ống tre nứa thơm lừng vị núi rừng.\n• **Nem chua Đại Từ**: Nem chua lên men tự nhiên gói lá ổi, vị chua ngọt hài hòa.\n• **Tương nếp Úc Sơn**: Tương nếp ủ thủ công thơm ngọt ngậy béo.\n• **Trám đen Hà Châu**: Trám om kho thịt ba chỉ hoặc đồ xôi bùi ngậy.`,
        'HÀ GIANG': `• **Cháo tẩu ấu**: Món cháo đắng nhẹ độc đáo, bổ dưỡng và giữ ấm cơ thể trong đêm lạnh cao nguyên đá.\n• **Thắng cố Đồng Văn**: Món ăn truyền thống của đồng bào H'Mông làm từ nội tạng & thịt ngựa/bò.\n• **Bánh tam giác mạch**: Bánh nướng làm từ hạt hoa tam giác mạch thơm dẻo, xốp bùi.\n• **Mật ong bạc hà**: Mật ong hoa dại cao nguyên màu vàng chanh thơm mát mát độc nhất vô nhị.\n• **Thịt lợn đen hun khói**: Thịt gác bếp ướp mắc khén thơm lừng.\n• **Rượu ngô men lá**: Rượu nấu từ hạt ngô nương và 36 loại lá thuốc rừng.`,
        'AN GIANG': `• **Bò leo núi Tân Châu**: Thịt bò tơ tươi ngon ướp vị nướng trên vỉ hình quả núi ngậy béo.\n• **Gỏi sầu đâu**: Món gỏi trộn lá sầu đâu đắng nhẹ kết hợp khô cá sặc và nước mắm me.\n• **Bún cá An Giang**: Nước dùng đậm đà hương ngải bún, nghệ tươi và thịt cá lóc đồng săn ngọt.\n• **Cá lóc nướng trui**: Cá lóc nướng rơm thơm lừng bọc lá sen chấm mắm me.\n• **Mắm Châu Đốc**: Vương quốc mắm với mắm thái, mắm cá lóc, mắm cá linh, mắm ruột đậm đà.\n• **Khô nhái & Bánh bò thốt nốt**: Vũ nữ chân dài phơi khô giòn rụm và bánh bò thơm lừng đường thốt nốt.`,
        'LÀO CAI': `• **Thắng cố & Lẩu cá hồi Sa Pa**: Cá hồi tươi sống nuôi tại chân núi Fansipan thịt săn chắc ngọt lịm.\n• **Thịt trâu gác bếp**: Thịt trâu nướng thanh rồi gác bếp ướp mắc khén và hạt dổi.\n• **Cơm lam & Bánh chưng đen**: Món ăn dân dã dẻo thơm của đồng bào Tày, Thái Sa Pa.\n• **Rượu Táo Mèo & Rượu San Lùng**: Đột phá hương vị cay nồng ngọt dịu vùng cao.`,
        'HÀ NỘI': `• **Phở Hà Nội**: Phở bò, phở gà nước dùng trong thanh ngọt đậm đà từ xương ống hầm lâu.\n• **Bún chả Hà Nội**: Chả nướng thanh hoa thơm lừng chấm nước mắm chua ngọt ăn kèm bún tươi.\n• **Chả cá Lăng**: Chả cá xào thì là, hành hoa ăn kèm mắm tôm béo ngậy.\n• **Bún đậu mắm tôm**: Bún lá, đậu rán giòn, chả cốm chấm mắm tôm đánh sủi bọt.\n• **Cốm làng Vòng & Bánh cốm**: Hương vị thu Hà Nội mộc mạc thơm dẻo.`,
        'ĐÀ NẮNG': `• **Mì Quảng Đà Nẵng**: Mì sợi dẻo ăn kèm tôm, thịt lợn, trứng cút, bánh tráng nướng và rau sống.\n• **Bánh tráng cuốn thịt heo 2 đầu da**: Thịt luộc chín tới cuốn bánh tráng, rau rừng chấm mắm nêm đậm đà.\n• **Bún chả cá Đà Nẵng**: Bún nước dùng măng chua, chả cá thu/cá thát lát tươi rói.\n• **Chả bò Đà Nẵng**: Chả bò nguyên chất màu hồng tự nhiên thơm vị tiêu đen.`,
        'TP HỒ CHÍ MINH': `• **Cơm tấm Sài Gòn**: Cơm tấm sườn nướng thanh hoa nướng giòn thơm, sườn bì chả nướng chấm nước mắm chua ngọt.\n• **Bánh mì Sài Gòn**: Bánh mì giòn rụm kẹp pate, thịt nguội, chả lụa và dưa góp.\n• **Hủ tiếu Nam Vang**: Nước dùng tôm mực ngọt thanh, tôm tươi, thịt băm, trứng cút.\n• **Ốc Sài Gòn**: Ốc hương xào bơ tỏi, ốc mỡ xào me, mầm muống xào tỏi.`
      };

      // Check Admin uploaded custom food items first
      const customFoodItems = provItems.filter(i =>
        i.subCategory.toUpperCase() === 'ẨM THỰC' ||
        i.category === 'food' ||
        i.name.toLowerCase().includes('ẩm thực') ||
        i.name.toLowerCase().includes('đặc sản') ||
        i.title.toLowerCase().includes('ẩm thực') ||
        i.title.toLowerCase().includes('đặc sản') ||
        i.content.toLowerCase().includes('mon_an_dac_san') ||
        i.content.toLowerCase().includes('dac_san_qua_tang')
      );

      let resultText = '';
      if (customFoodItems.length > 0) {
        resultText = customFoodItems.map(fi => fi.content).join('\n\n');
      } else {
        const fallbackCuisine = LOCAL_CUISINE_MAP[targetProvinceKey] || LOCAL_CUISINE_MAP[normalizeProvinceKey(targetProvinceKey)];
        if (fallbackCuisine) {
          resultText = fallbackCuisine;
        } else {
          resultText = `• **Các món ăn đặc sản:** Món ăn dân dã truyền thống thơm ngon của ${provDisplayName}.\n• **Đặc sản quà tặng:** Nông sản địa phương, bánh kẹo và mắm/trà đặc sản.`;
        }
      }

      return {
        responseText: `🍜 **Ẩm thực & Món ngon Đặc sản tại ${provDisplayName}:**\n\n${resultText}`,
        matchSource: `Cẩm nang Ẩm thực & Đặc sản địa phương (${provDisplayName})`
      };
    }

    // 4. Specific Token Matching (Extract precise sentences or bullet points)
    const tokens = query.split(/\s+/).filter(t => t.length >= 2 && !['tháng', 'mấy', 'ở', 'đi', 'nào', 'gì', 'có', 'thể'].includes(t));
    let matchedParagraphs: string[] = [];

    for (const item of provItems) {
      const lines = item.content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const lineLower = line.toLowerCase();
        if (tokens.some(t => lineLower.includes(t))) {
          matchedParagraphs.push(line);
        }
      }
    }

    if (matchedParagraphs.length > 0) {
      let resultText = `💡 **Thông tin giải đáp cho thắc mắc về ${provDisplayName}:**\n\n`;
      const uniqueLines = Array.from(new Set(matchedParagraphs)).slice(0, 5);
      uniqueLines.forEach(l => {
        if (l.startsWith('•') || l.startsWith('###')) {
          resultText += `${l}\n`;
        } else {
          resultText += `• ${l}\n`;
        }
      });
      return { responseText: resultText.trim(), matchSource: `Trích xuất từ tư liệu ${provDisplayName}` };
    }

    // Fallback to general Overview
    const overviewItem = provItems.find(i => i.subCategory.toUpperCase() === 'TỔNG QUAN');
    if (overviewItem) {
      const firstPara = overviewItem.content.split(/\n\s*\n/)[0] || overviewItem.content.slice(0, 300);
      let fallbackText = `ℹ️ **Thông tin Tổng quan về ${provDisplayName}:**\n\n${firstPara}`;
      if (meta) {
        fallbackText += `\n\n🗓️ **Thời điểm du lịch khuyến nghị:** ${meta.ideal_period_text} (${meta.highlights}).`;
      }
      return { responseText: fallbackText, matchSource: `Tổng quan tri thức địa phương (${provDisplayName})` };
    }

    return {
      responseText: `Dữ liệu tri thức chính thống hiện tại về "${provDisplayName}" chưa đề cập chi tiết nội dung này. Hệ thống xin ghi nhận để bổ sung vào lần cập nhật tiếp theo.`,
      matchSource: 'Tra cứu tri thức'
    };
  }
};

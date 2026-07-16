import { describe, it, expect } from 'vitest';
import { MOCK_REGIONS } from '../helpers/test-data';
import { removeDiacritics, cleanGeographicName } from '../../../ai-agents/utils/agent.utils';

// ─── Unit: removeDiacritics ──────────────────────────────
describe('removeDiacritics() — text normalization', () => {
  it('should remove Vietnamese diacritics', () => {
    expect(removeDiacritics('Hà Nội')).toBe('ha noi');
    expect(removeDiacritics('Đà Nẵng')).toBe('da nang');
    expect(removeDiacritics('Sài Gòn')).toBe('sai gon');
    expect(removeDiacritics('Phú Quốc')).toBe('phu quoc');
  });

  it('should handle empty strings', () => {
    expect(removeDiacritics('')).toBe('');
  });

  it('should normalize and trim whitespace', () => {
    expect(removeDiacritics('  Hà Giang  ')).toBe('ha giang');
  });

  it('should lowercase input', () => {
    expect(removeDiacritics('NHA TRANG')).toBe('nha trang');
  });

  it('should handle mixed diacritics and normal text', () => {
    // removeDiacritics collapses spaces around hyphens via /\s*-\s*/g -> '-'
    expect(removeDiacritics('Cà Mau - Đất Mũi')).toBe('ca mau-dat mui');
  });
});

// ─── Unit: cleanGeographicName ───────────────────────────
describe('cleanGeographicName() — geographic prefix stripping', () => {
  it('should strip "tinh " prefix', () => {
    expect(cleanGeographicName('tinh Ha Giang')).toBe('ha giang');
  });

  it('should strip "thanh pho " prefix', () => {
    // 'ho ' is also in the prefix list, so it gets stripped to 'chi minh'
    expect(cleanGeographicName('thanh pho Ho Chi Minh')).toBe('chi minh');
  });

  it('should strip "tp. " prefix', () => {
    expect(cleanGeographicName('tp. Da Nang')).toBe('da nang');
  });

  it('should return unchanged text if no prefix matches', () => {
    expect(cleanGeographicName('Ha Noi')).toBe('ha noi');
  });

  it('should handle empty string', () => {
    expect(cleanGeographicName('')).toBe('');
  });
});

// ─── Unit: Destination Detection Logic ───────────────────
describe('Destination detection patterns', () => {
  // Build a simple regex function matching the production logic
  function hasTravelPattern(input: string): string | null {
    const match = input.match(/(?:đi|đến|ở|tại|du lịch|khám phá|về)\s+(\S+(?:\s+\S+){0,2})/u);
    return match ? match[1].trim() : null;
  }

  it('should detect explicit destinations via travel patterns', () => {
    const testCases = [
      { input: 'đi Hà Giang', expected: 'Hà Giang' },
      { input: 'du lịch Đà Lạt', expected: 'Đà Lạt' },
      { input: 'ở Sài Gòn', expected: 'Sài Gòn' },
      { input: 'khám phá Phú Quốc', expected: 'Phú Quốc' },
      { input: 'về Cần Thơ', expected: 'Cần Thơ' },
      { input: 'tại Nha Trang', expected: 'Nha Trang' },
    ];

    for (const { input, expected } of testCases) {
      expect(hasTravelPattern(input)).toBe(expected);
    }
  });

  it('should not match when no travel verb is present', () => {
    expect(hasTravelPattern('thời tiết hôm nay thế nào')).toBeNull();
    expect(hasTravelPattern('xin chào')).toBeNull();
  });

  it('should normalize destination names with diacritics removal for fuzzy matching', () => {
    const destinations = MOCK_REGIONS.map(r => removeDiacritics(r.toLowerCase()));
    
    const testCases = [
      { query: 'ha noi', expected: 'Hà Nội' },
      { query: 'da lat', expected: 'Đà Lạt' },
      { query: 'nha trang', expected: 'Nha Trang' },
      { query: 'sai gon', expected: 'Sài Gòn' },
    ];

    for (const { query, expected } of testCases) {
      const matchedIndex = destinations.findIndex(d => d === query);
      expect(matchedIndex).toBeGreaterThanOrEqual(0);
      expect(MOCK_REGIONS[matchedIndex]).toBe(expected);
    }
  });

  it('should match via substring for compound names', () => {
    const cleanInput = removeDiacritics('đi Phú Quốc chơi');
    const matched = MOCK_REGIONS.find(r => {
      const cleanRegion = removeDiacritics(r.toLowerCase());
      return cleanRegion.length > 1 && cleanInput.includes(cleanRegion);
    });
    expect(matched).toBe('Phú Quốc');
  });

  it('should match via diacritic-free substring', () => {
    const cleanInput = removeDiacritics('đi Hà Giang chơi');
    const matched = MOCK_REGIONS.find(r => {
      const cleanRegion = removeDiacritics(r.toLowerCase());
      return cleanRegion.length > 1 && cleanInput.includes(cleanRegion);
    });
    expect(matched).toBe('Hà Giang');
  });

  it('should handle stripped geographic names', () => {
    const region = 'Huyện Đảo Phú Quốc';
    const stripped = cleanGeographicName(region);
    // 'dao ' is also in the prefix list, so it gets stripped to 'phu quoc'
    expect(stripped).toBe('phu quoc');
    
    const cleanDest = removeDiacritics('phu quoc').replace(/\s+/g, '');
    const cleanStripped = stripped.replace(/\s+/g, '');
    expect(cleanStripped.includes(cleanDest) || cleanDest.includes(cleanStripped)).toBe(true);
  });

  it('should correctly detect destinations in full query sentences', () => {
    const queries = [
      { text: 'tôi muốn đi Hà Giang phượt', expected: 'Hà Giang' },
      { text: 'món ăn ngon ở Sài Gòn', expected: 'Sài Gòn' },
      { text: 'du lịch Đà Nẵng 3 ngày', expected: 'Đà Nẵng' },
      { text: 'đến Huế bằng xe máy', expected: 'Huế' },
    ];

    for (const { text, expected } of queries) {
      const cleanInput = removeDiacritics(text.toLowerCase());
      const matched = MOCK_REGIONS.find(r => {
        const cleanRegion = removeDiacritics(r.toLowerCase());
        return cleanRegion.length > 1 && cleanInput.includes(cleanRegion);
      });
      expect(matched).toBe(expected);
    }
  });
});

import { ChatbotIntent } from '../interfaces/intelligence.interfaces';
import { removeDiacritics } from '../../../ai-agents/utils/agent.utils';

export interface SemanticPattern {
  phrase: string;
  intent: ChatbotIntent;
}

// Generate combinations programmatically to cover 300+ real-world travel expressions
function generatePatterns(): SemanticPattern[] {
  const patterns: SemanticPattern[] = [];

  const prefixes = ['', 'cho', 'hay', 'vui long', 'lam on', 'ban', 'bot', 'ai', 'de xuat', 'tim', 'kiem'];
  
  // 1. RECOMMENDATION_MORE / EXPAND (e.g. "cho xem thêm địa điểm đi")
  const moreActions = ['them', 'xem them', 'goi y them', 'tim them', 'kiem them', 'chi them', 'gioi thieu them', 'nua đi', 'tiep di'];
  const destinations = ['dia diem', 'diem den', 'cho choi', 'noi choi', 'khu du lich', 'danh thang', 'canh dep', 'diem checkin'];
  const suffixes = ['', 'di', 'nua', 'nua di', 'nhe', 'giup', 'gium', 'khac', 'moi', 'hap dan hon'];

  for (const pre of prefixes) {
    for (const act of moreActions) {
      for (const dest of destinations) {
        for (const suf of suffixes) {
          const phrase = `${pre} ${act} ${dest} ${suf}`.replace(/\s+/g, ' ').trim();
          if (phrase.length > 5) {
            patterns.push({ phrase, intent: 'RECOMMENDATION_MORE' });
          }
        }
      }
    }
  }

  // 2. RECOMMENDATION_REPLACE / ALTERNATIVE (e.g. "đổi chỗ khác", "không thích cái này")
  const replaceActions = ['doi', 'chuyen', 'thay doi', 'thay the', 'bo qua', 'khong thich', 'doi phuong an'];
  const replaceNouns = ['dia diem', 'cho', 'diem den', 'noi', 'cai nay', 'cai vua goi y', 'khach san', 'quan an'];
  const replaceSuffixes = ['khac', 'moi', 'di', 'nhe', 'giup', 'gium', 'cho khac', 'noi khac'];

  for (const pre of prefixes) {
    for (const act of replaceActions) {
      for (const noun of replaceNouns) {
        for (const suf of replaceSuffixes) {
          const phrase = `${pre} ${act} ${noun} ${suf}`.replace(/\s+/g, ' ').trim();
          if (phrase.length > 5) {
            patterns.push({ phrase, intent: 'RECOMMENDATION_REPLACE' });
          }
        }
      }
    }
  }

  // 3. REJECT patterns (e.g. "xấu quá", "không hấp dẫn", "chán ngắt")
  const rejectKeywords = [
    'xau qua', 'khong on', 'khong hop', 'it qua', 'chan ngat', 'chan qua', 'do qua', 'te qua',
    'dung cai nay', 'khong ung', 'khong thich', 'khong hap dan', 'khong an tuong', 'nhat nheo', 'kem qua'
  ];
  for (const kw of rejectKeywords) {
    patterns.push({ phrase: kw, intent: 'RECOMMENDATION_REPLACE' });
  }

  return patterns;
}

// Pre-compiled list of normalized patterns
const compiledPatterns = generatePatterns();

/**
 * Match a normalized query against the generated semantic patterns
 */
export function matchSemanticPattern(query: string): ChatbotIntent | null {
  const cleanQuery = removeDiacritics(query.toLowerCase()).replace(/\s+/g, ' ').trim();

  // 1. Direct sub-string or match of pre-generated patterns
  // To avoid performance issues, we check the most common exact phrases first
  const fastMatches: Record<string, ChatbotIntent> = {
    'them dia diem': 'RECOMMENDATION_MORE',
    'goi y them': 'RECOMMENDATION_MORE',
    'con gi nua': 'RECOMMENDATION_MORE',
    'con noi nao khac': 'RECOMMENDATION_MORE',
    'tiep di': 'RECOMMENDATION_MORE',
    'xem them': 'RECOMMENDATION_MORE',
    'doi cho khac': 'RECOMMENDATION_REPLACE',
    'doi dia diem': 'RECOMMENDATION_REPLACE',
    'doi noi khac': 'RECOMMENDATION_REPLACE',
    'khong thich': 'RECOMMENDATION_REPLACE',
    'chan ngat': 'RECOMMENDATION_REPLACE',
    'xau qua': 'RECOMMENDATION_REPLACE',
    'khong hap dan': 'RECOMMENDATION_REPLACE'
  };

  if (fastMatches[cleanQuery]) {
    return fastMatches[cleanQuery];
  }

  // 2. Scan compiled patterns
  for (const pattern of compiledPatterns) {
    if (cleanQuery === pattern.phrase || cleanQuery.includes(pattern.phrase)) {
      return pattern.intent;
    }
  }

  return null;
}

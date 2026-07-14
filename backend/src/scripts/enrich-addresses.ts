import fs from 'fs';
import path from 'path';

interface RealPlace {
  province?: string;
  title: string;
  content: string;
  category: string;
  latitude: number;
  longitude: number;
  costEstimate: number;
  address?: string;
}

const destinationsDir = path.resolve(__dirname, '../config/destinations');

const allowedStartingWords = [
  'số',
  'đường',
  'phố',
  'quốc lộ',
  'tỉnh lộ',
  'đại lộ',
  'ngã tư',
  'ngã ba',
  'đê',
  'xã',
  'phường',
  'thị trấn',
  'thị xã',
  'huyện',
  'quận',
  'ấp',
  'thôn',
  'bản',
  'tổ',
  'khu phố',
  'khu công nghiệp',
  'khu đô thị',
  'trục đường',
  'tuyến đường'
];

function hasStandaloneWord(text: string, word: string): boolean {
  const lowercaseText = text.toLowerCase();
  const idx = lowercaseText.indexOf(word);
  if (idx === -1) return false;
  
  const charBefore = idx > 0 ? lowercaseText[idx - 1] : '';
  const charAfter = lowercaseText[idx + word.length];
  
  const isWordBoundary = (charBefore === '' || /[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(charBefore)) &&
                         (charAfter === undefined || /[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(charAfter));
  return isWordBoundary;
}

function findAddressStart(text: string): { startIdx: number; word: string } | null {
  const lowercaseText = text.toLowerCase();
  let bestIdx = -1;
  let matchedWord = '';

  // Sort by length descending to match longer keywords first
  const sortedStartingWords = [...allowedStartingWords].sort((a, b) => b.length - a.length);

  for (const word of sortedStartingWords) {
    const idx = lowercaseText.indexOf(word);
    if (idx !== -1 && idx < 45) { // must be near the start of the candidate text
      if (hasStandaloneWord(text, word)) {
        if (bestIdx === -1 || idx < bestIdx) {
          bestIdx = idx;
          matchedWord = word;
        }
      }
    }
  }

  if (bestIdx !== -1) {
    return { startIdx: bestIdx, word: matchedWord };
  }
  return null;
}

// Helper to check if candidate address is more detailed or better than current address
function shouldUpdateAddress(current: string, candidate: string): boolean {
  if (!current) return true;
  
  const cur = current.toLowerCase().trim();
  const cand = candidate.toLowerCase().trim();
  
  if (cur === cand) return false;

  const curHasNum = /\d/.test(cur);
  const candHasNum = /\d/.test(cand);
  if (!curHasNum && candHasNum) return true;

  const keywords = ['đường', 'phố', 'phường', 'xã', 'quận', 'huyện', 'thị xã', 'thị trấn', 'quốc lộ', 'tỉnh lộ', 'đại lộ'];
  let countCur = 0;
  let countCand = 0;
  for (const kw of keywords) {
    if (hasStandaloneWord(cur, kw)) countCur++;
    if (hasStandaloneWord(cand, kw)) countCand++;
  }

  if (countCand > countCur) return true;
  return cand.length > cur.length + 5;
}

function extractAddress(content: string, province: string): string | null {
  if (!content) return null;

  const introKeywords = [
    'nằm tại số',
    'nằm tại',
    'tọa lạc tại số',
    'tọa lạc tại',
    'thuộc địa bàn',
    'địa chỉ tại',
    'ở số',
    'thuộc xã',
    'thuộc huyện',
    'thuộc thị trấn',
    'thuộc thành phố',
    'thuộc tỉnh',
    'nằm ở số',
    'nằm ở',
    'tọa lạc ở',
    'địa chỉ ở',
    'địa chỉ:',
  ];

  for (const kw of introKeywords) {
    const idx = content.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      let after = content.substring(idx + kw.length).trim();
      
      // Stop words to cut the address clause
      const stopWords = [
        '.',
        ';',
        ', là',
        ', đang',
        ', được',
        ', có',
        ', nơi',
        ', mang',
        ', sở hữu',
        ', một ',
        ', phục vụ',
        ', chuyên',
        ' là ',
        ' có ',
        ' được ',
        ' mang ',
        ' chuyên ',
        ' phục vụ ',
        ' nhằm ',
        ' để ',
        ' với ',
        ' là một ',
        ' rộng ',
        ' cao ',
        ' cách ',
        ' nằm ',
        ' tọa lạc ',
        ' giúp ',
        ' đem ',
        ' mang lại ',
        ' kết nối ',
        ' hứa hẹn ',
        ' sở hữu ',
        ' thiết kế ',
        ' xây dựng '
      ];
      
      let cutoff = after.length;
      for (const stop of stopWords) {
        const stopIdx = after.toLowerCase().indexOf(stop);
        if (stopIdx !== -1 && stopIdx < cutoff) {
          cutoff = stopIdx;
        }
      }
      
      let candidate = after.substring(0, cutoff).trim();
      
      // Find actual address starting boundary
      const addrStart = findAddressStart(candidate);
      if (!addrStart) continue; // skip if no address keyword found near the start

      // Slice from the start of the address word
      candidate = candidate.substring(addrStart.startIdx).trim();

      // Clean up punctuation
      candidate = candidate.replace(/^[\s,.:;'"-]+|[\s,.:;'"-]+$/g, '').trim();
      
      // Verify it has actual details (must contain at least one detail keyword)
      const detailKeywords = [
        'số', 'đường', 'phố', 'quốc lộ', 'tỉnh lộ', 'đại lộ', 'đê',
        'xã', 'phường', 'thị trấn', 'huyện', 'quận', 'ấp', 'thôn',
        'bản', 'tổ', 'khu phố', 'ngã tư', 'ngã ba'
      ];
      
      let hasDetail = false;
      for (const dkw of detailKeywords) {
        if (hasStandaloneWord(candidate, dkw)) {
          hasDetail = true;
          break;
        }
      }
      
      if (hasDetail && candidate.length > 5) {
        // Append province if not already present
        const cleanProvince = province.toLowerCase().replace(/^(tinh|thanh pho|tp)\s+/g, '').trim();
        if (!candidate.toLowerCase().includes(cleanProvince)) {
          candidate = candidate + `, ${province}`;
        }
        return candidate;
      }
    }
  }

  // Regex fallback 1: "số X đường Y, phường Z, quận W, tỉnh V"
  const generalRegex = /(số\s+\d+\s+đường\s+[^,.]+?,\s*(?:phường|xã|thị trấn)\s+[^,.]+?,\s*(?:quận|huyện|thị xã|thành phố)\s+[^,.]+?,\s*(?:tỉnh|thành phố)\s+[^,.]+?)/i;
  const matchGen = content.match(generalRegex);
  if (matchGen && matchGen[1]) {
    return matchGen[1].trim();
  }

  // Regex fallback 2: "xã/phường X, huyện Y, tỉnh Z"
  const simpleRegex = /((?:phường|xã|thị trấn)\s+[A-ZĐ][^,.]+?,\s*(?:quận|huyện|thị xã|thành phố)\s+[A-ZĐ][^,.]+?,\s*(?:tỉnh|thành phố)\s+[A-ZĐ][^,.]+?)/;
  const matchSim = content.match(simpleRegex);
  if (matchSim && matchSim[1]) {
    return matchSim[1].trim();
  }

  return null;
}

function runEnrich() {
  console.log('=== START EXTRACTING AND ENRICHING ADDRESSES FROM CONTENT ===');

  if (!fs.existsSync(destinationsDir)) {
    console.error(`Destinations directory not found at: ${destinationsDir}`);
    return;
  }

  const files = fs.readdirSync(destinationsDir).filter(f => f.endsWith('.json'));
  let totalPlacesProcessed = 0;
  let totalAddressesUpdated = 0;

  for (const file of files) {
    const filePath = path.join(destinationsDir, file);
    const contentText = fs.readFileSync(filePath, 'utf-8');
    let items: RealPlace[] = [];
    try {
      items = JSON.parse(contentText);
    } catch (e) {
      console.error(`Failed to parse JSON file: ${file}`);
      continue;
    }

    if (!Array.isArray(items)) continue;

    let fileUpdated = false;

    for (const item of items) {
      totalPlacesProcessed++;
      const expectedProvinceName = item.province || file.replace('tinh-', '').replace('thanh-pho-', '').replace('.json', '').replace(/-/g, ' ');
      
      const extracted = extractAddress(item.content, expectedProvinceName);
      if (extracted) {
        const currentAddr = item.address || '';
        if (shouldUpdateAddress(currentAddr, extracted)) {
          console.log(`[UPDATE] In "${file}" -> "${item.title}":`);
          console.log(`  - Old Address: "${currentAddr}"`);
          console.log(`  - New Address: "${extracted}"`);
          item.address = extracted;
          fileUpdated = true;
          totalAddressesUpdated++;
        }
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`[SAVED] File updated: ${file}\n`);
    }
  }

  console.log('=== ADDRESS ENRICHMENT COMPLETED ===');
  console.log(`Total places processed: ${totalPlacesProcessed}`);
  console.log(`Total addresses updated: ${totalAddressesUpdated}`);
}

runEnrich();

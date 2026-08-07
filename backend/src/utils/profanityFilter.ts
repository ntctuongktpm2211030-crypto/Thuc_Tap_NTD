/**
 * SmartTravel / Terraholic Profanity & Violation Filter Engine
 * Hỗ trợ nhận diện rộng bao hàm từ cấm, biến thể không dấu, ký tự chèn lách luật (dấu chấm, dấu cách, ký tự đặc biệt)
 */

// Danh mục từ cấm phân loại theo chủ đề
export const PROFANITY_CATEGORIES = {
  // Nhóm 1: Cờ bạc, Đề cược, Lừa đảo tài chính
  GAMBLING_SPAM: [
    'cờ bạc', 'co bac', 'tài xỉu', 'tai xiu', 'baccarat', 'xóc đĩa', 'xoc dia',
    'bán số đề', 'ban so de', 'kéo tài xỉu', 'keo tai xiu', 'nạp tiền nhận hoa hồng',
    'lừa tiền', 'lua tien', 'lừa đảo', 'lua dao', 'kéo bài phượt', 'chơi lô đề',
    'đánh bài ăn tiền', 'danh bai an tien', 'game bài đổi thưởng', 'nhà cái uy tín'
  ],

  // Nhóm 2: Từ ngữ Thô tục, Xúc phạm, Thù hận
  PROFANITY: [
    'đồ ngu', 'do ngu', 'súc vật', 'suc vat', 'vô học', 'vo hoc', 'đồ chó', 'do cho',
    'đái', 'ỉa', 'mất dạy', 'mat day', 'hại người', 'phản động', 'phan dong'
  ],

  // Nhóm 3: Chất cấm, Dịch vụ bất hợp pháp
  ILLEGAL_DRUGS_SERVICES: [
    'cần sa', 'can sa', 'ma túy', 'ma tuy', 'thuốc lắc', 'thuoc lac',
    'bóng cười', 'bong cuoi', 'gái gọi', 'gai goi', 'bán bằng lái', 'ban bang lai'
  ],

  // Nhóm 4: Spam Quảng cáo rác, Hack, Buff tương tác
  SPAM_HACK: [
    'hack xu', 'buff sub', 'buff follow', 'buff like', 'chạy quảng cáo chiết khấu',
    'inbox làm giàu', 'lam giau nhanh', 'tăng tương tác giá rẻ'
  ]
};

// Tổng hợp danh sách từ cấm rộng bao hàm
export const ALL_PROFANITY_KEYWORDS = [
  ...PROFANITY_CATEGORIES.GAMBLING_SPAM,
  ...PROFANITY_CATEGORIES.PROFANITY,
  ...PROFANITY_CATEGORIES.ILLEGAL_DRUGS_SERVICES,
  ...PROFANITY_CATEGORIES.SPAM_HACK
];

/**
 * Loại bỏ dấu tiếng Việt để so sánh chuỗi không dấu
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hóa chuỗi loại bỏ các ký tự chèn lách luật (dấu chấm, dấu gạch ngang, khoảng trắng thừa, ký tự đặc biệt)
 * Ví dụ: "c.ờ  b-ạ--c" -> "cờ bạc", "t*à*i  x*ỉ*u" -> "tài xỉu"
 */
export function normalizeTextForChecking(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\.\-_\*@#\$\^&!\?\+\=\|\\/]/g, '') // Xóa ký tự đặc biệt hay dùng lách luật
    .replace(/\s+/g, ' ')                          // Thu gọn khoảng trắng
    .trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Động cơ Kiểm tra Từ Cấm Rộng Bao Hàm (Profanity Engine)
 */
export function checkContentViolation(text: string): { 
  isViolation: boolean; 
  matchedKeyword?: string; 
  categoryName?: string;
  reason?: string;
} {
  if (!text) return { isViolation: false };

  const rawLower = text.toLowerCase();
  const normalizedText = normalizeTextForChecking(text);
  const noAccentsText = removeVietnameseAccents(normalizedText);

  // Quét theo từng nhóm danh mục từ cấm
  for (const [categoryKey, keywords] of Object.entries(PROFANITY_CATEGORIES)) {
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      const kwNoAccents = removeVietnameseAccents(kwLower);

      let matched = false;

      // 1. Với từ cấm ngắn (≤ 4 ký tự hoặc từ đơn có dấu như "đái", "ỉa")
      const hasAccents = kwLower !== kwNoAccents;

      if (kwLower.length <= 4 || !kwLower.includes(' ')) {
        // Nếu từ cấm có dấu (VD: "đái", "ỉa"), BẮT BUỘC phải kiểm tra chính xác từ có dấu với ranh giới từ (Word Boundary).
        // Tuyệt đối KHÔNG quét qua noAccentsText để tránh bắt nhầm các từ tiếng Việt hợp lệ (VD: "dài", "đại", "bài", "khái")
        const strictAccentsRegex = new RegExp(`(?:^|\\s|[^a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])${escapeRegExp(kwLower)}(?:$|\\s|[^a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])`, 'i');

        if (strictAccentsRegex.test(rawLower)) {
          matched = true;
        } else if (!hasAccents) {
          // Chỉ kiểm tra qua noAccentsText nếu bản thân từ cấm nhập vào là không dấu (VD: "do ngu", "suc vat")
          const noAccentsRegex = new RegExp(`(?:^|\\s|[^a-zA-Z0-9_])${escapeRegExp(kwNoAccents)}(?:$|\\s|[^a-zA-Z0-9_])`, 'i');
          if (noAccentsRegex.test(noAccentsText)) {
            matched = true;
          }
        }
      } else {
        // 2. Với các cụm từ nhiều từ (VD: "cờ bạc", "tài xỉu", "gái gọi", "bán số đề"), áp dụng quét bao hàm rộng
        if (
          rawLower.includes(kwLower) ||
          normalizedText.includes(kwLower) ||
          noAccentsText.includes(kwNoAccents)
        ) {
          matched = true;
        }
      }

      if (matched) {
        let categoryName = 'Nội dung vi phạm tiêu chuẩn cộng đồng';
        if (categoryKey === 'GAMBLING_SPAM') categoryName = 'Cờ bạc / Lừa đảo tài chính / Số đề';
        if (categoryKey === 'PROFANITY') categoryName = 'Ngôn từ thô tục / Xúc phạm';
        if (categoryKey === 'ILLEGAL_DRUGS_SERVICES') categoryName = 'Chất cấm / Dịch vụ bất hợp pháp';
        if (categoryKey === 'SPAM_HACK') categoryName = 'Spam quảng cáo rác / Hack / Buff';

        return {
          isViolation: true,
          matchedKeyword: kw,
          categoryName,
          reason: `Phát hiện cụm từ vi phạm thuộc nhóm [${categoryName}]: "${kw}"`
        };
      }
    }
  }

  return { isViolation: false };
}

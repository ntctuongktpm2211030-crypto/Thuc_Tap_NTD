import prisma from '../../../config/db';

export interface BehaviorProfile {
  category: string; // "Biển" | "Ẩm thực" | "Núi" | "Lịch sử" | "Sinh thái" | "Tâm linh" | "Mua sắm"
  count: number;
  percentage: number;
}

const CATEGORY_KEYWORDS: Record<string, { label: string; keywords: string[] }> = {
  beach: {
    label: 'Biển đảo',
    keywords: ['biển', 'bãi', 'nha trang', 'phú quốc', 'vũng tàu', 'sea', 'beach', 'đà nẵng', 'quy nhơn', 'công viên nước', 'đảo', 'bãi tắm']
  },
  culinary: {
    label: 'Ẩm thực',
    keywords: ['ẩm thực', 'ăn uống', 'quán', 'đặc sản', 'nhà hàng', 'food', 'restaurant', 'lẩu', 'nướng', 'hải sản', 'cà phê', 'chè', 'đồ ăn']
  },
  mountain: {
    label: 'Núi non / Phượt',
    keywords: ['núi', 'đồi', 'sapa', 'hà giang', 'đèo', 'trekking', 'leo núi', 'mountain', 'hill', 'đà lạt', 'phượt', 'hang động']
  },
  history: {
    label: 'Lịch sử / Văn hóa',
    keywords: ['lịch sử', 'di tích', 'bảo tàng', 'cổ kính', 'lăng', 'history', 'museum', 'văn hóa', 'nhà tù', 'thành cổ']
  },
  ecology: {
    label: 'Sinh thái / Thiên nhiên',
    keywords: ['sinh thái', 'rừng', 'quốc gia', 'vườn', 'thác', 'forest', 'nature', 'ecology', 'hồ', 'sông', 'vườn hoa']
  },
  spiritual: {
    label: 'Tâm linh / Chùa chiền',
    keywords: ['tâm linh', 'chùa', 'đền', 'phật', 'nhà thờ', 'pagoda', 'temple', 'church', 'tượng phật', 'thánh thất']
  },
  shopping: {
    label: 'Mua sắm',
    keywords: ['mua sắm', 'chợ', 'mall', 'market', 'shopping', 'siêu thị', 'trung tâm thương mại', 'đồ lưu niệm']
  }
};

export async function getUserBehaviorProfile(): Promise<BehaviorProfile[]> {
  // 1. Fetch search logs
  const searches = await prisma.searchStatistics.findMany({
    select: { keyword: true, searchCount: true }
  });

  // 2. Fetch checkins with destination details
  const checkins = await prisma.checkIn.findMany({
    include: { destination: { select: { name: true, category: true, address: true } } }
  });

  // 3. Fetch review comments (travel history)
  const reviews = await prisma.travelHistory.findMany({
    where: { rating: { not: null } },
    select: { comment: true }
  });

  // 4. Fetch post contents
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    select: { content: true }
  });

  const profileCounts: Record<string, number> = {
    beach: 0,
    culinary: 0,
    mountain: 0,
    history: 0,
    ecology: 0,
    spiritual: 0,
    shopping: 0
  };

  // Helper to match text against category keywords
  const matchCategory = (text: string, count: number = 1) => {
    const lower = text.toLowerCase();
    for (const [cat, data] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of data.keywords) {
        if (lower.includes(kw)) {
          profileCounts[cat] += count;
          break; // Avoid counting multiple keywords of the same category in the same text
        }
      }
    }
  };

  // Analyze Searches
  searches.forEach(s => matchCategory(s.keyword, s.searchCount));

  // Analyze Checkins
  checkins.forEach(c => {
    if (c.destination) {
      matchCategory(c.destination.name, 2); // Double weight for actual check-ins
      matchCategory(c.destination.category, 2);
      if (c.destination.address) {
        matchCategory(c.destination.address, 1);
      }
    }
  });

  // Analyze Reviews
  reviews.forEach(r => {
    if (r.comment) matchCategory(r.comment, 1.5); // 1.5x weight for active ratings
  });

  // Analyze Posts
  posts.forEach(p => matchCategory(p.content, 1));

  // Calculate totals and percentages
  const totalPoints = Object.values(profileCounts).reduce((a, b) => a + b, 0) || 1;

  const result: BehaviorProfile[] = Object.entries(CATEGORY_KEYWORDS).map(([key, data]) => {
    const count = profileCounts[key];
    const percentage = Math.round((count / totalPoints) * 100);
    return {
      category: data.label,
      count,
      percentage
    };
  });

  return result.sort((a, b) => b.count - a.count);
}

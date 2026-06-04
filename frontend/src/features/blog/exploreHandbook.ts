import type { ExplorePost } from './exploreBlogData';

export type HandbookType = 'am-thuc' | 'van-hoa';

export interface HandbookSection {
  id: string;
  heading: string;
  destination: string;
  province: string;
  items: string[];
  excerpt: string;
  sourcePostIds: string[];
  coverImage?: string;
}

export interface HandbookDocument {
  type: HandbookType;
  title: string;
  subtitle: string;
  intro: string;
  sections: HandbookSection[];
  updatedAt: string;
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function buildHandbook(posts: ExplorePost[], type: HandbookType): HandbookDocument {
  const isFood = type === 'am-thuc';
  const relevant = posts.filter(p => {
    if (isFood) return p.category === 'Ẩm thực' || p.dishes.length > 0;
    return p.category === 'Văn hóa' || p.cultureThemes.length > 0;
  });

  const byDestination = new Map<string, ExplorePost[]>();
  for (const p of relevant) {
    const key = p.destinations[0] || p.province || p.location.split(',')[0] || 'Việt Nam';
    const list = byDestination.get(key) ?? [];
    list.push(p);
    byDestination.set(key, list);
  }

  const sections: HandbookSection[] = [...byDestination.entries()].map(([dest, group]) => {
    const items = unique(
      group.flatMap(p => (isFood ? p.dishes : p.cultureThemes)),
    ).filter(Boolean);
    const excerpts = group.map(p => p.excerpt).filter(Boolean);
    return {
      id: dest.toLowerCase().replace(/\s+/g, '-'),
      heading: isFood ? `Ẩm thực tại ${dest}` : `Văn hóa ${dest}`,
      destination: dest,
      province: group[0]?.province ?? '',
      items,
      excerpt: excerpts[0] ?? '',
      sourcePostIds: group.map(p => p.id),
      coverImage: group[0]?.coverImage,
    };
  });

  const allItems = unique(sections.flatMap(s => s.items));

  return {
    type,
    title: isFood ? 'Cẩm nang ẩm thực Việt Nam' : 'Cẩm nang văn hóa & trải nghiệm',
    subtitle: `Tổng hợp từ ${relevant.length} bài viết cộng đồng SmartTravel`,
    intro: isFood
      ? `Chúng tôi trích xuất hành trình ẩm thực từ ${relevant.length} bài đăng của travellers — gợi ý món ăn, địa điểm và kinh nghiệm thực tế tại ${sections.length} điểm đến. Tổng cộng ${allItems.length} món/địa điểm ẩm thực được nhắc đến.`
      : `Tổng hợp di sản, lễ hội và trải nghiệm văn hóa từ ${relevant.length} bài chia sẻ — giúp bạn lên kế hoạch hành trình có chiều sâu hơn trước mỗi chuyến đi.`,
    sections: sections.sort((a, b) => b.items.length - a.items.length),
    updatedAt: new Date().toLocaleDateString('vi-VN'),
  };
}

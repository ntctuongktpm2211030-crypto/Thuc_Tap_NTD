import type { PostDisplayType } from '../utils/feedUtils';

/** Layout bài trên bảng tin (có thể chọn ở bước xem trước) */
export type PostLayoutId =
  | 'social'
  | 'magazine'
  | 'hero'
  | 'minimal'
  | 'gallery'
  | 'polaroid'
  | 'quote'
  | 'guide';

export type PostTypography = 'editorial' | 'modern' | 'classic' | 'rounded' | 'mono';
export type PostTheme = 'gold' | 'violet' | 'ocean' | 'sunset' | 'forest' | 'rose';
export type PostCardShape = 'rounded' | 'soft' | 'sharp';

export interface PostStyleSettings {
  layoutId: PostLayoutId;
  typography: PostTypography;
  theme: PostTheme;
  cardShape: PostCardShape;
}

export const DEFAULT_POST_STYLE: PostStyleSettings = {
  layoutId: 'magazine',
  typography: 'editorial',
  theme: 'gold',
  cardShape: 'rounded',
};

export const POST_LAYOUT_PRESETS: {
  id: PostLayoutId;
  label: string;
  group: 'social' | 'editorial';
  description: string;
  authorRef?: string;
}[] = [
  { id: 'social', label: 'Mạng xã hội', group: 'social', description: 'Caption + 1–2 ảnh', authorRef: 'Linh Trần' },
  { id: 'minimal', label: 'Tối giản', group: 'social', description: 'Chữ là chính, ảnh nhỏ' },
  { id: 'gallery', label: 'Album ảnh', group: 'social', description: 'Lưới 3 ảnh ngang' },
  { id: 'polaroid', label: 'Polaroid', group: 'social', description: 'Khung ảnh vintage' },
  { id: 'magazine', label: 'Magazine', group: 'editorial', description: 'Bìa + headline + excerpt', authorRef: 'Sarah Miller' },
  { id: 'quote', label: 'Trích dẫn', group: 'editorial', description: 'Câu quote lớn nổi bật' },
  { id: 'guide', label: 'Cẩm nang', group: 'editorial', description: 'Danh sách mẹo / bullet' },
  { id: 'hero', label: 'Nổi bật full', group: 'editorial', description: 'Ảnh full-bleed', authorRef: 'Minh Quân' },
];

export const TYPOGRAPHY_OPTIONS: { id: PostTypography; label: string; sample: string }[] = [
  { id: 'editorial', label: 'Editorial', sample: 'Playfair — sang trọng' },
  { id: 'modern', label: 'Hiện đại', sample: 'Sans gọn, dễ đọc' },
  { id: 'classic', label: 'Cổ điển', sample: 'Georgia — ấm áp' },
  { id: 'rounded', label: 'Trẻ trung', sample: 'Bo tròn, thân thiện' },
  { id: 'mono', label: 'Mono', sample: 'Đơn sắc, tối giản' },
];

export const THEME_OPTIONS: { id: PostTheme; label: string; color: string }[] = [
  { id: 'gold', label: 'Vàng ấm', color: '#f59e0b' },
  { id: 'violet', label: 'Tím', color: '#8b5cf6' },
  { id: 'ocean', label: 'Biển', color: '#0ea5e9' },
  { id: 'sunset', label: 'Hoàng hôn', color: '#f97316' },
  { id: 'forest', label: 'Rừng', color: '#10b981' },
  { id: 'rose', label: 'Hồng', color: '#f43f5e' },
];

export const CARD_SHAPE_OPTIONS: { id: PostCardShape; label: string }[] = [
  { id: 'rounded', label: 'Bo 16px' },
  { id: 'soft', label: 'Bo 24px' },
  { id: 'sharp', label: 'Vuông 8px' },
];

export function layoutIdToDisplayType(layoutId: PostLayoutId): PostDisplayType {
  if (layoutId === 'hero') return 'hero';
  if (layoutId === 'magazine' || layoutId === 'quote' || layoutId === 'guide') return 'magazine';
  return 'social';
}

export function getPostStyleClasses(style: PostStyleSettings): string {
  return [
    'journey-post-preview',
    `post-layout-${style.layoutId}`,
    `post-typo-${style.typography}`,
    `post-theme-${style.theme}`,
    `post-shape-${style.cardShape}`,
  ].join(' ');
}

export function syncStyleToDisplayType(
  layoutId: PostLayoutId,
  current: { requestFeatured?: boolean },
): { displayType: PostDisplayType; requestFeatured: boolean } {
  const displayType = layoutIdToDisplayType(layoutId);
  return {
    displayType,
    requestFeatured: layoutId === 'hero' ? (current.requestFeatured ?? false) : false,
  };
}

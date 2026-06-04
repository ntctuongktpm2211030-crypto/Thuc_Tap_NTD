import type { StoryLayoutId } from '../types/story';

export interface StoryLayoutDef {
  id: StoryLayoutId;
  label: string;
  description: string;
  minPhotos: number;
  maxPhotos: number;
  /** CSS grid class */
  gridClass: string;
  slots: number;
  category: 'solo' | 'duo' | 'triple' | 'quad' | 'multi';
}

export const STORY_LAYOUTS: StoryLayoutDef[] = [
  {
    id: 'single',
    label: 'Toàn màn',
    description: '1 ảnh full màn hình',
    minPhotos: 1,
    maxPhotos: 1,
    gridClass: 'story-grid-single',
    slots: 1,
    category: 'solo',
  },
  {
    id: 'split-v',
    label: 'Chia dọc',
    description: '2 ảnh trên / dưới',
    minPhotos: 2,
    maxPhotos: 6,
    gridClass: 'story-grid-split-v',
    slots: 2,
    category: 'duo',
  },
  {
    id: 'split-h',
    label: 'Chia ngang',
    description: '2 ảnh trái / phải',
    minPhotos: 2,
    maxPhotos: 6,
    gridClass: 'story-grid-split-h',
    slots: 2,
    category: 'duo',
  },
  {
    id: 'duo-top',
    label: 'Trên lớn',
    description: 'Ảnh trên nổi bật',
    minPhotos: 2,
    maxPhotos: 6,
    gridClass: 'story-grid-duo-top',
    slots: 2,
    category: 'duo',
  },
  {
    id: 'duo-side',
    label: 'Trái lớn',
    description: 'Ảnh trái nổi bật',
    minPhotos: 2,
    maxPhotos: 6,
    gridClass: 'story-grid-duo-side',
    slots: 2,
    category: 'duo',
  },
  {
    id: 'trio',
    label: 'Ba cột',
    description: '3 ảnh ngang',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-trio',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'grid-3',
    label: '1 + 2',
    description: '1 lớn, 2 nhỏ dưới',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-3',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'feature-left',
    label: 'Nổi bật trái',
    description: '1 lớn + 2 phụ phải',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-feature-left',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'feature-right',
    label: 'Nổi bật phải',
    description: '1 lớn + 2 phụ trái',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-feature-right',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'pyramid',
    label: 'Kim tự tháp',
    description: '1 trên, 2 dưới',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-pyramid',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'banner-3',
    label: 'Banner 3',
    description: '2 trên, 1 rộng dưới',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-banner-3',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'stripes-3',
    label: '3 dải',
    description: '3 hàng ngang',
    minPhotos: 3,
    maxPhotos: 6,
    gridClass: 'story-grid-stripes-3',
    slots: 3,
    category: 'triple',
  },
  {
    id: 'grid-4',
    label: 'Lưới 2×2',
    description: '4 ô vuông đều',
    minPhotos: 4,
    maxPhotos: 6,
    gridClass: 'story-grid-4',
    slots: 4,
    category: 'quad',
  },
  {
    id: 'feature-top-4',
    label: 'Banner 4',
    description: '1 lớn trên, 3 dưới',
    minPhotos: 4,
    maxPhotos: 6,
    gridClass: 'story-grid-feature-top-4',
    slots: 4,
    category: 'quad',
  },
  {
    id: 'mosaic-4',
    label: 'Mosaic 4',
    description: 'Ghép không đều',
    minPhotos: 4,
    maxPhotos: 6,
    gridClass: 'story-grid-mosaic-4',
    slots: 4,
    category: 'quad',
  },
  {
    id: 'column-4',
    label: '4 cột',
    description: '4 ảnh dọc',
    minPhotos: 4,
    maxPhotos: 6,
    gridClass: 'story-grid-column-4',
    slots: 4,
    category: 'quad',
  },
  {
    id: 'stripes-4',
    label: '4 dải',
    description: '4 hàng ngang',
    minPhotos: 4,
    maxPhotos: 6,
    gridClass: 'story-grid-stripes-4',
    slots: 4,
    category: 'quad',
  },
  {
    id: 'grid-5',
    label: '2 + 3',
    description: '2 trên, 3 dưới',
    minPhotos: 5,
    maxPhotos: 6,
    gridClass: 'story-grid-5',
    slots: 5,
    category: 'multi',
  },
  {
    id: 'panorama-5',
    label: 'Panorama 5',
    description: '1 rộng + 4 nhỏ',
    minPhotos: 5,
    maxPhotos: 6,
    gridClass: 'story-grid-panorama-5',
    slots: 5,
    category: 'multi',
  },
  {
    id: 'stripes-5',
    label: '5 dải',
    description: '5 hàng ngang',
    minPhotos: 5,
    maxPhotos: 6,
    gridClass: 'story-grid-stripes-5',
    slots: 5,
    category: 'multi',
  },
  {
    id: 'grid-6',
    label: 'Lưới 2×3',
    description: '6 ô 2 cột',
    minPhotos: 6,
    maxPhotos: 6,
    gridClass: 'story-grid-6',
    slots: 6,
    category: 'multi',
  },
  {
    id: 'grid-6-wide',
    label: 'Lưới 3×2',
    description: '6 ô 3 cột',
    minPhotos: 6,
    maxPhotos: 6,
    gridClass: 'story-grid-6-wide',
    slots: 6,
    category: 'multi',
  },
  {
    id: 'collage-6',
    label: 'Collage 6',
    description: '1 lớn + 5 phụ',
    minPhotos: 6,
    maxPhotos: 6,
    gridClass: 'story-grid-collage-6',
    slots: 6,
    category: 'multi',
  },
];

export const STORY_QUICK_LOCATIONS = [
  'Hà Giang', 'Sapa', 'Hội An', 'Đà Lạt', 'Phú Quốc', 'Hà Nội', 'Đà Nẵng', 'Ninh Bình',
];

/** Mẫu khung phù hợp số ảnh đã chọn (nhiều lựa chọn theo số ô) */
export function layoutsForPhotoCount(count: number): StoryLayoutDef[] {
  if (count <= 0) return [];
  if (count === 1) return STORY_LAYOUTS.filter(l => l.id === 'single');
  return STORY_LAYOUTS
    .filter(l => l.slots >= 2 && l.slots <= count)
    .sort((a, b) => a.slots - b.slots || a.label.localeCompare(b.label, 'vi'));
}

export function defaultLayoutForCount(count: number): StoryLayoutId {
  if (count <= 1) return 'single';
  const preferred = STORY_LAYOUTS.find(l => l.slots === count);
  if (preferred) return preferred.id;
  const list = layoutsForPhotoCount(count);
  return list[list.length - 1]?.id ?? 'split-v';
}

export function layoutCategoryLabel(category: StoryLayoutDef['category'], count: number): string {
  const map: Record<StoryLayoutDef['category'], string> = {
    solo: '1 ảnh',
    duo: '2 ảnh',
    triple: '3 ảnh',
    quad: '4 ảnh',
    multi: `${count} ảnh`,
  };
  return map[category] ?? '';
}

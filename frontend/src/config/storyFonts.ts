import type { StoryFontId } from '../types/story';

export const STORY_FONT_OPTIONS: { id: StoryFontId; label: string }[] = [
  { id: 'classic', label: 'Cổ điển' },
  { id: 'modern', label: 'Hiện đại' },
  { id: 'typewriter', label: 'Máy chữ' },
  { id: 'neon', label: 'Neon' },
  { id: 'script', label: 'Viết tay' },
];

export const STORY_FONT_CLASSES: Record<StoryFontId, string> = {
  classic: 'story-font-classic',
  modern: 'story-font-modern',
  typewriter: 'story-font-typewriter',
  neon: 'story-font-neon',
  script: 'story-font-script',
};

export const STORY_TEXT_COLORS = [
  '#ffffff',
  '#000000',
  '#f59e0b',
  '#f43f5e',
  '#38bdf8',
  '#a78bfa',
  '#10b981',
];

export const STORY_BG_COLORS: (string | null)[] = [
  null,
  'rgba(0,0,0,0.55)',
  'rgba(255,255,255,0.85)',
  'rgba(245,158,11,0.9)',
  'rgba(244,63,94,0.85)',
];

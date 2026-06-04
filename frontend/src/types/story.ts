export type StoryLayoutId =
  | 'single'
  | 'split-v'
  | 'split-h'
  | 'duo-top'
  | 'duo-side'
  | 'trio'
  | 'grid-3'
  | 'feature-left'
  | 'feature-right'
  | 'pyramid'
  | 'banner-3'
  | 'stripes-3'
  | 'grid-4'
  | 'feature-top-4'
  | 'mosaic-4'
  | 'column-4'
  | 'stripes-4'
  | 'grid-5'
  | 'panorama-5'
  | 'stripes-5'
  | 'grid-6'
  | 'grid-6-wide'
  | 'collage-6';

export type StoryFontId = 'classic' | 'modern' | 'typewriter' | 'neon' | 'script';

export interface StoryTextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontId: StoryFontId;
  color: string;
  bgColor: string | null;
  align: 'left' | 'center' | 'right';
}

export interface StoredStory {
  id: string;
  user: string;
  avatar: string;
  location: string;
  coverImage: string;
  layoutId: StoryLayoutId;
  images: string[];
  texts: StoryTextLayer[];
  createdAt: number;
}

export interface FeedStoryItem {
  id: string;
  user: string;
  avatar: string;
  location: string;
  image: string;
  payload?: StoredStory;
}

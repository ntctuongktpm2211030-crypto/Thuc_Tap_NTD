import type { FeedStoryItem, StoredStory } from '../types/story';

const KEY = 'smarttravel_user_stories';

export function loadUserStories(): StoredStory[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserStory(story: StoredStory) {
  const list = loadUserStories();
  list.unshift(story);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
}

export function storedToFeedItem(s: StoredStory): FeedStoryItem {
  return {
    id: s.id,
    user: s.user,
    avatar: s.avatar,
    location: s.location,
    image: s.coverImage,
    payload: s,
  };
}

export function mergeStories(mock: FeedStoryItem[]): FeedStoryItem[] {
  const user = loadUserStories().map(storedToFeedItem);
  const mockIds = new Set(mock.map(m => m.id));
  const onlyUser = user.filter(u => !mockIds.has(u.id));
  return [...onlyUser, ...mock];
}

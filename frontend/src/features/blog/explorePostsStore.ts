import { INITIAL_EXPLORE_POSTS, type ExplorePost } from './exploreBlogData';

const STORAGE_KEY = 'smarttravel_explore_posts_v2';

function loadStored(): ExplorePost[] | null {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return null;
}

function saveStored(_posts: ExplorePost[]) {
  // Disable stale local storage cache to ensure 100% database synchronization
}

let cache: ExplorePost[] = [...INITIAL_EXPLORE_POSTS];

export function getExplorePosts(): ExplorePost[] {
  return cache;
}

export function setExplorePosts(posts: ExplorePost[]) {
  cache = posts;
  saveStored(posts);
}

export function getExplorePostById(id: string): ExplorePost | undefined {
  return cache.find(p => p.id === id);
}

export function updateExplorePost(id: string, patch: Partial<ExplorePost>) {
  cache = cache.map(p => (p.id === id ? { ...p, ...patch } : p));
  saveStored(cache);
}

export function patchExplorePostEngagement(
  id: string,
  patch: Partial<Pick<ExplorePost, 'liked' | 'likes' | 'bookmarked' | 'comments'>>,
) {
  updateExplorePost(id, patch);
}

export function resetExplorePosts(): ExplorePost[] {
  cache = [...INITIAL_EXPLORE_POSTS];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return cache;
}

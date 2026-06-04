import { postsService } from '../services/smartTravel.service';
import { toApiPostId } from './postIds';

export type LikeEngagement = { liked: boolean; likes: number };
export type BookmarkEngagement = { bookmarked: boolean };

export function applyLocalLikeToggle(current: LikeEngagement): LikeEngagement {
  const liked = !current.liked;
  return {
    liked,
    likes: liked ? current.likes + 1 : Math.max(0, current.likes - 1),
  };
}

export function applyLocalBookmarkToggle(current: BookmarkEngagement): BookmarkEngagement {
  return { bookmarked: !current.bookmarked };
}

/** Like: gọi API nếu có id thật, không thì chỉ cập nhật local (demo) */
export async function syncToggleLike(
  postId: string,
  current: LikeEngagement,
): Promise<LikeEngagement> {
  const apiId = toApiPostId(postId);
  if (!apiId) return applyLocalLikeToggle(current);

  const res = await postsService.toggleLike(apiId);
  let likes = current.likes;
  if (res.liked && !current.liked) likes = current.likes + 1;
  else if (!res.liked && current.liked) likes = Math.max(0, current.likes - 1);
  return { liked: res.liked, likes };
}

export async function syncToggleBookmark(
  postId: string,
  current: BookmarkEngagement,
): Promise<BookmarkEngagement> {
  const apiId = toApiPostId(postId);
  if (!apiId) return applyLocalBookmarkToggle(current);

  const res = await postsService.toggleBookmark(apiId);
  return { bookmarked: res.bookmarked };
}

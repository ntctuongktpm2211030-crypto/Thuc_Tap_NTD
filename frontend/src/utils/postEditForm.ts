import type { Post } from '../services/smartTravel.service';
import type { FeedPost } from './feedUtils';

export interface EditPostFormState {
  content: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  displayType: string;
}

export function parseFeedPostForEdit(post: FeedPost): EditPostFormState {
  let bodyText = '';
  let destName = '';
  let lat: number | null = null;
  let lng: number | null = null;
  let photosList: string[] = [];

  if (post.journeyPayload) {
    try {
      const payload = JSON.parse(post.journeyPayload);
      bodyText = payload.body || payload.content || '';
      destName = payload.destination || payload.location?.name || '';
      lat = payload.location?.lat ?? null;
      lng = payload.location?.lng ?? null;
    } catch {
      /* ignore */
    }
  }

  if (!bodyText) {
    if (post.displayType === 'social') {
      bodyText = post.content || '';
    } else {
      bodyText = post.body || post.excerpt || '';
    }
  }

  if (!destName) {
    destName = post.destination ? post.destination.replace(/^📍\s*/, '') : '';
  }

  if (post.displayType === 'social') {
    photosList = post.images ? [...post.images] : [];
  } else if ('image' in post && post.image) {
    photosList = [post.image];
  }

  return {
    content: bodyText,
    location: destName,
    latitude: lat,
    longitude: lng,
    photos: photosList,
    displayType: post.displayType || 'social',
  };
}

export function parseApiPostForEdit(post: Post): EditPostFormState {
  const media = post.mediaUrls?.filter(Boolean) ?? [];
  let displayType = 'social';

  try {
    const payload = JSON.parse(post.content);
    displayType = (payload.displayType as string) || 'social';
    const destName =
      (payload.destination as string) ||
      ((payload.location as { name?: string })?.name) ||
      'Việt Nam';
    const bodyText =
      (payload.body as string) ||
      (payload.content as string) ||
      '';
    const loc = payload.location as { lat?: number; lng?: number } | undefined;

    return {
      content: bodyText.trim() || post.content.trim(),
      location: destName,
      latitude: loc?.lat ?? null,
      longitude: loc?.lng ?? null,
      photos: media.length > 0 ? [...media] : [],
      displayType,
    };
  } catch {
    return {
      content: post.content.trim(),
      location: 'Việt Nam',
      latitude: null,
      longitude: null,
      photos: media,
      displayType: 'social',
    };
  }
}

export function buildPostUpdateContent(state: EditPostFormState): string {
  const destLabel = state.location.trim() || 'Việt Nam';
  return JSON.stringify({
    type: 'journey',
    displayType: state.displayType || 'social',
    body: state.content.trim(),
    excerpt: state.content.trim(),
    destination: destLabel,
    location: { name: destLabel, lat: state.latitude, lng: state.longitude },
  });
}

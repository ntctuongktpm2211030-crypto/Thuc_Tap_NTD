import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLang } from '../../contexts/LanguageContext';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import type { RootState } from '../../store';
import {
  Heart, MessageCircle, Bookmark,
  MapPin, Clock, BookOpen, Plus, TrendingUp, Users, Sparkles,
  Flame, Globe,
} from 'lucide-react';
import { NAV_ICONS, FILTER_ICONS } from '../../config/modernIcons';
import { FEED_POSTS, COMPANION_CANDIDATES, MOCK_STORIES } from '../../data/feedData';
import type { FeedStoryItem, StoredStory } from '../../types/story';
import { mergeStories, storedToFeedItem } from '../../utils/storyStorage';
import StoryCreatorModal from '../../components/stories/StoryCreatorModal';
import StoryViewerModal from '../../components/stories/StoryViewerModal';
import QuickComposeModal from '../../components/feed/QuickComposeModal';
import {
  computeHotDestinationsThisMonth,
  sortCompanionsByFollowers,
  partitionFeed,
  getPostPreviewText,
  isPostTruncatedOnFeed,
  type FeedPost,
  type FeedPostBase,
  type HeroFeedPost,
  type MagazineFeedPost,
  type SocialFeedPost,
  type HotDestination,
  type CompanionSuggestion,
} from '../../utils/feedUtils';
import { loadUserProfileCache } from '../../utils/feedPostStorage';
import { syncToggleBookmark, syncToggleLike } from '../../utils/postEngagement';
import { postsService, socialService } from '../../services/smartTravel.service';
import { mapApiPostsToFeed, mapApiPostToFeedPost } from '../../utils/apiPostMapper';
import { loadUserStories } from '../../utils/storyStorage';
import PostDetailModal from '../../components/feed/PostDetailModal';
import FeedCardShell from '../../components/feed/FeedCardShell';
import PostMenuDropdown from '../../components/feed/PostMenuDropdown';
import AuthorFollowButton from '../../components/feed/AuthorFollowButton';
import LikersModal from '../../components/feed/LikersModal';
import PostEngagementBlock from '../../components/feed/PostEngagementBlock';
import { truncateWithEllipsis } from '../../utils/truncateText';

const stopCardClick = (e: React.MouseEvent) => e.stopPropagation();

type EngagementPatch = Partial<Pick<FeedPostBase, 'isLiked' | 'likes' | 'isBookmarked'>>;

type CardSocialProps = {
  currentUserId?: string;
  followingIds: Set<string>;
  onFollowChange: (authorId: string, following: boolean) => void;
  requireAuth: (returnPath: string) => boolean;
  onEngagementChange?: (postId: string, patch: EngagementPatch) => void;
};

// ──────────────────────────────────────────────────────────
// HERO CARD
// ──────────────────────────────────────────────────────────
const HeroCard = ({
  post,
  onOpen,
  readMoreLabel,
  onPostDeleted,
  onPostUpdated,
  currentUserId,
  followingIds,
  onFollowChange,
  requireAuth,
  onEngagementChange,
}: {
  post: HeroFeedPost;
  onOpen: () => void;
  readMoreLabel: string;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: any) => void;
} & CardSocialProps) => {
  const [liked, setLiked] = useState(!!post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(!!post.isBookmarked);
  const [likersOpen, setLikersOpen] = useState(false);
  const { preview } = getPostPreviewText(post);
  const showReadMore = isPostTruncatedOnFeed(post);

  useEffect(() => {
    setLiked(!!post.isLiked);
    setLikeCount(post.likes);
    setSaved(!!post.isBookmarked);
  }, [post.id, post.isLiked, post.likes, post.isBookmarked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;

    const prevLiked = liked;
    const prevLikeCount = likeCount;
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setLiked(newLiked);
    setLikeCount(newLikeCount);
    onEngagementChange?.(post.id, { isLiked: newLiked, likes: newLikeCount });

    try {
      const next = await syncToggleLike(post.id, { liked: prevLiked, likes: prevLikeCount });
      setLiked(next.liked);
      setLikeCount(next.likes);
      onEngagementChange?.(post.id, { isLiked: next.liked, likes: next.likes });
    } catch (err) {
      console.error(err);
      setLiked(prevLiked);
      setLikeCount(prevLikeCount);
      onEngagementChange?.(post.id, { isLiked: prevLiked, likes: prevLikeCount });
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;

    const prevSaved = saved;
    const newSaved = !saved;

    setSaved(newSaved);
    onEngagementChange?.(post.id, { isBookmarked: newSaved });

    try {
      const next = await syncToggleBookmark(post.id, { bookmarked: prevSaved });
      setSaved(next.bookmarked);
      onEngagementChange?.(post.id, { isBookmarked: next.bookmarked });
    } catch (err) {
      console.error(err);
      setSaved(prevSaved);
      onEngagementChange?.(post.id, { isBookmarked: prevSaved });
    }
  };

  return (
    <FeedCardShell
      onOpen={onOpen}
      showReadMore={showReadMore}
      readMoreLabel={readMoreLabel}
      className="card-hero group animate-fade-in"
    >
      <img src={post.image} alt={post.headline} className="card-hero-image" loading="lazy" />
      <div className="card-hero-overlay" />

      {/* Category pill top-left */}
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="badge-category text-[11px] shadow-lg">{post.category}</span>
        <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
          <MapPin size={11} className="text-blue-500" /> {post.destination.replace(/^📍\s*/, '')}
        </span>
      </div>

      {/* Top-right actions */}
      <div className="absolute top-4 right-4 flex gap-2 z-10" onClick={stopCardClick}>
        <PostMenuDropdown
          post={post}
          onPostDeleted={onPostDeleted}
          onPostUpdated={onPostUpdated}
        />
      </div>

      <div className="card-hero-content">
        <h2 className="font-editorial text-white font-bold leading-tight mb-3 text-balance"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}>
          {post.headline}
        </h2>
        <p className="text-sm text-gray-300/90 mb-4 line-clamp-2 max-w-2xl">{preview}</p>

        <div className="flex items-center justify-between flex-wrap gap-3" onClick={stopCardClick}>
          <div className="flex items-center gap-2.5">
            <img src={post.author.avatar} alt={post.author.name} className="w-9 h-9 rounded-full border-2 border-white/40 object-cover" />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-white">{post.author.name}</span>
                <AuthorFollowButton
                  authorId={post.authorId}
                  currentUserId={currentUserId}
                  isFollowing={post.authorId ? followingIds.has(post.authorId) : true}
                  onFollowChange={onFollowChange}
                  requireAuth={requireAuth}
                />
                {post.author.verified && <span className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">✓</span>}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Clock size={10} />{post.date}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><BookOpen size={10} />{post.readTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5" onClick={stopCardClick}>
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border text-xs font-bold transition-all ${
                liked
                  ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Heart size={13} className={liked ? 'fill-current text-rose-500' : 'text-rose-500'} />
              <span>{likeCount.toLocaleString()}</span>
            </button>
            <button
              type="button"
              onClick={onOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              <MessageCircle size={13} className="text-blue-500" />
              <span>{post.comments}</span>
            </button>
            <button
              type="button"
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border text-xs font-bold transition-all ${
                saved
                  ? 'bg-amber-50 border border-amber-200 text-amber-500 shadow-sm'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Bookmark size={13} className={saved ? 'fill-current text-amber-500' : 'text-amber-500'} />
              <span>Lưu</span>
            </button>
          </div>
        </div>
      </div>
      <LikersModal postId={likersOpen ? post.id : null} likeCount={likeCount} onClose={() => setLikersOpen(false)} />
    </FeedCardShell>
  );
};

// ──────────────────────────────────────────────────────────
// MAGAZINE CARD
// ──────────────────────────────────────────────────────────
const MagazineCard = ({
  post,
  onOpen,
  readMoreLabel,
  onPostDeleted,
  onPostUpdated,
  currentUserId,
  followingIds,
  onFollowChange,
  requireAuth,
  onEngagementChange,
}: {
  post: MagazineFeedPost;
  onOpen: () => void;
  readMoreLabel: string;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: any) => void;
} & CardSocialProps) => {
  const [liked, setLiked] = useState(!!post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(!!post.isBookmarked);
  const [likersOpen, setLikersOpen] = useState(false);
  const { preview } = getPostPreviewText(post);
  const showReadMore = isPostTruncatedOnFeed(post);

  useEffect(() => {
    setLiked(!!post.isLiked);
    setLikeCount(post.likes);
    setSaved(!!post.isBookmarked);
  }, [post.id, post.isLiked, post.likes, post.isBookmarked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;

    const prevLiked = liked;
    const prevLikeCount = likeCount;
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setLiked(newLiked);
    setLikeCount(newLikeCount);
    onEngagementChange?.(post.id, { isLiked: newLiked, likes: newLikeCount });

    try {
      const next = await syncToggleLike(post.id, { liked: prevLiked, likes: prevLikeCount });
      setLiked(next.liked);
      setLikeCount(next.likes);
      onEngagementChange?.(post.id, { isLiked: next.liked, likes: next.likes });
    } catch (err) {
      console.error(err);
      setLiked(prevLiked);
      setLikeCount(prevLikeCount);
      onEngagementChange?.(post.id, { isLiked: prevLiked, likes: prevLikeCount });
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;

    const prevSaved = saved;
    const newSaved = !saved;

    setSaved(newSaved);
    onEngagementChange?.(post.id, { isBookmarked: newSaved });

    try {
      const next = await syncToggleBookmark(post.id, { bookmarked: prevSaved });
      setSaved(next.bookmarked);
      onEngagementChange?.(post.id, { isBookmarked: next.bookmarked });
    } catch (err) {
      console.error(err);
      setSaved(prevSaved);
      onEngagementChange?.(post.id, { isBookmarked: prevSaved });
    }
  };

  return (
    <div className="card-medium group animate-fade-in relative">
      <FeedCardShell
        onOpen={onOpen}
        showReadMore={showReadMore}
        readMoreLabel={readMoreLabel}
        className="block"
      >
      <div className="overflow-hidden relative">
        <img src={post.image} alt={post.headline} className="card-medium-image" loading="lazy" />
        {/* Category overlay on image */}
        <div className="absolute top-3 left-3">
          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-lg ${post.categoryColor || 'bg-blue-600'}`}>
            {post.category}
          </span>
        </div>
        
        {/* Dropdown menu overlay top-right */}
        <div className="absolute top-3 right-3 z-10" onClick={stopCardClick}>
          <PostMenuDropdown
            post={post}
            onPostDeleted={onPostDeleted}
            onPostUpdated={onPostUpdated}
          />
        </div>

        {/* Gradient fade to card body */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-surface)] to-transparent" />
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
          <MapPin size={10} className="text-[var(--gold)]" /> {post.destination}
        </p>
        <h3 className="font-editorial text-[var(--text-primary)] font-bold leading-snug group-hover:text-[var(--gold)] transition-colors text-balance truncate-2"
          style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)' }}>
          {post.headline}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">{preview}</p>

        {/* Author row */}
        <div className="flex items-center gap-2 pt-1">
          <img src={post.author.avatar} alt={post.author.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-transparent bg-gradient-to-br from-[var(--gold)] to-violet-500 p-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">{post.author.name}</span>
              <AuthorFollowButton
                authorId={post.authorId}
                currentUserId={currentUserId}
                isFollowing={post.authorId ? followingIds.has(post.authorId) : true}
                onFollowChange={onFollowChange}
                requireAuth={requireAuth}
              />
              {post.author.verified && <span className="w-3.5 h-3.5 bg-sky-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0">✓</span>}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Clock size={9} /> {post.date} · {post.readTime}
            </div>
          </div>
        </div>
      </div>
      </FeedCardShell>

      <div className="border-t border-[var(--border-subtle)]" onClick={stopCardClick}>
        <PostEngagementBlock
          postId={post.id}
          likeCount={likeCount}
          commentCount={post.comments}
          liked={liked}
          saved={saved}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onOpenDetail={onOpen}
          onOpenLikers={() => likeCount > 0 && setLikersOpen(true)}
        />
      </div>
      <LikersModal postId={likersOpen ? post.id : null} likeCount={likeCount} onClose={() => setLikersOpen(false)} />
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// SOCIAL POST CARD
// ──────────────────────────────────────────────────────────
const SocialPostCard = ({
  post,
  onOpen,
  readMoreLabel,
  onPostDeleted,
  onPostUpdated,
  currentUserId,
  followingIds,
  onFollowChange,
  requireAuth,
  onEngagementChange,
}: {
  post: SocialFeedPost;
  onOpen: () => void;
  readMoreLabel: string;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: any) => void;
} & CardSocialProps) => {
  const [liked, setLiked] = useState(!!post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(!!post.isBookmarked);
  const [commentCount] = useState(post.comments);
  const [likersOpen, setLikersOpen] = useState(false);
  const { preview } = getPostPreviewText(post);
  const showReadMore = isPostTruncatedOnFeed(post);

  useEffect(() => {
    setLiked(!!post.isLiked);
    setLikeCount(post.likes);
    setSaved(!!post.isBookmarked);
  }, [post.id, post.isLiked, post.likes, post.isBookmarked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;

    const prevLiked = liked;
    const prevLikeCount = likeCount;
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setLiked(newLiked);
    setLikeCount(newLikeCount);
    onEngagementChange?.(post.id, { isLiked: newLiked, likes: newLikeCount });

    try {
      const next = await syncToggleLike(post.id, { liked: prevLiked, likes: prevLikeCount });
      setLiked(next.liked);
      setLikeCount(next.likes);
      onEngagementChange?.(post.id, { isLiked: next.liked, likes: next.likes });
    } catch (err) {
      console.error(err);
      setLiked(prevLiked);
      setLikeCount(prevLikeCount);
      onEngagementChange?.(post.id, { isLiked: prevLiked, likes: prevLikeCount });
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth('/')) return;

    const prevSaved = saved;
    const newSaved = !saved;

    setSaved(newSaved);
    onEngagementChange?.(post.id, { isBookmarked: newSaved });

    try {
      const next = await syncToggleBookmark(post.id, { bookmarked: prevSaved });
      setSaved(next.bookmarked);
      onEngagementChange?.(post.id, { isBookmarked: next.bookmarked });
    } catch (err) {
      console.error(err);
      setSaved(prevSaved);
      onEngagementChange?.(post.id, { isBookmarked: prevSaved });
    }
  };

  return (
    <div className="post-card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3" onClick={stopCardClick}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={post.author.avatar} alt={post.author.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[var(--border-normal)] ring-offset-2 ring-offset-[var(--bg-surface)]" />
            {post.author.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center border border-[var(--bg-surface)]">
                <span className="text-[8px] font-bold text-white">✓</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[var(--text-primary)]">{post.author.name}</span>
              <AuthorFollowButton
                authorId={post.authorId}
                currentUserId={currentUserId}
                isFollowing={post.authorId ? followingIds.has(post.authorId) : true}
                onFollowChange={onFollowChange}
                requireAuth={requireAuth}
              />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 min-w-0 max-w-[min(100%,14rem)] sm:max-w-xs">
              <Clock size={10} className="flex-shrink-0" />
              <span className="flex-shrink-0 whitespace-nowrap">{post.date}</span>
              <span className="flex-shrink-0">·</span>
              <MapPin size={10} className="text-[var(--gold)] flex-shrink-0" />
              <span
                className="text-[var(--gold)] font-medium truncate min-w-0"
                title={post.destination.replace(/^📍\s*/, '')}
              >
                {truncateWithEllipsis(post.destination.replace(/^📍\s*/, ''), 26)}
              </span>
            </div>
          </div>
        </div>
        <PostMenuDropdown
          post={post}
          onPostDeleted={onPostDeleted}
          onPostUpdated={onPostUpdated}
        />
      </div>

      <FeedCardShell
        onOpen={onOpen}
        showReadMore={showReadMore}
        readMoreLabel={readMoreLabel}
      >
      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">{preview}</p>
      </div>

      {/* Photo grid */}
      {(post.images?.length ?? 0) > 0 && (
        <div className={`${(post.images?.length ?? 0) === 1 ? '' : 'grid grid-cols-2 gap-0.5'} overflow-hidden mx-0`}>
          {post.images!.map((img: string, i: number) => (
            <div key={i} className="overflow-hidden relative group">
              <img src={img} alt="" loading="lazy"
                className={`w-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500 ${(post.images?.length ?? 0) === 1 ? 'max-h-72 sm:max-h-96' : 'h-40 sm:h-52'}`} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      )}
      </FeedCardShell>

      <div onClick={stopCardClick}>
        <PostEngagementBlock
          postId={post.id}
          likeCount={likeCount}
          commentCount={commentCount}
          liked={liked}
          saved={saved}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onOpenDetail={onOpen}
          onOpenLikers={() => likeCount > 0 && setLikersOpen(true)}
        />
      </div>

      <LikersModal postId={likersOpen ? post.id : null} likeCount={likeCount} onClose={() => setLikersOpen(false)} />
    </div>
  );
};


function UserAvatar({ user, size = 'md' }: { user: { fullName?: string; avatarUrl?: string } | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-sm';
  const avatarUrl = user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  return <img src={avatarUrl} alt="" className={`${sz.split(' ').slice(0, 2).join(' ')} rounded-full object-cover ring-2 ring-[var(--border-normal)] flex-shrink-0`} />;
}

// ──────────────────────────────────────────────────────────
// COMPOSE BOX
// ──────────────────────────────────────────────────────────
const ComposeBox = ({ onOpenCompose }: { onOpenCompose: () => void }) => {
  const navigate = useNavigate();
  const { t } = useLang();
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const user = useSelector((s: RootState) => s.auth.user);

  const goCreateJourney = () => {
    if (!requireAuth('/journeys/create')) return;
    navigate('/journeys/create');
  };

  const handleComposeOpen = () => {
    if (!requireAuth('/')) return;
    onOpenCompose();
  };

  return (
    <div className="compose-box">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="sm" />
        <button type="button" onClick={handleComposeOpen}
          className="flex-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 rounded-full px-5 py-3 text-left text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all">
          {isAuthenticated ? t('feed.composePlaceholder') : t('auth.loginToPost')}
        </button>
        <button onClick={goCreateJourney}
          className="hidden sm:flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/25 transition-all whitespace-nowrap">
          <Sparkles size={14} /> {t('feed.shareJourney')}
        </button>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// LEFT SIDEBAR
// ──────────────────────────────────────────────────────────
const LeftSidebar = ({ myPostCount }: { myPostCount: number }) => {
  const { t } = useLang();
  const user = useSelector((s: RootState) => s.auth.user);
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const profileCache = loadUserProfileCache();
  const postCount = myPostCount;
  const storyCount = loadUserStories().length;

  const displayName = isAuthenticated && user?.fullName ? user.fullName : t('auth.loginToPost');
  const locationLabel = profileCache.location || (isAuthenticated ? 'Chưa cập nhật vị trí' : 'Đăng nhập để xem hồ sơ');

  const navLinks = [
    { icon: NAV_ICONS.feed, label: t('nav.quick.feed'), href: '/', color: 'text-amber-400' },
    { icon: NAV_ICONS.explore, label: t('nav.quick.explore'), href: '/explore', color: 'text-violet-400' },
    { icon: NAV_ICONS.map, label: t('nav.quick.map'), href: '/map', color: 'text-teal-400' },
    { icon: NAV_ICONS.trips, label: t('nav.quick.aiPlanner'), href: '/trips', color: 'text-sky-400' },
    { icon: NAV_ICONS.analytics, label: t('nav.quick.analytics'), href: '/analytics', color: 'text-indigo-400' },
    { icon: NAV_ICONS.saved, label: t('nav.quick.saved'), href: '/profile/saved', color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="profile-mini animate-fade-in">
        <div className="profile-mini-cover">
          {/* Animated orbs */}
          <div className="absolute top-2 right-4 w-8 h-8 rounded-full bg-[var(--gold)]/20 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-4 right-10 w-5 h-5 rounded-full bg-violet-500/20 animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="profile-mini-avatar">
          <img src={user?.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} alt="" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="pt-9 pb-4 px-4">
          <h4 className="font-bold text-[var(--text-primary)] truncate">{displayName}</h4>
          <p className="text-[11px] text-[var(--text-muted)] mb-3 flex items-center gap-1 truncate">
            <MapPin size={10} className="text-[var(--gold)] flex-shrink-0" /> {locationLabel}
          </p>
          <div className="grid grid-cols-3 gap-0 divide-x divide-[var(--border-subtle)] text-center py-2 bg-[var(--bg-elevated)] rounded-xl">
            {[String(postCount), String(storyCount), '0'].map((n, i) => (
              <div key={i} className="py-1">
                <div className="text-sm font-bold text-[var(--text-primary)]">{n}</div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {[t('sidebar.profile.posts'), t('sidebar.profile.trips'), t('sidebar.profile.followers')][i]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="sidebar-section space-y-0.5">
        {navLinks.map(({ icon: Icon, label, href, color }) => (
          <Link key={label} to={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all group cursor-pointer">
            <span className={`w-6 flex justify-center transition-transform group-hover:scale-110 ${color}`}><Icon size={17} strokeWidth={2} /></span>
            <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
          </Link>
        ))}
      </div>

      {/* Stats card */}
      <div className="feature-strip text-center space-y-2 animate-fade-in">
        <div className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest">Cộng đồng</div>
        <div className="grid grid-cols-3 gap-2">
          {[['10K+', 'Thành viên', 'text-amber-400'], ['500+', 'Điểm đến', 'text-teal-400'], ['50K+', 'Bài viết', 'text-violet-400']].map(([n, l, c]) => (
            <div key={l} className="bg-[var(--bg-elevated)] rounded-xl p-2">
              <div className={`text-sm font-extrabold ${c}`}>{n}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// RIGHT SIDEBAR
// ──────────────────────────────────────────────────────────
const RightSidebar = ({
  hotDestinations,
  companions,
}: {
  hotDestinations: HotDestination[];
  companions: CompanionSuggestion[];
}) => {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      {/* Hot destinations — đếm bài đăng trong tháng hiện tại */}
      <div className="sidebar-section animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-[var(--gold)]" />
          <p className="sidebar-title mb-0">{t('sidebar.trending')}</p>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mb-3 pl-6">{t('sidebar.trending.month')}</p>
        <div className="space-y-2">
          {hotDestinations.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-2">—</p>
          ) : hotDestinations.map((dest, i) => (
            <div key={dest.name}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
              <span className="text-xs font-extrabold text-[var(--text-muted)] w-4 flex-shrink-0">{i + 1}</span>
              <div className="relative flex-shrink-0">
                <img src={dest.image} alt={dest.name}
                  className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                {dest.hot && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                    <Flame size={9} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--gold)] transition-colors">{dest.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Globe size={9} /> {dest.country} · {dest.postCount} {t('sidebar.postsThisMonth')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gợi ý bạn đồng hành — sắp theo lượt theo dõi */}
      <div className="sidebar-section animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-[var(--gold)]" />
          <p className="sidebar-title mb-0">{t('sidebar.suggested')}</p>
        </div>
        <div className="space-y-3">
          {companions.map(traveler => (
            <div key={traveler.id} className="flex items-center gap-3 group">
              <div className="relative">
                <img src={traveler.avatar} alt={traveler.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border-normal)] group-hover:ring-[var(--gold)] transition-all" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{traveler.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {traveler.handle} · {traveler.followersLabel} {t('sidebar.followers')}
                </p>
              </div>
              <button type="button" className="btn-follow text-[10px] px-3 py-1.5 flex-shrink-0">
                {t('sidebar.follow')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending tags */}
      <div className="sidebar-section animate-fade-in">
        <p className="sidebar-title">{t('sidebar.topics')}</p>
        <div className="flex flex-wrap gap-1.5">
          {['#HaGiang', '#SapaLoop', '#HoiAn', '#StreetFood', '#BudgetTravel', '#VietnamVibes', '#OffBeatAsia', '#NightMarket'].map((tag) => {
            return (
              <span key={tag}
                className="badge-destination badge-gold cursor-pointer hover:scale-105 transition-transform text-[11px] px-2.5 py-1 rounded-full">
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────
function renderFeedPost(
  post: MagazineFeedPost | SocialFeedPost,
  onOpen: (p: FeedPost) => void,
  readMoreLabel: string,
  socialProps: CardSocialProps,
  onPostDeleted?: (postId: string) => void,
  onPostUpdated?: (updatedPost: any) => void,
) {
  if (post.displayType === 'magazine') {
    return (
      <MagazineCard
        key={post.id}
        post={post}
        onOpen={() => onOpen(post)}
        readMoreLabel={readMoreLabel}
        onPostDeleted={onPostDeleted}
        onPostUpdated={onPostUpdated}
        {...socialProps}
      />
    );
  }
  return (
    <SocialPostCard
      key={post.id}
      post={post}
      onOpen={() => onOpen(post)}
      readMoreLabel={readMoreLabel}
      onPostDeleted={onPostDeleted}
      onPostUpdated={onPostUpdated}
      {...socialProps}
    />
  );
}

export default function SocialFeedPage() {
  const { t } = useLang();
  const { requireAuth } = useRequireAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [activeFilter, setActiveFilter] = useState('all');
  const [detailPost, setDetailPost] = useState<FeedPost | null>(null);
  const [stories, setStories] = useState<FeedStoryItem[]>(() => mergeStories(MOCK_STORIES as FeedStoryItem[]));
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);
  const [viewStory, setViewStory] = useState<FeedStoryItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [apiPosts, setApiPosts] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [sidebarTick, setSidebarTick] = useState(0);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const openPost = (post: FeedPost) => setDetailPost(post);
  const closePost = () => setDetailPost(null);
  const readMoreLabel = t('feed.readMore');

  const storyLabels = {
    title: t('story.title'),
    close: t('story.close'),
    cancel: t('story.cancel'),
    next: t('story.next'),
    photosHint: t('story.photosHint'),
    pickPhotos: t('story.pickPhotos'),
    pickPhotosSub: t('story.pickPhotosSub'),
    addMore: t('story.addMore'),
    needPhoto: t('story.needPhoto'),
    layoutHint: t('story.layoutHint'),
    layoutFallback: t('story.layoutFallback'),
    nextEdit: t('story.nextEdit'),
    addText: t('story.addText'),
    locationPlaceholder: t('story.locationPlaceholder'),
    locationLabel: t('story.locationLabel'),
    publish: t('story.publish'),
    publishing: t('story.publishing'),
  };

  const loadFeedFromApi = async () => {
    setFeedLoading(true);
    setFeedError('');
    try {
      const { posts } = await postsService.feed({ page: 1, limit: 50 });
      setApiPosts(mapApiPostsToFeed(posts));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không tải được bài đăng từ máy chủ';
      setFeedError(msg);
      setApiPosts([]);
    } finally {
      setFeedLoading(false);
    }
  };

  const handlePostPublished = () => {
    void loadFeedFromApi();
    setSidebarTick(n => n + 1);
  };

  const handleFollowChange = (authorId: string, following: boolean) => {
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (following) next.add(authorId);
      else next.delete(authorId);
      return next;
    });
  };

  const handlePostDeleted = (deletedId: string) => {
    setApiPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  const handlePostUpdated = (updatedPost: any) => {
    const mapped = mapApiPostToFeedPost(updatedPost);
    if (!mapped) return;
    setApiPosts(prev => prev.map(p => p.id === mapped.id ? mapped : p));
  };

  const handleEngagementChange = (postId: string, patch: EngagementPatch) => {
    setApiPosts(prev => prev.map(p => (p.id === postId ? { ...p, ...patch } : p)));
  };

  const cardSocialProps: CardSocialProps = {
    currentUserId: user?.id,
    followingIds,
    onFollowChange: handleFollowChange,
    requireAuth,
    onEngagementChange: handleEngagementChange,
  };

  const composeLabels = {
    title: t('feed.compose.title'),
    placeholder: t('feed.composePlaceholder'),
    addPhoto: t('feed.compose.photo'),
    location: t('feed.compose.location'),
    locationHint: t('feed.compose.locationHint'),
    showMap: t('feed.compose.showMap'),
    hideMap: t('feed.compose.hideMap'),
    publish: t('feed.compose.publish'),
    publishing: t('feed.compose.publishing'),
    cancel: t('feed.compose.cancel'),
    styleHint: t('feed.compose.styleHint'),
    needContent: t('feed.compose.needContent'),
    needPhoto: t('feed.compose.needPhoto'),
  };

  const openStoryCreator = () => {
    if (!requireAuth('/')) return;
    setStoryCreatorOpen(true);
  };

  const handleStoryPublished = (s: StoredStory) => {
    setStories(prev => [storedToFeedItem(s), ...prev]);
  };

  const storyBarName = (story: FeedStoryItem) => {
    if (user?.fullName && story.user === user.fullName) {
      return user.fullName.split(' ')[0] || 'Bạn';
    }
    return story.user.split(' ')[0];
  };
  useEffect(() => {
    void loadFeedFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.key]);

  useEffect(() => {
    const state = location.state as { refreshFeed?: boolean } | null;
    if (!state?.refreshFeed) return;
    void loadFeedFromApi();
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Automatically open post detail modal if query parameter `postId` is present
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const queryPostId = query.get('postId');
    if (queryPostId) {
      setFeedLoading(true);
      postsService.get(queryPostId)
        .then(apiPost => {
          const feedPost = mapApiPostToFeedPost(apiPost);
          if (feedPost) {
            setDetailPost(feedPost);
          }
          navigate('/', { replace: true });
        })
        .catch(err => {
          console.error('Failed to load query post details:', err);
        })
        .finally(() => {
          setFeedLoading(false);
        });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!user?.id) {
      setFollowingIds(new Set());
      return;
    }
    socialService
      .getFollowing(user.id)
      .then((list: { id: string }[]) => setFollowingIds(new Set(list.map(u => u.id))))
      .catch(() => setFollowingIds(new Set()));
  }, [user?.id]);

  const allPosts = useMemo(() => {
    if (apiPosts.length > 0) {
      return apiPosts;
    }
    return FEED_POSTS;
  }, [apiPosts]);

  const myPostCount = useMemo(() => {
    if (!user?.id) return 0;
    return apiPosts.filter(p => p.authorId === user.id).length;
  }, [apiPosts, user?.id]);

  const { hero, feed } = useMemo(() => partitionFeed(allPosts), [allPosts]);
  const hotDestinations = useMemo(() => computeHotDestinationsThisMonth(allPosts), [allPosts]);
  const companions = useMemo(() => sortCompanionsByFollowers(COMPANION_CANDIDATES), []);

  const filters = [
    { key: 'all',       label: t('feed.filter.all'),       icon: FILTER_ICONS.all },
    { key: 'following', label: t('feed.filter.following'), icon: FILTER_ICONS.following },
    { key: 'adventure', label: t('feed.filter.adventure'), icon: FILTER_ICONS.adventure },
    { key: 'food',      label: t('feed.filter.food'),      icon: FILTER_ICONS.food },
    { key: 'luxury',    label: t('feed.filter.luxury'),    icon: FILTER_ICONS.luxury },
  ];

  return (
    <div className="container-wide py-4 sm:py-6">
      <PostDetailModal
        post={detailPost}
        onClose={closePost}
        onPostUpdated={(postId, likesCount, commentsCount, isLiked) => {
          setApiPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: likesCount, comments: commentsCount, isLiked } : p));
        }}
        labels={{
          close: t('feed.close'),
          readTime: '',
          likes: t('feed.likes'),
          comments: t('feed.commentsCount'),
        }}
      />
      <StoryCreatorModal
        open={storyCreatorOpen}
        onClose={() => setStoryCreatorOpen(false)}
        onPublished={handleStoryPublished}
        labels={storyLabels}
      />
      <StoryViewerModal story={viewStory} onClose={() => setViewStory(null)} />
      <QuickComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPublished={handlePostPublished}
        labels={composeLabels}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-4 lg:gap-5">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block" key={sidebarTick}>
          <div className="sticky top-[142px]">
            <LeftSidebar myPostCount={myPostCount} />
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="min-w-0 space-y-4">

          {/* Stories bar */}
          <div className="surface-elevated p-3 sm:p-4">
            <div className="stories-container">
              {/* Add story */}
              <button 
                type="button" 
                onClick={openStoryCreator} 
                className="fb-story-card fb-story-add group relative flex flex-col cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="fb-story-add-image-wrap w-full h-[135px] overflow-hidden bg-slate-100">
                  <img 
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} 
                    alt="current user" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="fb-story-add-btn absolute bottom-[35px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1877F2] border-[3px] border-white flex items-center justify-center text-white z-10 shadow">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div className="fb-story-add-text flex-1 flex items-end justify-center pb-2 bg-white">
                  <span className="text-[11px] font-bold text-slate-700 leading-none">{t('feed.addStory')}</span>
                </div>
              </button>

              {stories.map(story => (
                <button
                  key={story.id}
                  type="button"
                  className="fb-story-card relative flex flex-col cursor-pointer overflow-hidden rounded-xl border border-slate-200 group text-left"
                  onClick={() => setViewStory(story)}
                >
                  <img 
                    src={story.image} 
                    alt={story.user} 
                    loading="lazy" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="fb-story-gradient absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  
                  {/* User Avatar on Top Left */}
                  <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full border-[2.5px] border-[#1877F2] overflow-hidden shadow-md bg-slate-200">
                    <img src={story.avatar} alt={story.user} className="w-full h-full object-cover" />
                  </div>

                  {/* User Name on Bottom Left */}
                  <span className="absolute bottom-2.5 left-2.5 right-2.5 text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
                    {story.user}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Compose box */}
          <ComposeBox onOpenCompose={() => setComposeOpen(true)} />

          {/* Filter tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-2">
              {filters.map(f => {
                const FIcon = f.icon;
                return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeFilter === f.key
                      ? 'bg-gradient-to-r from-[var(--gold)] to-blue-700 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)]'
                  }`}>
                  <FIcon size={14} strokeWidth={2} />
                  {f.label}
                </button>
              );})}
            </div>
          </div>

          {feedLoading && (
            <p className="text-center text-sm text-[var(--text-muted)] py-6">Đang tải bài đăng…</p>
          )}
          {!feedLoading && feedError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {feedError}
              <button type="button" onClick={() => void loadFeedFromApi()} className="ml-2 underline text-rose-200">
                Thử lại
              </button>
            </div>
          )}

          {/* Hero — kiểu Minh Quân (Editor's Pick, ảnh full) */}
          {!feedLoading && hero && (
            <HeroCard
              post={hero}
              onOpen={() => openPost(hero)}
              readMoreLabel={readMoreLabel}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
              {...cardSocialProps}
            />
          )}

          {/* Feed — magazine (Sarah Miller) + social (Linh Trần) */}
          <div className="space-y-4">
            {!feedLoading && feed.length === 0 && !feedError && (
              <p className="text-center text-sm text-[var(--text-muted)] py-8">Chưa có bài đăng — hãy chia sẻ hành trình đầu tiên!</p>
            )}
            {feed.map(post => renderFeedPost(
              post as MagazineFeedPost | SocialFeedPost,
              openPost,
              readMoreLabel,
              cardSocialProps,
              handlePostDeleted,
              handlePostUpdated,
            ))}
          </div>

          {/* Load more */}
          <button className="w-full py-4 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors flex items-center justify-center gap-1">
            {t('feed.loadMore')} ↓
          </button>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-[142px]">
            <RightSidebar hotDestinations={hotDestinations} companions={companions} />
          </div>
        </aside>

      </div>
    </div>
  );
}

import { Router, Response } from 'express';
import prisma, { withDbRetry } from '../../config/db';
import { requireAuth, optionalAuth, AuthRequest } from '../auth/auth.middleware';
import { sendRealTimeNotification } from '../../socket/notification.socket';
import { uploadBase64ToSupabase } from '../../config/supabase';

const router = Router();

// In-memory cache for feed and comments to speed up performance
const feedCache = new Map<string, { data: { posts: any[]; total: number }; expiresAt: number }>();
const commentsCache = new Map<string, { data: any; expiresAt: number }>();

function getCachedFeed(_key: string) {
  // Always return null to guarantee 100% real-time fresh database queries without stale feed caching
  return null;
}

function setCachedFeed(_key: string, _data: any) {
  // No-op
}

function invalidateFeedCache() {
  feedCache.clear();
}

function getCachedComments(postId: string) {
  const cached = commentsCache.get(postId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    commentsCache.delete(postId);
    return null;
  }
  return cached.data;
}

function setCachedComments(postId: string, data: any) {
  commentsCache.set(postId, {
    data,
    expiresAt: Date.now() + 30000 // 30s TTL
  });
}

function invalidateCommentsCache(postId: string) {
  commentsCache.delete(postId);
}

function extractBodyText(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      const text = String(
        parsed.body ||
        parsed.content ||
        parsed.headline ||
        parsed.title ||
        parsed.excerpt ||
        parsed.destination ||
        ''
      ).trim();
      if (text.length >= 2) return text;
      if (parsed.type === 'journey') {
        const title = parsed.title || parsed.headline || '';
        const dest = parsed.destination || '';
        const routeText = Array.isArray(parsed.route?.points)
          ? parsed.route.points.map((p: any) => p.name || p.address).join(' ')
          : '';
        return `${title} ${dest} ${routeText}`.trim();
      }
    }
  } catch {
    // Ignore, treat as plain text
  }
  return content.trim();
}


// ─────────────────────────────────────────────────────────
// GET /api/v1/posts  — paginated feed of posts
// ─────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '6', q, authorId } = req.query as Record<string, string>;

    const where: any = { deletedAt: null };
    if (authorId) {
      where.authorId = authorId;
    }
    if (q) {
      where.content = { contains: q, mode: 'insensitive' };
    }

    const cacheKey = `feed_${page}_${limit}_${q || ''}_${authorId || ''}`;
    let cachedData: any = getCachedFeed(cacheKey);
    let posts: any[] = [];
    let total = 0;

    if (cachedData) {
      posts = cachedData.posts;
      total = cachedData.total;
    } else {
      try {
        [posts, total] = await Promise.all([
          prisma.post.findMany({
            where,
            include: {
              author: { include: { profile: true } },
              _count: { select: { likes: true, comments: true, bookmarks: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
          }),
          prisma.post.count({ where }),
        ]);
        setCachedFeed(cacheKey, { posts, total });
      } catch (dbErr) {
        console.error('[posts/GET /] Database query error/timeout:', dbErr);
        try {
          posts = await prisma.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
          });
          total = posts.length;
        } catch {
          posts = [];
          total = 0;
        }
      }
    }

    if (!posts || posts.length === 0) {
      try {
        const { ensureInitialCommunityPosts } = await import('../admin/admin.router');
        await ensureInitialCommunityPosts();
        posts = await prisma.post.findMany({
          where,
          include: {
            author: { include: { profile: true } },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        });
        total = posts.length;
      } catch {
        posts = [];
        total = 0;
      }
    }

    let likedPostIds = new Set<string>();
    let bookmarkedPostIds = new Set<string>();

    if (req.user?.sub && posts.length > 0) {
      try {
        const postIds = posts.map(p => p.id);
        const [likes, bookmarks] = await Promise.all([
          prisma.like.findMany({
            where: { userId: req.user.sub, postId: { in: postIds } },
            select: { postId: true }
          }),
          prisma.bookmark.findMany({
            where: { userId: req.user.sub, postId: { in: postIds } },
            select: { postId: true }
          })
        ]);
        likes.forEach(l => likedPostIds.add(l.postId));
        bookmarks.forEach(b => bookmarkedPostIds.add(b.postId));
      } catch (e) {
        console.error('[posts/GET /] Error checking likes/bookmarks:', e);
      }
    }

    const postsWithAuth = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id)
    }));

    return res.json({
      posts: postsWithAuth,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[posts/GET /]', err);
    return res.status(200).json({ posts: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/posts/:id  — single post with comments
// ─────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.post.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        author: { include: { profile: true } },
        comments: {
          where: { parentId: null },
          include: { 
            author: { include: { profile: true } },
            replies: {
              include: { author: { include: { profile: true } } },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        _count: { select: { likes: true, bookmarks: true } },
      },
    });

    if (!post) return res.status(404).json({ error: 'Post not found.' });

    let isLiked = false;
    let isBookmarked = false;
    if (req.user?.sub) {
      const [likeCount, bookmarkCount] = await Promise.all([
        prisma.like.count({ where: { postId: post.id, userId: req.user.sub } }),
        prisma.bookmark.count({ where: { postId: post.id, userId: req.user.sub } }),
      ]);
      isLiked = likeCount > 0;
      isBookmarked = bookmarkCount > 0;
    }

    return res.json({
      ...post,
      isLiked,
      isBookmarked
    });
  } catch (err) {
    console.error('[posts/GET /:id]', err);
    return res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

import { checkContentViolation } from '../../utils/profanityFilter';

// ─────────────────────────────────────────────────────────
// POST /api/v1/posts  — create a new blog post
// ─────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { content, mediaUrls, tripId, locationId } = req.body;

    if (!req.user?.sub) {
      return res.status(401).json({
        error: 'Chưa đăng nhập',
        message: 'Bạn cần đăng nhập tài khoản để thực hiện đăng bài viết hành trình.',
      });
    }

    if (!content) {
      return res.status(400).json({
        error: 'Thiếu dữ liệu bắt buộc',
        message: 'Nội dung bài viết/hành trình không được để trống.',
      });
    }

    const bodyText = extractBodyText(content);
    if (bodyText.length < 10) {
      return res.status(400).json({
        error: 'Nội dung quá ngắn',
        message: 'Nội dung bài viết/hành trình phải chứa ít nhất 10 ký tự.',
      });
    }

    // AI Pre-moderation & Comprehensive Profanity Check
    const violationCheck = checkContentViolation(bodyText);
    if (violationCheck.isViolation) {
      return res.status(400).json({
        error: 'Vi phạm tiêu chuẩn cộng đồng',
        message: `Nội dung bài viết chứa cụm từ thuộc nhóm [${violationCheck.categoryName}]: "${violationCheck.matchedKeyword}". Vui lòng loại bỏ từ vi phạm để đăng bài!`,
        category: violationCheck.categoryName,
        matchedKeyword: violationCheck.matchedKeyword
      });
    }

    let finalMediaUrls: string[] = [];
    if (mediaUrls && Array.isArray(mediaUrls)) {
      const uploadPromises = mediaUrls.map(async (url) => {
        if (url.startsWith('data:image/')) {
          const uploaded = await uploadBase64ToSupabase(url, 'posts');
          return uploaded || null;
        }
        return url;
      });
      const results = await Promise.all(uploadPromises);
      finalMediaUrls = Array.from(new Set(results.filter((url): url is string => typeof url === 'string')));
    }

    // Verify tripId exists if passed to avoid foreign key failure
    let validTripId: string | null = null;
    if (tripId) {
      const tripExists = await prisma.trip.findUnique({ where: { id: tripId }, select: { id: true } });
      if (tripExists) {
        validTripId = tripId;
      }
    }

    const post = await withDbRetry(() => prisma.post.create({
      data: {
        authorId: req.user!.sub,
        content,
        mediaUrls: finalMediaUrls,
        tripId: validTripId,
        locationId: locationId || null,
      },

      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }));

    invalidateFeedCache();

    return res.status(201).json(post);
  } catch (err: any) {
    console.error('[posts/POST /]', err);
    const isDbConnectionErr = err?.message?.includes('prisma') || err?.message?.includes('Prisma') || err?.message?.includes('closed') || err?.code;
    const userMessage = isDbConnectionErr
      ? 'Hệ thống gặp sự cố kết nối máy chủ hoặc cơ sở dữ liệu tạm thời. Vui lòng thử lại sau vài giây.'
      : (err?.message || 'Không thể lưu bài viết vào hệ thống.');

    return res.status(500).json({
      error: 'Lỗi máy chủ khi đăng bài viết',
      message: userMessage,
      details: 'Sự cố kết nối máy chủ (HTTP 500). Bài viết của bạn chưa được lưu thành công. Bản nháp bài viết vẫn được tự động bảo lưu an toàn!',
    });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/posts/:id  — delete own post
// ─────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.authorId !== req.user!.sub) return res.status(403).json({ error: 'Access denied.' });

    // Hard Delete post and all child relationships from DB
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.like.deleteMany({ where: { postId } }),
      prisma.bookmark.deleteMany({ where: { postId } }),
      prisma.notification.deleteMany({ where: { targetId: postId } }),
      prisma.post.delete({ where: { id: postId } }),
    ]);

    invalidateFeedCache();
    return res.status(204).send();
  } catch (err) {
    console.error('[posts/DELETE /:id]', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/posts/:id/like  — toggle like
// ─────────────────────────────────────────────────────────
router.post('/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.sub;

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { postId_userId: { postId, userId } } });
      invalidateFeedCache();
      return res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { postId, userId } });



      try {
        const post = await prisma.post.findUnique({
          where: { id: postId }
        });
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true }
        });
        if (post && post.authorId !== userId) {
          const likerName = liker?.profile?.fullName || 'Ai đó';
          prisma.notification.create({
            data: {
              recipientId: post.authorId,
              type: 'like',
              content: `${likerName} đã thích bài viết của bạn.`,
              targetId: postId,
            },
          }).then(notification => {
            sendRealTimeNotification(req, post.authorId, notification);
          }).catch(err => {
            console.error('Failed to create like notification in background:', err);
          });
        }
      } catch (err) {
        console.error('Failed to create like notification:', err);
      }

      invalidateFeedCache();
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error('[posts/like]', err);
    return res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/posts/:id/bookmark  — toggle bookmark
// ─────────────────────────────────────────────────────────
router.post('/:id/bookmark', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.sub;

    const existing = await prisma.bookmark.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { postId_userId: { postId, userId } } });
      invalidateFeedCache();
      return res.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { postId, userId } });
      invalidateFeedCache();
      return res.json({ bookmarked: true });
    }
  } catch (err) {
    console.error('[posts/bookmark]', err);
    return res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/posts/:id  — edit own post
// ─────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { content, mediaUrls, tripId, locationId } = req.body;
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.authorId !== req.user!.sub) return res.status(403).json({ error: 'Access denied.' });

    if (content !== undefined) {
      const bodyText = extractBodyText(content);
      if (bodyText.length < 10) {
        return res.status(400).json({ error: 'Nội dung bài viết phải chứa ít nhất 10 ký tự.' });
      }
    }

    let finalMediaUrls = post.mediaUrls;
    if (mediaUrls !== undefined && Array.isArray(mediaUrls)) {
      const uploadPromises = mediaUrls.map(async (url) => {
        if (url.startsWith('data:image/')) {
          const uploaded = await uploadBase64ToSupabase(url, 'posts');
          return uploaded || null;
        }
        return url;
      });
      const results = await Promise.all(uploadPromises);
      finalMediaUrls = Array.from(new Set(results.filter((url): url is string => typeof url === 'string')));
    }

    const updatedPost = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        content: content !== undefined ? content : post.content,
        mediaUrls: finalMediaUrls,
        tripId: tripId !== undefined ? tripId : post.tripId,
        locationId: locationId !== undefined ? locationId : post.locationId,
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    invalidateFeedCache();

    return res.json(updatedPost);
  } catch (err) {
    console.error('[posts/PUT /:id]', err);
    return res.status(500).json({ error: 'Failed to update post.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/posts/:id/comments  — fetch comments for post (threaded)
// ─────────────────────────────────────────────────────────
router.get('/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const cached = getCachedComments(postId);
    if (cached) {
      return res.json(cached);
    }

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: { include: { profile: true } },
        replies: {
          include: { author: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    setCachedComments(postId, comments);
    return res.json(comments);
  } catch (err) {
    console.error('[posts/comments GET]', err);
    return res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/posts/:id/comments  — add a comment or reply
// ─────────────────────────────────────────────────────────
router.post('/:id/comments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required.' });

    const comment = await prisma.comment.create({
      data: {
        postId: req.params.id,
        authorId: req.user!.sub,
        content,
        parentId: parentId || null,
      },
      include: { author: { include: { profile: true } } },
    });

    // Invalidate caches
    invalidateCommentsCache(req.params.id);
    invalidateFeedCache();

    // Async background task for notifications & Socket.IO triggers (Non-blocking)
    (async () => {
      try {
        const post = await prisma.post.findUnique({
          where: { id: req.params.id }
        });
        const commenterName = comment.author.profile?.fullName || 'Ai đó';

        if (parentId) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: parentId }
          });
          if (parentComment && parentComment.authorId !== req.user!.sub) {
            const notification = await prisma.notification.create({
              data: {
                recipientId: parentComment.authorId,
                type: 'comment',
                content: `${commenterName} đã trả lời bình luận của bạn.`,
                targetId: comment.postId,
              }
            });
            sendRealTimeNotification(req, parentComment.authorId, notification);
          }
        } else if (post && post.authorId !== req.user!.sub) {
          const notification = await prisma.notification.create({
            data: {
              recipientId: post.authorId,
              type: 'comment',
              content: `${commenterName} đã bình luận về bài viết của bạn.`,
              targetId: comment.postId,
            }
          });
          sendRealTimeNotification(req, post.authorId, notification);
        }
      } catch (err) {
        console.error('Failed to create comment/reply notification in background:', err);
      }
    })().catch(err => console.error('BG Promise failed:', err));

    return res.status(201).json(comment);
  } catch (err) {
    console.error('[posts/comments POST]', err);
    return res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/posts/bookmarks/mine  — get own bookmarks
// ─────────────────────────────────────────────────────────
router.get('/bookmarks/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user!.sub },
      include: {
        post: {
          include: {
            author: { include: { profile: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(bookmarks.map((b) => b.post));
  } catch (err) {
    console.error('[posts/bookmarks/mine]', err);
    return res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

/**
 * POST /api/v1/posts/:id/report
 * Report a post for community moderation
 */
import { reportedPostsStore } from '../../utils/reportedPostsStore';

/**
 * POST /api/v1/posts/:id/report
 * Report a post for community moderation
 */
router.post('/:id/report', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, description, authorName, authorEmail, authorAvatar } = req.body;

    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { include: { profile: true } } }
    });

    const realAuthorName =
      post?.author?.profile?.fullName ||
      (post?.author?.email ? post.author.email.split('@')[0] : null) ||
      authorName ||
      'Tài khoản Thành viên';

    const realAuthorEmail =
      post?.author?.email ||
      authorEmail ||
      (realAuthorName && realAuthorName !== 'Tài khoản Thành viên' 
        ? `${realAuthorName.toLowerCase().replace(/\s+/g, '')}@gmail.com` 
        : 'member@gmail.com');

    const realAuthorAvatar = authorAvatar || post?.author?.profile?.avatarUrl || '';

    // Save report with author info into reportedPostsStore
    reportedPostsStore.addReport(id, reason, description, req.user?.sub, {
      authorName: realAuthorName,
      authorEmail: realAuthorEmail,
      authorAvatar: realAuthorAvatar
    });

    console.log(`[REPORT POST] 🚩 Bài viết [${id}] của tác giả [${realAuthorName}] bị báo cáo bởi user [${req.user?.sub}]. Lý do: ${reason || 'Vi phạm tiêu chuẩn cộng đồng'}`);

    return res.json({
      success: true,
      message: 'Cảm ơn bạn đã gửi báo cáo! Quản trị viên Terraholic sẽ tiến hành kiểm duyệt và xử lý bài viết này trong thời gian sớm nhất.'
    });
  } catch (err: any) {
    console.error('[posts/:id/report ERROR]', err);
    return res.status(500).json({ error: 'Không thể gửi báo cáo vi phạm.' });
  }
});

export default router;

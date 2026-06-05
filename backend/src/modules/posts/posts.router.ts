import { Router, Response } from 'express';
import prisma from '../../config/db';
import { requireAuth, optionalAuth, AuthRequest } from '../auth/auth.middleware';

const router = Router();

function extractBodyText(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return String(parsed.body || parsed.content || '').trim();
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
    const { page = '1', limit = '10', q } = req.query as Record<string, string>;

    // Permanently delete posts trashed more than 15 days ago
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    try {
      await prisma.post.deleteMany({
        where: {
          deletedAt: {
            lt: fifteenDaysAgo
          }
        }
      });
    } catch (err) {
      console.error('Failed to clean up expired trashed posts:', err);
    }

    const where: any = { deletedAt: null };
    if (q) {
      where.content = { contains: q, mode: 'insensitive' };
    }

    const [posts, total] = await Promise.all([
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

    let likedPostIds = new Set<string>();
    let bookmarkedPostIds = new Set<string>();

    if (req.user?.sub) {
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
    return res.status(500).json({ error: 'Failed to fetch posts.' });
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

// ─────────────────────────────────────────────────────────
// POST /api/v1/posts  — create a new blog post
// ─────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { content, mediaUrls, tripId, locationId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required.' });
    }

    const bodyText = extractBodyText(content);
    if (bodyText.length < 10) {
      return res.status(400).json({ error: 'Nội dung bài viết phải chứa ít nhất 10 ký tự.' });
    }

    const post = await prisma.post.create({
      data: {
        authorId: req.user!.sub,
        content,
        mediaUrls: mediaUrls || [],
        tripId: tripId || null,
        locationId: locationId || null,
      },

      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return res.status(201).json(post);
  } catch (err) {
    console.error('[posts/POST /]', err);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/posts/:id  — delete own post
// ─────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.authorId !== req.user!.sub) return res.status(403).json({ error: 'Access denied.' });

    await prisma.post.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });
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
      return res.json({ liked: false });
    } else {
      await prisma.like.create({ data: { postId, userId } });
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
      return res.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { postId, userId } });
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

    const updatedPost = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        content: content !== undefined ? content : post.content,
        mediaUrls: mediaUrls !== undefined ? mediaUrls : post.mediaUrls,
        tripId: tripId !== undefined ? tripId : post.tripId,
        locationId: locationId !== undefined ? locationId : post.locationId,
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

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
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id, parentId: null },
      include: {
        author: { include: { profile: true } },
        replies: {
          include: { author: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

export default router;

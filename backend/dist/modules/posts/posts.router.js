"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────────────────────
// GET /api/v1/posts  — paginated feed of posts
// ─────────────────────────────────────────────────────────
router.get('/', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const { page = '1', limit = '10', q } = req.query;
        const where = {};
        if (q) {
            where.content = { contains: q, mode: 'insensitive' };
        }
        const [posts, total] = await Promise.all([
            db_1.default.post.findMany({
                where,
                include: {
                    author: { include: { profile: true } },
                    _count: { select: { likes: true, comments: true, bookmarks: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            db_1.default.post.count({ where }),
        ]);
        let likedPostIds = new Set();
        let bookmarkedPostIds = new Set();
        if (req.user?.sub) {
            const postIds = posts.map(p => p.id);
            const [likes, bookmarks] = await Promise.all([
                db_1.default.like.findMany({
                    where: { userId: req.user.sub, postId: { in: postIds } },
                    select: { postId: true }
                }),
                db_1.default.bookmark.findMany({
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
    }
    catch (err) {
        console.error('[posts/GET /]', err);
        return res.status(500).json({ error: 'Failed to fetch posts.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/posts/:id  — single post with comments
// ─────────────────────────────────────────────────────────
router.get('/:id', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const post = await db_1.default.post.findUnique({
            where: { id: req.params.id },
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
                _count: { select: { likes: true, bookmarks: true } },
            },
        });
        if (!post)
            return res.status(404).json({ error: 'Post not found.' });
        let isLiked = false;
        let isBookmarked = false;
        if (req.user?.sub) {
            const [likeCount, bookmarkCount] = await Promise.all([
                db_1.default.like.count({ where: { postId: post.id, userId: req.user.sub } }),
                db_1.default.bookmark.count({ where: { postId: post.id, userId: req.user.sub } }),
            ]);
            isLiked = likeCount > 0;
            isBookmarked = bookmarkCount > 0;
        }
        return res.json({
            ...post,
            isLiked,
            isBookmarked
        });
    }
    catch (err) {
        console.error('[posts/GET /:id]', err);
        return res.status(500).json({ error: 'Failed to fetch post.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/posts  — create a new blog post
// ─────────────────────────────────────────────────────────
router.post('/', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { content, mediaUrls, tripId, locationId } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'content is required.' });
        }
        const post = await db_1.default.post.create({
            data: {
                authorId: req.user.sub,
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
    }
    catch (err) {
        console.error('[posts/POST /]', err);
        return res.status(500).json({ error: 'Failed to create post.' });
    }
});
// ─────────────────────────────────────────────────────────
// DELETE /api/v1/posts/:id  — delete own post
// ─────────────────────────────────────────────────────────
router.delete('/:id', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const post = await db_1.default.post.findUnique({ where: { id: req.params.id } });
        if (!post)
            return res.status(404).json({ error: 'Post not found.' });
        if (post.authorId !== req.user.sub)
            return res.status(403).json({ error: 'Access denied.' });
        await db_1.default.post.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    }
    catch (err) {
        console.error('[posts/DELETE /:id]', err);
        return res.status(500).json({ error: 'Failed to delete post.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/posts/:id/like  — toggle like
// ─────────────────────────────────────────────────────────
router.post('/:id/like', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.sub;
        const existing = await db_1.default.like.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        if (existing) {
            await db_1.default.like.delete({ where: { postId_userId: { postId, userId } } });
            return res.json({ liked: false });
        }
        else {
            await db_1.default.like.create({ data: { postId, userId } });
            return res.json({ liked: true });
        }
    }
    catch (err) {
        console.error('[posts/like]', err);
        return res.status(500).json({ error: 'Failed to toggle like.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/posts/:id/bookmark  — toggle bookmark
// ─────────────────────────────────────────────────────────
router.post('/:id/bookmark', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.sub;
        const existing = await db_1.default.bookmark.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        if (existing) {
            await db_1.default.bookmark.delete({ where: { postId_userId: { postId, userId } } });
            return res.json({ bookmarked: false });
        }
        else {
            await db_1.default.bookmark.create({ data: { postId, userId } });
            return res.json({ bookmarked: true });
        }
    }
    catch (err) {
        console.error('[posts/bookmark]', err);
        return res.status(500).json({ error: 'Failed to toggle bookmark.' });
    }
});
// ─────────────────────────────────────────────────────────
// PUT /api/v1/posts/:id  — edit own post
// ─────────────────────────────────────────────────────────
router.put('/:id', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { content, mediaUrls } = req.body;
        const post = await db_1.default.post.findUnique({ where: { id: req.params.id } });
        if (!post)
            return res.status(404).json({ error: 'Post not found.' });
        if (post.authorId !== req.user.sub)
            return res.status(403).json({ error: 'Access denied.' });
        const updatedPost = await db_1.default.post.update({
            where: { id: req.params.id },
            data: {
                content: content !== undefined ? content : post.content,
                mediaUrls: mediaUrls !== undefined ? mediaUrls : post.mediaUrls,
            },
            include: {
                author: { include: { profile: true } },
                _count: { select: { likes: true, comments: true } },
            },
        });
        return res.json(updatedPost);
    }
    catch (err) {
        console.error('[posts/PUT /:id]', err);
        return res.status(500).json({ error: 'Failed to update post.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/posts/:id/comments  — fetch comments for post (threaded)
// ─────────────────────────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await db_1.default.comment.findMany({
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
    }
    catch (err) {
        console.error('[posts/comments GET]', err);
        return res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/posts/:id/comments  — add a comment or reply
// ─────────────────────────────────────────────────────────
router.post('/:id/comments', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { content, parentId } = req.body;
        if (!content)
            return res.status(400).json({ error: 'content is required.' });
        const comment = await db_1.default.comment.create({
            data: {
                postId: req.params.id,
                authorId: req.user.sub,
                content,
                parentId: parentId || null,
            },
            include: { author: { include: { profile: true } } },
        });
        return res.status(201).json(comment);
    }
    catch (err) {
        console.error('[posts/comments POST]', err);
        return res.status(500).json({ error: 'Failed to add comment.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/posts/bookmarks/mine  — get own bookmarks
// ─────────────────────────────────────────────────────────
router.get('/bookmarks/mine', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const bookmarks = await db_1.default.bookmark.findMany({
            where: { userId: req.user.sub },
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
    }
    catch (err) {
        console.error('[posts/bookmarks/mine]', err);
        return res.status(500).json({ error: 'Failed to fetch bookmarks.' });
    }
});
exports.default = router;

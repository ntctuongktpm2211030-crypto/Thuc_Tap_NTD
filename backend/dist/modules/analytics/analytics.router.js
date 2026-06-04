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
// GET /api/v1/analytics/platform  — overall platform stats
// Admin only in production, but accessible in dev for thesis demo
// ─────────────────────────────────────────────────────────
router.get('/platform', async (_req, res) => {
    try {
        const [totalUsers, totalTrips, totalPosts, totalCheckins, totalDestinations, totalAiHistory, totalFollowers, totalComments,] = await Promise.all([
            db_1.default.user.count(),
            db_1.default.trip.count(),
            db_1.default.post.count(),
            db_1.default.checkIn.count(),
            db_1.default.destination.count(),
            db_1.default.aIHistory.count(),
            db_1.default.follower.count(),
            db_1.default.comment.count(),
        ]);
        return res.json({
            users: totalUsers,
            trips: totalTrips,
            posts: totalPosts,
            checkins: totalCheckins,
            destinations: totalDestinations,
            aiRequests: totalAiHistory,
            socialConnections: totalFollowers,
            comments: totalComments,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('[analytics/platform]', err);
        return res.status(500).json({ error: 'Failed to fetch platform analytics.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/top-destinations  — top destinations by check-ins
// ─────────────────────────────────────────────────────────
router.get('/top-destinations', async (_req, res) => {
    try {
        const topDestinations = await db_1.default.destination.findMany({
            include: { _count: { select: { checkIns: true, activities: true } } },
            orderBy: { checkIns: { _count: 'desc' } },
            take: 10,
        });
        return res.json(topDestinations);
    }
    catch (err) {
        console.error('[analytics/top-destinations]', err);
        return res.status(500).json({ error: 'Failed to fetch top destinations.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/ai-usage  — AI history analytics
// ─────────────────────────────────────────────────────────
router.get('/ai-usage', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const [byType, recentHistory] = await Promise.all([
            // Group AI requests by type
            db_1.default.aIHistory.groupBy({
                by: ['type'],
                _count: { type: true },
            }),
            // Last 10 AI requests for this user
            db_1.default.aIHistory.findMany({
                where: { userId: req.user.sub },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { type: true, promptText: true, createdAt: true },
            }),
        ]);
        return res.json({ byType, recentHistory });
    }
    catch (err) {
        console.error('[analytics/ai-usage]', err);
        return res.status(500).json({ error: 'Failed to fetch AI usage.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/social-graph  — social network stats
// ─────────────────────────────────────────────────────────
router.get('/social-graph', async (_req, res) => {
    try {
        // Top users by follower count
        const topFollowed = await db_1.default.user.findMany({
            include: {
                profile: true,
                _count: { select: { followers: true, posts: true } },
            },
            orderBy: { followers: { _count: 'desc' } },
            take: 5,
        });
        // Most liked posts
        const topPosts = await db_1.default.post.findMany({
            include: {
                author: { include: { profile: true } },
                _count: { select: { likes: true, comments: true } },
            },
            orderBy: { likes: { _count: 'desc' } },
            take: 5,
        });
        return res.json({
            topFollowed: topFollowed.map(({ passwordHash, verificationToken, resetPasswordToken, ...u }) => u),
            topPosts,
        });
    }
    catch (err) {
        console.error('[analytics/social-graph]', err);
        return res.status(500).json({ error: 'Failed to fetch social graph stats.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/gis-heatmap  — check-in density data for map
// ─────────────────────────────────────────────────────────
router.get('/gis-heatmap', async (_req, res) => {
    try {
        const checkinsWithCoords = await db_1.default.checkIn.findMany({
            include: { destination: { select: { latitude: true, longitude: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        // Return coordinate + weight array for heatmap rendering
        const heatmapData = checkinsWithCoords
            .filter((c) => c.destination)
            .map((c) => ({
            lat: c.destination.latitude,
            lng: c.destination.longitude,
            name: c.destination.name,
            weight: 1,
        }));
        return res.json(heatmapData);
    }
    catch (err) {
        console.error('[analytics/gis-heatmap]', err);
        return res.status(500).json({ error: 'Failed to fetch GIS heatmap data.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/trip-trends  — trip creation over time
// ─────────────────────────────────────────────────────────
router.get('/trip-trends', async (_req, res) => {
    try {
        // Group trips by month — raw query for aggregation
        const trips = await db_1.default.trip.findMany({
            select: { createdAt: true, travelStyle: true },
            orderBy: { createdAt: 'asc' },
        });
        // Build monthly buckets
        const monthly = {};
        trips.forEach((t) => {
            const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
            monthly[key] = (monthly[key] || 0) + 1;
        });
        // Travel style distribution
        const styleCount = {};
        trips.forEach((t) => {
            styleCount[t.travelStyle] = (styleCount[t.travelStyle] || 0) + 1;
        });
        return res.json({ monthly, styleDistribution: styleCount });
    }
    catch (err) {
        console.error('[analytics/trip-trends]', err);
        return res.status(500).json({ error: 'Failed to fetch trip trends.' });
    }
});
exports.default = router;

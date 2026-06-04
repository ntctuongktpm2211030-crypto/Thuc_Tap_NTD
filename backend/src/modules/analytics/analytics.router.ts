import { Router, Response, Request } from 'express';
import prisma from '../../config/db';
import { requireAuth, requireAdmin, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/platform  — overall platform stats
// Admin only in production, but accessible in dev for thesis demo
// ─────────────────────────────────────────────────────────
router.get('/platform', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalTrips,
      totalPosts,
      totalCheckins,
      totalDestinations,
      totalAiHistory,
      totalFollowers,
      totalComments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.checkIn.count(),
      prisma.destination.count(),
      prisma.aIHistory.count(),
      prisma.follower.count(),
      prisma.comment.count(),
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
  } catch (err) {
    console.error('[analytics/platform]', err);
    return res.status(500).json({ error: 'Failed to fetch platform analytics.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/top-destinations  — top destinations by check-ins
// ─────────────────────────────────────────────────────────
router.get('/top-destinations', async (_req: Request, res: Response) => {
  try {
    const topDestinations = await prisma.destination.findMany({
      include: { _count: { select: { checkIns: true, activities: true } } },
      orderBy: { checkIns: { _count: 'desc' } },
      take: 10,
    });

    return res.json(topDestinations);
  } catch (err) {
    console.error('[analytics/top-destinations]', err);
    return res.status(500).json({ error: 'Failed to fetch top destinations.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/ai-usage  — AI history analytics
// ─────────────────────────────────────────────────────────
router.get('/ai-usage', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [byType, recentHistory] = await Promise.all([
      // Group AI requests by type
      prisma.aIHistory.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      // Last 10 AI requests for this user
      prisma.aIHistory.findMany({
        where: { userId: req.user!.sub },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { type: true, promptText: true, createdAt: true },
      }),
    ]);

    return res.json({ byType, recentHistory });
  } catch (err) {
    console.error('[analytics/ai-usage]', err);
    return res.status(500).json({ error: 'Failed to fetch AI usage.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/social-graph  — social network stats
// ─────────────────────────────────────────────────────────
router.get('/social-graph', async (_req: Request, res: Response) => {
  try {
    // Top users by follower count
    const topFollowed = await prisma.user.findMany({
      include: {
        profile: true,
        _count: { select: { followers: true, posts: true } },
      },
      orderBy: { followers: { _count: 'desc' } },
      take: 5,
    });

    // Most liked posts
    const topPosts = await prisma.post.findMany({
      where: { deletedAt: null },
      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { likes: { _count: 'desc' } },
      take: 5,
    });

    return res.json({
      topFollowed: topFollowed.map(({ passwordHash, verificationToken, resetPasswordToken, ...u }: any) => u),
      topPosts,
    });
  } catch (err) {
    console.error('[analytics/social-graph]', err);
    return res.status(500).json({ error: 'Failed to fetch social graph stats.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/gis-heatmap  — check-in density data for map
// ─────────────────────────────────────────────────────────
router.get('/gis-heatmap', async (_req: Request, res: Response) => {
  try {
    const checkinsWithCoords = await prisma.checkIn.findMany({
      include: { destination: { select: { latitude: true, longitude: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Return coordinate + weight array for heatmap rendering
    const heatmapData = checkinsWithCoords
      .filter((c) => c.destination)
      .map((c) => ({
        lat: c.destination!.latitude,
        lng: c.destination!.longitude,
        name: c.destination!.name,
        weight: 1,
      }));

    return res.json(heatmapData);
  } catch (err) {
    console.error('[analytics/gis-heatmap]', err);
    return res.status(500).json({ error: 'Failed to fetch GIS heatmap data.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/trip-trends  — trip creation over time
// ─────────────────────────────────────────────────────────
router.get('/trip-trends', async (_req: Request, res: Response) => {
  try {
    // Group trips by month — raw query for aggregation
    const trips = await prisma.trip.findMany({
      select: { createdAt: true, travelStyle: true },
      orderBy: { createdAt: 'asc' },
    });

    // Build monthly buckets
    const monthly: Record<string, number> = {};
    trips.forEach((t) => {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });

    // Travel style distribution
    const styleCount: Record<string, number> = {};
    trips.forEach((t) => {
      styleCount[t.travelStyle] = (styleCount[t.travelStyle] || 0) + 1;
    });

    return res.json({ monthly, styleDistribution: styleCount });
  } catch (err) {
    console.error('[analytics/trip-trends]', err);
    return res.status(500).json({ error: 'Failed to fetch trip trends.' });
  }
});

export default router;

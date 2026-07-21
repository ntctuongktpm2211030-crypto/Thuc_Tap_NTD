import { Router, Response } from 'express';
import prisma from '../../config/db';
import { requireAuth, AuthRequest } from '../auth/auth.middleware';
import { calculateBoundingBox, calculateHaversineDistance } from '../map/gis-helper';

const router = Router();

// ─────────────────────────────────────────────────────────
// GET /api/v1/recommendations  — AI-scored recommendations for user
// Content-based + preference filtering
// ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query as Record<string, string>;

    // Fetch user preferences to personalize recommendations
    const prefs = await prisma.travelPreferences.findUnique({
      where: { userId: req.user!.sub },
    });

    // Score destinations based on category match with user preferences
    const destinations = await prisma.destination.findMany({
      take: 50,
      orderBy: { averageRating: 'desc' },
    });

    const userCategories = prefs?.activities ?? [];

    const scored = destinations.map((dest) => {
      // Content-based scoring: category overlap with user interests
      const categoryMatch = userCategories.includes(dest.category) ? 0.4 : 0;
      // Rating signal: normalized 0-1
      const ratingScore = dest.averageRating / 5;
      // Composite relevance score
      const score = Math.min(1, categoryMatch + ratingScore * 0.6);
      return { ...dest, score };
    });

    // Sort by composite score descending
    scored.sort((a, b) => b.score - a.score);

    return res.json(scored.slice(0, Number(limit)));
  } catch (err) {
    console.error('[recommendations/GET /]', err);
    return res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/recommendations/nearby
// Spatial proximity search using bounding box + Haversine filter
// ─────────────────────────────────────────────────────────
router.get('/nearby', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius = '5', limit = '10' } = req.query as Record<string, string>;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query params are required.' });
    }

    const center = { latitude: Number(lat), longitude: Number(lng) };
    const radiusKm = Number(radius);

    // Step 1: Fast bounding box query against DB index
    const bbox = calculateBoundingBox(center, radiusKm);
    const candidates = await prisma.destination.findMany({
      where: {
        latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
        longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
      },
    });

    // Step 2: Precise Haversine filter on candidates
    const nearby = candidates
      .map((dest) => ({
        ...dest,
        distanceKm: calculateHaversineDistance(center, { latitude: dest.latitude, longitude: dest.longitude }),
      }))
      .filter((d) => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, Number(limit));

    return res.json(nearby);
  } catch (err) {
    console.error('[recommendations/nearby]', err);
    return res.status(500).json({ error: 'Failed to fetch nearby destinations.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/recommendations/destinations  — full destination list
// ─────────────────────────────────────────────────────────
router.get('/destinations', async (req: AuthRequest, res: Response) => {
  try {
    const { category, q, page = '1', limit = '20' } = req.query as Record<string, string>;



    const where: any = {};
    if (category) where.category = category;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [destinations, total] = await Promise.all([
      prisma.destination.findMany({
        where,
        orderBy: { averageRating: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.destination.count({ where }),
    ]);

    return res.json({
      destinations,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[recommendations/destinations]', err);
    return res.status(500).json({ error: 'Failed to fetch destinations.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/recommendations/save-trip-recs
// Persist AI recommendations for a trip
// ─────────────────────────────────────────────────────────
router.post('/save-trip-recs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { tripId, destinationIds } = req.body as {
      tripId: string;
      destinationIds: Array<{ id: string; score: number; reason?: string }>;
    };

    if (!tripId || !destinationIds?.length) {
      return res.status(400).json({ error: 'tripId and destinationIds are required.' });
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.ownerId !== req.user!.sub) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Upsert recommendations (delete old, insert new)
    await prisma.recommendation.deleteMany({ where: { tripId } });
    const created = await prisma.recommendation.createMany({
      data: destinationIds.map((d) => ({
        tripId,
        destinationId: d.id,
        score: d.score,
        recommendationReason: d.reason ?? null,
      })),
    });

    return res.status(201).json({ saved: created.count });
  } catch (err) {
    console.error('[recommendations/save-trip-recs]', err);
    return res.status(500).json({ error: 'Failed to save recommendations.' });
  }
});

export default router;

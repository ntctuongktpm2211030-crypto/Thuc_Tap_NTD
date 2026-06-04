import { Router, Response } from 'express';
import prisma from '../../config/db';
import { requireAuth, AuthRequest } from '../auth/auth.middleware';
import { calculateBoundingBox } from './gis-helper';

const router = Router();

// ─────────────────────────────────────────────────────────
// POST /api/v1/map/checkin  — user checks in at a destination
// ─────────────────────────────────────────────────────────
router.post('/checkin', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { destinationId, note } = req.body;

    if (!destinationId) {
      return res.status(400).json({ error: 'destinationId is required.' });
    }

    const checkin = await prisma.checkIn.create({
      data: {
        userId: req.user!.sub,
        destinationId,
        note: note || null,
      },
      include: {
        user: { include: { profile: true } },
        destination: true,
      },
    });

    return res.status(201).json(checkin);
  } catch (err) {
    console.error('[map/checkin POST]', err);
    return res.status(500).json({ error: 'Check-in failed.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/map/checkins  — recent public check-ins feed
// ─────────────────────────────────────────────────────────
router.get('/checkins', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '20' } = req.query as Record<string, string>;

    const checkins = await prisma.checkIn.findMany({
      include: {
        user: { include: { profile: true } },
        destination: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    return res.json(checkins);
  } catch (err) {
    console.error('[map/checkins GET]', err);
    return res.status(500).json({ error: 'Failed to fetch check-ins.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/map/checkins/nearby  — check-ins near a coordinate
// ─────────────────────────────────────────────────────────
router.get('/checkins/nearby', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius = '10', limit = '20' } = req.query as Record<string, string>;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required.' });
    }

    const center = { latitude: Number(lat), longitude: Number(lng) };
    const bbox = calculateBoundingBox(center, Number(radius));

    const checkins = await prisma.checkIn.findMany({
      where: {
        destination: {
          latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
          longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
        },
      },
      include: {
        user: { include: { profile: true } },
        destination: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    return res.json(checkins);
  } catch (err) {
    console.error('[map/checkins/nearby]', err);
    return res.status(500).json({ error: 'Failed to fetch nearby check-ins.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/map/location  — update user's live GPS location
// ─────────────────────────────────────────────────────────
router.put('/location', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude and longitude are required.' });
    }

    // Upsert live location (one record per user)
    const location = await prisma.location.upsert({
      where: { userId: req.user!.sub },
      create: { userId: req.user!.sub, latitude, longitude },
      update: { latitude, longitude },
    });

    return res.json(location);
  } catch (err) {
    console.error('[map/location PUT]', err);
    return res.status(500).json({ error: 'Failed to update location.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/map/friends-locations  — fetch live friend locations
// ─────────────────────────────────────────────────────────
router.get('/friends-locations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Fetch IDs of users this user follows
    const followingRecords = await prisma.follower.findMany({
      where: { followerId: req.user!.sub },
      select: { followingId: true },
    });

    const followingIds = followingRecords.map((f) => f.followingId);

    const locations = await prisma.location.findMany({
      where: { userId: { in: followingIds } },
      include: { user: { include: { profile: true } } },
    });

    return res.json(locations);
  } catch (err) {
    console.error('[map/friends-locations]', err);
    return res.status(500).json({ error: 'Failed to fetch friend locations.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/map/destinations  — all map markers (destinations)
// ─────────────────────────────────────────────────────────
router.get('/destinations', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius = '50' } = req.query as Record<string, string>;

    // If coordinates provided, use spatial filter
    if (lat && lng) {
      const bbox = calculateBoundingBox(
        { latitude: Number(lat), longitude: Number(lng) },
        Number(radius)
      );

      const destinations = await prisma.destination.findMany({
        where: {
          latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
          longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
        },
        orderBy: { averageRating: 'desc' },
      });

      return res.json(destinations);
    }

    // Otherwise return top-rated destinations globally
    const destinations = await prisma.destination.findMany({
      orderBy: { averageRating: 'desc' },
      take: 100,
    });

    return res.json(destinations);
  } catch (err) {
    console.error('[map/destinations]', err);
    return res.status(500).json({ error: 'Failed to fetch destinations.' });
  }
});

export default router;

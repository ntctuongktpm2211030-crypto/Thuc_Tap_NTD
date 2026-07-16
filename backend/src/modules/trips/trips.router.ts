import { Router, Response } from 'express';
import prisma from '../../config/db';
import { requireAuth, AuthRequest } from '../auth/auth.middleware';
import { generateAIItinerary, regenerateItineraryPart } from '../ai/ai-planner';
import { optimizeRoute, Waypoint } from '../optimizer/route-optimizer';

const router = Router();

function unpackActivityNotes(act: any) {
  let extra: any = {};
  if (act.notes) {
    try {
      if (act.notes.trim().startsWith('{') && act.notes.trim().endsWith('}')) {
        extra = JSON.parse(act.notes);
      }
    } catch (e) {}
  }
  const originalNotes = extra.originalNotes !== undefined ? extra.originalNotes : act.notes;
  return {
    ...act,
    ...extra,
    notes: originalNotes,
    activityName: act.destination?.name || act.activityName || 'Destination',
    locationName: act.destination?.address || act.destination?.name || act.locationName || 'Destination',
    category: act.destination?.category || act.category || 'attraction',
    latitude: act.destination?.latitude || act.latitude,
    longitude: act.destination?.longitude || act.longitude,
  };
}

// ─────────────────────────────────────────────────────────
// GET /api/v1/trips  — list current user's trips
// ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { ownerId: req.user!.sub },
      include: {
        days: {
          include: { activities: { include: { destination: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedTrips = trips.map(trip => {
      const mappedDays = trip.days.map(d => {
        const mappedActivities = d.activities.map(unpackActivityNotes);
        return { ...d, activities: mappedActivities };
      });
      return { ...trip, days: mappedDays };
    });

    return res.json(mappedTrips);
  } catch (err) {
    console.error('[trips/GET /]', err);
    return res.status(500).json({ error: 'Failed to fetch trips.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/trips/:id  — get one trip with full days
// ─────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { include: { profile: true } },
        days: {
          include: {
            activities: {
              include: { destination: true },
              orderBy: { sequenceOrder: 'asc' },
            },
          },
          orderBy: { dayIndex: 'asc' },
        },
        recommendations: { include: { destination: true } },
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    // Allow owner or if trip is public
    if (trip.ownerId !== req.user!.sub && !trip.isPublic) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const mappedDays = trip.days.map(d => {
      const mappedActivities = d.activities.map(unpackActivityNotes);
      return { ...d, activities: mappedActivities };
    });

    return res.json({ ...trip, days: mappedDays });
  } catch (err) {
    console.error('[trips/GET /:id]', err);
    return res.status(500).json({ error: 'Failed to fetch trip.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips  — create new trip manually
// ─────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, destinationName, startDate, endDate, totalBudget, travelStyle, isPublic, days } = req.body;

    if (!title || !destinationName || !startDate || !endDate) {
      return res.status(400).json({ error: 'title, destinationName, startDate, endDate are required.' });
    }

    // 1. Create the trip
    const trip = await prisma.trip.create({
      data: {
        ownerId: req.user!.sub,
        title,
        description,
        destinationName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalBudget: totalBudget || 0,
        travelStyle: travelStyle || 'solo',
        isPublic: isPublic || false,
      },
    });

    // 2. If days are provided, create them and associate activities
    if (days && Array.isArray(days)) {
      for (const day of days) {
        const dayIndex = day.dayNumber || day.dayIndex || 1;
        const dayTitle = day.title || day.dateIndex || `Day ${dayIndex}`;

        const tripStartDate = new Date(startDate);
        const dayDate = new Date(tripStartDate);
        dayDate.setDate(tripStartDate.getDate() + (dayIndex - 1));

        const tripDay = await prisma.tripDay.create({
          data: {
            tripId: trip.id,
            dayIndex,
            date: dayDate,
          },
        });

        if (day.activities && Array.isArray(day.activities)) {
          for (let i = 0; i < day.activities.length; i++) {
            const act = day.activities[i];

            const destName = act.name || act.activityName || act.locationName || 'Destination';
            const lat = Number(act.latitude) || 21.0285;
            const lng = Number(act.longitude) || 105.8048;
            const cat = act.category || 'attraction';
            const notes = act.note || act.notes || '';
            const cost = Number(act.cost) || Number(act.estimatedCost) || 0;
            const timeRange = act.time || act.timeSlot || '09:00 - 10:00';

            let startTime = '09:00';
            let endTime = '10:00';
            if (timeRange.includes('-')) {
              const parts = timeRange.split('-');
              startTime = parts[0].trim();
              endTime = parts[1].trim();
            } else {
              startTime = timeRange.trim();
            }

            // Find or create Destination
            let destination = await prisma.destination.findFirst({
              where: { name: destName },
            });

            if (!destination) {
              destination = await prisma.destination.create({
                data: {
                  name: destName,
                  description: notes || destName,
                  latitude: lat,
                  longitude: lng,
                  category: cat,
                  address: act.address || destName,
                },
              });
            }

            const extraFields = {
              thoiGianThamQuan: act.thoiGianThamQuan,
              goiYTraiNghiem: act.goiYTraiNghiem,
              monAn: act.monAn,
              quanGoiY: act.quanGoiY,
              anTrua: act.anTrua,
              monDacSan: act.monDacSan,
              thoiGianNghiNgoi: act.thoiGianNghiNgoi,
              thoiGianLuuLai: act.thoiGianLuuLai,
              anToi: act.anToi,
              diaDiemDaoChoi: act.diaDiemDaoChoi,
              choDem: act.choDem,
              cafe: act.cafe,
              hoatDongGiaiTri: act.hoatDongGiaiTri,
              nghiDemODau: act.nghiDemODau,
              originalNotes: notes,
            };

            const hasExtra = Object.keys(extraFields).some(k => k !== 'originalNotes' && (extraFields as any)[k] !== undefined && (extraFields as any)[k] !== null);
            const notesToSave = hasExtra ? JSON.stringify(extraFields) : notes;

            // Create TripActivity
            await prisma.tripActivity.create({
              data: {
                tripDayId: tripDay.id,
                destinationId: destination.id,
                startTime,
                endTime,
                estimatedCost: cost,
                sequenceOrder: i + 1,
                notes: notesToSave,
              },
            });
          }
        }
      }
    }

    return res.status(201).json(trip);
  } catch (err) {
    console.error('[trips/POST /]', err);
    return res.status(500).json({ error: 'Failed to create trip.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips/ai-generate — AI itinerary generation
// ─────────────────────────────────────────────────────────
router.post('/ai-generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { destination, durationDays, totalBudget, dailyBudget, currency, interests, travelStyle, transportation } = req.body;

    if (!destination || !durationDays) {
      return res.status(400).json({ error: 'destination and durationDays are required.' });
    }

    const calculatedTotalBudget = totalBudget || (dailyBudget ? Number(dailyBudget) * Number(durationDays) : 500);

    // 1. Call AI planner
    const aiResult = await generateAIItinerary({
      destination,
      durationDays: Number(durationDays),
      totalBudget: Number(calculatedTotalBudget),
      currency: currency || 'USD',
      interests: interests || [],
      travelStyle: travelStyle || 'Adventure',
      transportation: transportation || 'Xe máy',
    });

    // 2. Persist to AIHistory table for analytics
    await prisma.aIHistory.create({
      data: {
        userId: req.user!.sub,
        promptText: `destination=${destination} days=${durationDays} budget=${calculatedTotalBudget} style=${travelStyle}`,
        responseJson: JSON.stringify(aiResult),
        type: 'itinerary',
      },
    });

    return res.status(200).json(aiResult);
  } catch (err) {
    console.error('[trips/ai-generate]', err);
    return res.status(500).json({ error: 'AI itinerary generation failed.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips/ai-regenerate-part — AI partial regeneration (day or session)
// ─────────────────────────────────────────────────────────
router.post('/ai-regenerate-part', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      destination,
      durationDays,
      totalBudget,
      dailyBudget,
      currency,
      interests,
      travelStyle,
      targetDayIndex,
      targetSession,
      currentItinerary,
      excludePlaces
    } = req.body;

    if (!destination || !durationDays || targetDayIndex === undefined || !currentItinerary) {
      return res.status(400).json({ error: 'destination, durationDays, targetDayIndex, and currentItinerary are required.' });
    }

    const calculatedTotalBudget = totalBudget || (dailyBudget ? Number(dailyBudget) * Number(durationDays) : 500);

    const aiResult = await regenerateItineraryPart({
      destination,
      durationDays: Number(durationDays),
      totalBudget: Number(calculatedTotalBudget),
      currency: currency || 'USD',
      interests: interests || [],
      travelStyle: travelStyle || 'Adventure',
      targetDayIndex: Number(targetDayIndex),
      targetSession,
      currentItinerary,
      excludePlaces: excludePlaces || [],
    });

    // Persist to AIHistory
    await prisma.aIHistory.create({
      data: {
        userId: req.user!.sub,
        promptText: `regenerate_part destination=${destination} day=${targetDayIndex} session=${targetSession || 'day'}`,
        responseJson: JSON.stringify(aiResult),
        type: 'itinerary_part_regeneration',
      },
    });

    return res.status(200).json(aiResult);
  } catch (err) {
    console.error('[trips/ai-regenerate-part]', err);
    return res.status(500).json({ error: 'AI partial itinerary regeneration failed.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips/optimize-route — TSP route optimization
// ─────────────────────────────────────────────────────────
router.post('/optimize-route', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { waypoints } = req.body as { waypoints: Waypoint[] };

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({ error: 'At least 2 waypoints required.' });
    }

    const optimized = optimizeRoute(waypoints);

    // Persist TSP optimization to AIHistory
    await prisma.aIHistory.create({
      data: {
        userId: req.user!.sub,
        promptText: `route_optimize waypoints=${waypoints.length}`,
        responseJson: JSON.stringify(optimized),
        type: 'route_optimization',
      },
    });

    return res.status(200).json(optimized);
  } catch (err) {
    console.error('[trips/optimize-route]', err);
    return res.status(500).json({ error: 'Route optimization failed.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/trips/:id  — update trip metadata
// ─────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Trip not found.' });
    if (existing.ownerId !== req.user!.sub) return res.status(403).json({ error: 'Access denied.' });

    // Kiểm tra xung đột đồng thời (Optimistic Concurrency Control)
    if (req.body.lastUpdatedAt) {
      const clientTime = new Date(req.body.lastUpdatedAt).getTime();
      const serverTime = new Date(existing.updatedAt).getTime();
      if (Math.abs(serverTime - clientTime) > 1000) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Chuyến đi đã được cập nhật bởi một người khác trong lúc bạn đang chỉnh sửa. Vui lòng tải lại trang để lấy dữ liệu mới nhất.',
          serverUpdatedAt: existing.updatedAt
        });
      }
    }

    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title ?? existing.title,
        description: req.body.description ?? existing.description,
        destinationName: req.body.destinationName ?? existing.destinationName,
        startDate: req.body.startDate ? new Date(req.body.startDate) : existing.startDate,
        endDate: req.body.endDate ? new Date(req.body.endDate) : existing.endDate,
        totalBudget: req.body.totalBudget ?? existing.totalBudget,
        travelStyle: req.body.travelStyle ?? existing.travelStyle,
        isPublic: req.body.isPublic ?? existing.isPublic,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('[trips/PUT /:id]', err);
    return res.status(500).json({ error: 'Failed to update trip.' });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/trips/:id  — delete a trip
// ─────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Trip not found.' });
    if (existing.ownerId !== req.user!.sub) return res.status(403).json({ error: 'Access denied.' });

    await prisma.trip.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error('[trips/DELETE /:id]', err);
    return res.status(500).json({ error: 'Failed to delete trip.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips/:id/clone  — clone a public trip
// ─────────────────────────────────────────────────────────
router.post('/:id/clone', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const source = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { days: { include: { activities: true } } },
    });

    if (!source) return res.status(404).json({ error: 'Source trip not found.' });
    if (!source.isPublic && source.ownerId !== req.user!.sub) {
      return res.status(403).json({ error: 'Cannot clone a private trip.' });
    }

    // Deep clone with preserved structure
    const cloned = await prisma.trip.create({
      data: {
        ownerId: req.user!.sub,
        title: `[Clone] ${source.title}`,
        description: source.description,
        destinationName: source.destinationName,
        startDate: source.startDate,
        endDate: source.endDate,
        totalBudget: source.totalBudget,
        travelStyle: source.travelStyle,
        isPublic: false,
        cloneSourceId: source.id,
        days: {
          create: source.days.map((day) => ({
            dayIndex: day.dayIndex,
            date: day.date,
            activities: {
              create: day.activities.map((act) => ({
                destinationId: act.destinationId,
                startTime: act.startTime,
                endTime: act.endTime,
                estimatedCost: act.estimatedCost,
                sequenceOrder: act.sequenceOrder,
                notes: act.notes,
              })),
            },
          })),
        },
      },
    });

    return res.status(201).json(cloned);
  } catch (err) {
    console.error('[trips/clone]', err);
    return res.status(500).json({ error: 'Failed to clone trip.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/trips/public  — browse public trips feed
// ─────────────────────────────────────────────────────────
router.get('/discover/public', async (req: AuthRequest, res: Response) => {
  try {
    const { destination, page = '1', limit = '10' } = req.query as Record<string, string>;

    const where: any = { isPublic: true };
    if (destination) {
      where.destinationName = { contains: destination, mode: 'insensitive' };
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: { owner: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.trip.count({ where }),
    ]);

    return res.json({
      trips,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[trips/public]', err);
    return res.status(500).json({ error: 'Failed to fetch public trips.' });
  }
});

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const auth_middleware_1 = require("../auth/auth.middleware");
const gis_helper_1 = require("./gis-helper");
const map_service_1 = require("./map.service");
const geo_utils_1 = require("./geo-utils");
const io_1 = require("../../socket/io");
const router = (0, express_1.Router)();
// ─── Check-in ───────────────────────────────────────────
router.post('/checkin', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { destinationId, latitude, longitude, title, description, mood, rating, images, note, } = req.body;
        let lat = latitude;
        let lng = longitude;
        if (destinationId && (lat == null || lng == null)) {
            const dest = await db_1.default.destination.findUnique({ where: { id: destinationId } });
            if (!dest)
                return res.status(404).json({ error: 'Destination not found.' });
            lat = dest.latitude;
            lng = dest.longitude;
        }
        if (lat == null || lng == null) {
            return res.status(400).json({ error: 'latitude and longitude are required.' });
        }
        const checkin = await (0, map_service_1.createCheckInRecord)(req.user.sub, {
            latitude: Number(lat),
            longitude: Number(lng),
            destinationId,
            title,
            description,
            mood,
            rating: rating != null ? Number(rating) : undefined,
            images,
            note,
        });
        return res.status(201).json(checkin);
    }
    catch (err) {
        console.error('[map/checkin POST]', err);
        return res.status(500).json({ error: 'Check-in failed.' });
    }
});
router.get('/checkins', async (req, res) => {
    try {
        const { limit = '30' } = req.query;
        const checkins = await db_1.default.checkIn.findMany({
            include: {
                user: { include: { profile: true } },
                destination: true,
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });
        return res.json(checkins);
    }
    catch (err) {
        console.error('[map/checkins GET]', err);
        return res.status(500).json({ error: 'Failed to fetch check-ins.' });
    }
});
router.get('/checkins/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = '25', limit = '30' } = req.query;
        if (!lat || !lng)
            return res.status(400).json({ error: 'lat and lng are required.' });
        const bbox = (0, gis_helper_1.calculateBoundingBox)({ latitude: Number(lat), longitude: Number(lng) }, Number(radius));
        const checkins = await db_1.default.checkIn.findMany({
            where: {
                latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
            },
            include: {
                user: { include: { profile: true } },
                destination: true,
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });
        return res.json(checkins);
    }
    catch (err) {
        console.error('[map/checkins/nearby]', err);
        return res.status(500).json({ error: 'Failed to fetch nearby check-ins.' });
    }
});
// ─── Live location ──────────────────────────────────────
router.put('/location', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { latitude, longitude, isVisible } = req.body;
        if (latitude == null || longitude == null) {
            return res.status(400).json({ error: 'latitude and longitude are required.' });
        }
        const [location] = await Promise.all([
            db_1.default.location.upsert({
                where: { userId: req.user.sub },
                create: {
                    userId: req.user.sub,
                    latitude,
                    longitude,
                    isVisible: isVisible !== false,
                },
                update: {
                    latitude,
                    longitude,
                    ...(isVisible !== undefined ? { isVisible: !!isVisible } : {}),
                },
                include: { user: { include: { profile: true } } },
            }),
            db_1.default.user.update({
                where: { id: req.user.sub },
                data: { locationSharing: isVisible !== false },
            }),
            db_1.default.locationHistory.create({
                data: {
                    userId: req.user.sub,
                    latitude,
                    longitude,
                },
            }),
        ]);
        (0, io_1.emitToAll)('location:update', {
            userId: req.user.sub,
            latitude,
            longitude,
            name: location.user.profile?.fullName,
            avatar: location.user.profile?.avatarUrl,
            isVisible: location.isVisible,
        });
        return res.json(location);
    }
    catch (err) {
        console.error('[map/location PUT]', err);
        return res.status(500).json({ error: 'Failed to update location.' });
    }
});
router.put('/location/visibility', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { isVisible } = req.body;
        await db_1.default.location.updateMany({
            where: { userId: req.user.sub },
            data: { isVisible: !!isVisible },
        });
        await db_1.default.user.update({
            where: { id: req.user.sub },
            data: { locationSharing: !!isVisible },
        });
        if (!isVisible)
            (0, io_1.emitToAll)('location:leave', { userId: req.user.sub });
        return res.json({ isVisible: !!isVisible });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update visibility.' });
    }
});
router.get('/friends-locations', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const followingRecords = await db_1.default.follower.findMany({
            where: { followerId: req.user.sub },
            select: { followingId: true },
        });
        const followingIds = followingRecords.map((f) => f.followingId);
        const locations = await db_1.default.location.findMany({
            where: { userId: { in: followingIds }, isVisible: true },
            include: { user: { include: { profile: true } } },
        });
        return res.json(locations);
    }
    catch (err) {
        console.error('[map/friends-locations]', err);
        return res.status(500).json({ error: 'Failed to fetch friend locations.' });
    }
});
// ─── Destinations catalog ───────────────────────────────
router.get('/destinations', async (req, res) => {
    try {
        const { lat, lng, radius = '50', category } = req.query;
        const where = {};
        if (category)
            where.category = category;
        if (lat && lng) {
            const bbox = (0, gis_helper_1.calculateBoundingBox)({ latitude: Number(lat), longitude: Number(lng) }, Number(radius));
            where.latitude = { gte: bbox.minLatitude, lte: bbox.maxLatitude };
            where.longitude = { gte: bbox.minLongitude, lte: bbox.maxLongitude };
        }
        const destinations = await db_1.default.destination.findMany({
            where,
            orderBy: { averageRating: 'desc' },
            take: 150,
        });
        return res.json(destinations);
    }
    catch (err) {
        console.error('[map/destinations]', err);
        return res.status(500).json({ error: 'Failed to fetch destinations.' });
    }
});
// ─── Map intelligence feed ──────────────────────────────
router.get('/stories', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const { lat, lng, radius, limit } = req.query;
        const markers = await (0, map_service_1.getStoryMarkers)({
            lat: lat ? Number(lat) : undefined,
            lng: lng ? Number(lng) : undefined,
            radius: radius ? Number(radius) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        return res.json({ stories: markers });
    }
    catch (err) {
        console.error('[map/stories]', err);
        return res.status(500).json({ error: 'Failed to fetch story markers.' });
    }
});
router.get('/stories/:postId', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const post = await db_1.default.post.findFirst({
            where: { id: req.params.postId, deletedAt: null },
            include: {
                author: { include: { profile: true } },
                destination: true,
                _count: { select: { likes: true, comments: true } },
            },
        });
        if (!post)
            return res.status(404).json({ error: 'Post not found.' });
        await db_1.default.post.update({
            where: { id: post.id },
            data: { viewCount: { increment: 1 } },
        });
        const preview = (0, map_service_1.parsePostPreview)(post.content);
        let routePoints = [];
        try {
            const parsed = JSON.parse(post.content);
            routePoints = parsed?.route?.points || [];
        }
        catch { /* */ }
        return res.json({
            post,
            preview,
            routePoints,
            lat: post.latitude,
            lng: post.longitude,
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch story.' });
    }
});
router.get('/heatmap', async (_req, res) => {
    try {
        const points = await (0, map_service_1.getHeatmapPoints)();
        return res.json({ points });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch heatmap.' });
    }
});
router.get('/recommendations', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const recs = await (0, map_service_1.buildMapRecommendations)(req.user?.sub, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
        return res.json({ recommendations: recs });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch recommendations.' });
    }
});
router.get('/travelers/nearby', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const { lat, lng, radius = '50', travelStyle } = req.query;
        if (!lat || !lng)
            return res.status(400).json({ error: 'lat and lng required.' });
        const travelers = await (0, map_service_1.getTravelersNearby)(Number(lat), Number(lng), Number(radius), { travelStyle });
        return res.json({ travelers });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch travelers.' });
    }
});
// ─── Saved places ───────────────────────────────────────
router.get('/saved-places', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { collection } = req.query;
        const places = await db_1.default.savedPlace.findMany({
            where: {
                userId: req.user.sub,
                ...(collection ? { collection } : {}),
            },
            include: { destination: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(places);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch saved places.' });
    }
});
router.post('/saved-places', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { latitude, longitude, title, collection, notes, destinationId } = req.body;
        if (!latitude || !longitude || !title) {
            return res.status(400).json({ error: 'latitude, longitude, title required.' });
        }
        const place = await db_1.default.savedPlace.create({
            data: {
                userId: req.user.sub,
                latitude,
                longitude,
                title,
                collection: collection || 'default',
                notes,
                destinationId: destinationId || null,
            },
        });
        return res.status(201).json(place);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to save place.' });
    }
});
router.delete('/saved-places/:id', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const place = await db_1.default.savedPlace.findUnique({ where: { id: req.params.id } });
        if (!place || place.userId !== req.user.sub) {
            return res.status(404).json({ error: 'Not found.' });
        }
        await db_1.default.savedPlace.delete({ where: { id: req.params.id } });
        return res.status(204).send();
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to delete.' });
    }
});
// ─── Events ─────────────────────────────────────────────
router.get('/events', async (req, res) => {
    try {
        const { lat, lng, radius = '100' } = req.query;
        const where = { startAt: { gte: new Date() } };
        if (lat && lng) {
            const bbox = (0, gis_helper_1.calculateBoundingBox)({ latitude: Number(lat), longitude: Number(lng) }, Number(radius));
            where.latitude = { gte: bbox.minLatitude, lte: bbox.maxLatitude };
            where.longitude = { gte: bbox.minLongitude, lte: bbox.maxLongitude };
        }
        const events = await db_1.default.travelEvent.findMany({
            where,
            include: {
                host: { include: { profile: true } },
                _count: { select: { participants: true } },
            },
            orderBy: { startAt: 'asc' },
            take: 50,
        });
        return res.json(events);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch events.' });
    }
});
router.post('/events/:id/join', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const participant = await db_1.default.eventParticipant.upsert({
            where: {
                eventId_userId: { eventId: req.params.id, userId: req.user.sub },
            },
            create: { eventId: req.params.id, userId: req.user.sub },
            update: {},
        });
        (0, io_1.emitToAll)('event:update', { eventId: req.params.id, action: 'join' });
        return res.json(participant);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to join event.' });
    }
});
// ─── Layer settings ─────────────────────────────────────
router.get('/layer-settings', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const settings = await (0, map_service_1.ensureUserMapSettings)(req.user.sub);
        return res.json(settings);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to load settings.' });
    }
});
router.put('/layer-settings', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { layers } = req.body;
        const settings = await db_1.default.userMapSettings.upsert({
            where: { userId: req.user.sub },
            create: { userId: req.user.sub, layers: layers || geo_utils_1.DEFAULT_MAP_LAYERS },
            update: { layers },
        });
        return res.json(settings);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to save settings.' });
    }
});
// ─── Active trip for map overlay ────────────────────────
router.get('/active-trip', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const trip = await db_1.default.trip.findFirst({
            where: {
                ownerId: req.user.sub,
                endDate: { gte: new Date() },
            },
            include: {
                days: {
                    include: {
                        activities: {
                            include: { destination: true },
                            orderBy: { sequenceOrder: 'asc' },
                        },
                    },
                    orderBy: { dayIndex: 'asc' },
                },
            },
            orderBy: { startDate: 'asc' },
        });
        if (!trip)
            return res.json({ trip: null });
        const route = trip.days.flatMap((day) => day.activities.map((a) => ({
            lat: a.destination.latitude,
            lng: a.destination.longitude,
            name: a.destination.name,
            dayIndex: day.dayIndex,
            time: a.startTime,
        })));
        return res.json({ trip, route });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch active trip.' });
    }
});
// ─── Aggregated map feed ────────────────────────────────
router.get('/feed', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        const latN = lat ? Number(lat) : 21.0285;
        const lngN = lng ? Number(lng) : 105.8542;
        const radiusN = radius ? Number(radius) : 150;
        const [stories, checkins, destinations, recommendations, events, travelers] = await Promise.all([
            (0, map_service_1.getStoryMarkers)({ lat: latN, lng: lngN, radius: radiusN, limit: 80 }),
            db_1.default.checkIn.findMany({
                where: {
                    latitude: {
                        gte: latN - radiusN * 0.009,
                        lte: latN + radiusN * 0.009,
                    },
                },
                include: { user: { include: { profile: true } }, destination: true },
                orderBy: { createdAt: 'desc' },
                take: 40,
            }),
            db_1.default.destination.findMany({ take: 60, orderBy: { averageRating: 'desc' } }),
            (0, map_service_1.buildMapRecommendations)(req.user?.sub, latN, lngN),
            db_1.default.travelEvent.findMany({
                where: { startAt: { gte: new Date() } },
                take: 20,
                include: { host: { include: { profile: true } }, _count: { select: { participants: true } } },
            }),
            (0, map_service_1.getTravelersNearby)(latN, lngN, 80),
        ]);
        return res.json({
            center: { lat: latN, lng: lngN },
            stories,
            checkins,
            destinations,
            recommendations,
            events,
            travelers,
        });
    }
    catch (err) {
        console.error('[map/feed]', err);
        return res.status(500).json({ error: 'Failed to load map feed.' });
    }
});
exports.default = router;

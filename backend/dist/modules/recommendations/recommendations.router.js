"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const auth_middleware_1 = require("../auth/auth.middleware");
const gis_helper_1 = require("../map/gis-helper");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────────────────────
// GET /api/v1/recommendations  — AI-scored recommendations for user
// Content-based + preference filtering
// ─────────────────────────────────────────────────────────
router.get('/', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { limit = '10' } = req.query;
        // Fetch user preferences to personalize recommendations
        const prefs = await db_1.default.travelPreferences.findUnique({
            where: { userId: req.user.sub },
        });
        // Score destinations based on category match with user preferences
        const destinations = await db_1.default.destination.findMany({
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
    }
    catch (err) {
        console.error('[recommendations/GET /]', err);
        return res.status(500).json({ error: 'Failed to fetch recommendations.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/recommendations/nearby
// Spatial proximity search using bounding box + Haversine filter
// ─────────────────────────────────────────────────────────
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = '5', limit = '10' } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng query params are required.' });
        }
        const center = { latitude: Number(lat), longitude: Number(lng) };
        const radiusKm = Number(radius);
        // Step 1: Fast bounding box query against DB index
        const bbox = (0, gis_helper_1.calculateBoundingBox)(center, radiusKm);
        const candidates = await db_1.default.destination.findMany({
            where: {
                latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
            },
        });
        // Step 2: Precise Haversine filter on candidates
        const nearby = candidates
            .map((dest) => ({
            ...dest,
            distanceKm: (0, gis_helper_1.calculateHaversineDistance)(center, { latitude: dest.latitude, longitude: dest.longitude }),
        }))
            .filter((d) => d.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, Number(limit));
        return res.json(nearby);
    }
    catch (err) {
        console.error('[recommendations/nearby]', err);
        return res.status(500).json({ error: 'Failed to fetch nearby destinations.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/recommendations/destinations  — full destination list
// ─────────────────────────────────────────────────────────
router.get('/destinations', async (req, res) => {
    try {
        const { category, q, page = '1', limit = '20' } = req.query;
        const where = {};
        if (category)
            where.category = category;
        if (q)
            where.name = { contains: q, mode: 'insensitive' };
        const [destinations, total] = await Promise.all([
            db_1.default.destination.findMany({
                where,
                orderBy: { averageRating: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            db_1.default.destination.count({ where }),
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
    }
    catch (err) {
        console.error('[recommendations/destinations]', err);
        return res.status(500).json({ error: 'Failed to fetch destinations.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/recommendations/save-trip-recs
// Persist AI recommendations for a trip
// ─────────────────────────────────────────────────────────
router.post('/save-trip-recs', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { tripId, destinationIds } = req.body;
        if (!tripId || !destinationIds?.length) {
            return res.status(400).json({ error: 'tripId and destinationIds are required.' });
        }
        // Verify trip ownership
        const trip = await db_1.default.trip.findUnique({ where: { id: tripId } });
        if (!trip || trip.ownerId !== req.user.sub) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        // Upsert recommendations (delete old, insert new)
        await db_1.default.recommendation.deleteMany({ where: { tripId } });
        const created = await db_1.default.recommendation.createMany({
            data: destinationIds.map((d) => ({
                tripId,
                destinationId: d.id,
                score: d.score,
                recommendationReason: d.reason ?? null,
            })),
        });
        return res.status(201).json({ saved: created.count });
    }
    catch (err) {
        console.error('[recommendations/save-trip-recs]', err);
        return res.status(500).json({ error: 'Failed to save recommendations.' });
    }
});
exports.default = router;

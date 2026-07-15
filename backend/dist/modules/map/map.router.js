"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const auth_middleware_1 = require("../auth/auth.middleware");
const gis_helper_1 = require("./gis-helper");
const agent_tools_1 = require("../ai-agents/tools/agent.tools");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────────────────────
// POST /api/v1/map/checkin  — user checks in at a destination
// ─────────────────────────────────────────────────────────
router.post('/checkin', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { destinationId, note } = req.body;
        if (!destinationId) {
            return res.status(400).json({ error: 'destinationId is required.' });
        }
        const checkin = await db_1.default.checkIn.create({
            data: {
                userId: req.user.sub,
                destinationId,
                note: note || null,
            },
            include: {
                user: { include: { profile: true } },
                destination: true,
            },
        });
        return res.status(201).json(checkin);
    }
    catch (err) {
        console.error('[map/checkin POST]', err);
        return res.status(500).json({ error: 'Check-in failed.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/checkins  — recent public check-ins feed
// ─────────────────────────────────────────────────────────
router.get('/checkins', async (req, res) => {
    try {
        const { limit = '20' } = req.query;
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
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/checkins/nearby  — check-ins near a coordinate
// ─────────────────────────────────────────────────────────
router.get('/checkins/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = '10', limit = '20' } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required.' });
        }
        const center = { latitude: Number(lat), longitude: Number(lng) };
        const bbox = (0, gis_helper_1.calculateBoundingBox)(center, Number(radius));
        const checkins = await db_1.default.checkIn.findMany({
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
    }
    catch (err) {
        console.error('[map/checkins/nearby]', err);
        return res.status(500).json({ error: 'Failed to fetch nearby check-ins.' });
    }
});
// ─────────────────────────────────────────────────────────
// PUT /api/v1/map/location  — update user's live GPS location
// ─────────────────────────────────────────────────────────
router.put('/location', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (latitude == null || longitude == null) {
            return res.status(400).json({ error: 'latitude and longitude are required.' });
        }
        // Upsert live location (one record per user)
        const location = await db_1.default.location.upsert({
            where: { userId: req.user.sub },
            create: { userId: req.user.sub, latitude, longitude },
            update: { latitude, longitude },
        });
        return res.json(location);
    }
    catch (err) {
        console.error('[map/location PUT]', err);
        return res.status(500).json({ error: 'Failed to update location.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/friends-locations  — fetch live friend locations
// ─────────────────────────────────────────────────────────
router.get('/friends-locations', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        // Fetch IDs of users this user follows
        const followingRecords = await db_1.default.follower.findMany({
            where: { followerId: req.user.sub },
            select: { followingId: true },
        });
        const followingIds = followingRecords.map((f) => f.followingId);
        const locations = await db_1.default.location.findMany({
            where: { userId: { in: followingIds } },
            include: { user: { include: { profile: true } } },
        });
        return res.json(locations);
    }
    catch (err) {
        console.error('[map/friends-locations]', err);
        return res.status(500).json({ error: 'Failed to fetch friend locations.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/destinations  — all map markers (destinations)
// ─────────────────────────────────────────────────────────
router.get('/destinations', async (req, res) => {
    try {
        const { lat, lng, radius = '50' } = req.query;
        // If coordinates provided, use spatial filter
        if (lat && lng) {
            const bbox = (0, gis_helper_1.calculateBoundingBox)({ latitude: Number(lat), longitude: Number(lng) }, Number(radius));
            const destinations = await db_1.default.destination.findMany({
                where: {
                    latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                    longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
                },
                orderBy: { averageRating: 'desc' },
            });
            return res.json(destinations);
        }
        // Otherwise return top-rated destinations globally
        const destinations = await db_1.default.destination.findMany({
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
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/safety-warnings  — get active safety warnings (floods, closures)
// ─────────────────────────────────────────────────────────
router.get('/safety-warnings', async (req, res) => {
    try {
        const { lat, lng, radius = '30' } = req.query;
        const now = new Date();
        const whereClause = {
            OR: [
                { expiresAt: null },
                { expiresAt: { gte: now } }
            ]
        };
        if (lat && lng) {
            const center = { latitude: Number(lat), longitude: Number(lng) };
            const radiusKm = Number(radius);
            const bbox = (0, gis_helper_1.calculateBoundingBox)(center, radiusKm);
            const candidates = await db_1.default.safetyWarning.findMany({
                where: {
                    ...whereClause,
                    latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                    longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
                }
            });
            const nearby = candidates
                .map((warn) => ({
                ...warn,
                distanceKm: (0, gis_helper_1.calculateHaversineDistance)(center, { latitude: warn.latitude, longitude: warn.longitude })
            }))
                .filter((warn) => warn.distanceKm <= radiusKm + warn.radiusKm);
            return res.json(nearby);
        }
        const warnings = await db_1.default.safetyWarning.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        return res.json(warnings);
    }
    catch (err) {
        console.error('[map/safety-warnings GET]', err);
        return res.status(500).json({ error: 'Failed to fetch safety warnings.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/map/safety-warning  — create safety warning (admin/testing)
// ─────────────────────────────────────────────────────────
router.post('/safety-warning', async (req, res) => {
    try {
        const { type, description, latitude, longitude, radiusKm, expiresAt } = req.body;
        if (!type || !description || latitude == null || longitude == null) {
            return res.status(400).json({ error: 'type, description, latitude, and longitude are required.' });
        }
        const warn = await db_1.default.safetyWarning.create({
            data: {
                type,
                description,
                latitude: Number(latitude),
                longitude: Number(longitude),
                radiusKm: radiusKm ? Number(radiusKm) : 1.0,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            }
        });
        return res.status(201).json(warn);
    }
    catch (err) {
        console.error('[map/safety-warning POST]', err);
        return res.status(500).json({ error: 'Failed to create safety warning.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/events  — get events/festivals based on coordinates or active
// ─────────────────────────────────────────────────────────
router.get('/events', async (req, res) => {
    try {
        const { lat, lng, radius = '50' } = req.query;
        const now = new Date();
        const whereClause = {
            isPublic: true,
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        };
        if (lat && lng) {
            const center = { latitude: Number(lat), longitude: Number(lng) };
            const radiusKm = Number(radius);
            const bbox = (0, gis_helper_1.calculateBoundingBox)(center, radiusKm);
            const candidates = await db_1.default.event.findMany({
                where: {
                    ...whereClause,
                    latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                    longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
                },
                include: {
                    destination: true
                }
            });
            const nearby = candidates
                .map((evt) => ({
                ...evt,
                distanceKm: (0, gis_helper_1.calculateHaversineDistance)(center, { latitude: evt.latitude, longitude: evt.longitude })
            }))
                .filter((evt) => evt.distanceKm <= radiusKm)
                .sort((a, b) => a.distanceKm - b.distanceKm);
            return res.json(nearby);
        }
        const events = await db_1.default.event.findMany({
            where: whereClause,
            include: { destination: true },
            orderBy: { startDate: 'asc' }
        });
        return res.json(events);
    }
    catch (err) {
        console.error('[map/events GET]', err);
        return res.status(500).json({ error: 'Failed to fetch events.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/map/event  — create local event (admin/testing)
// ─────────────────────────────────────────────────────────
router.post('/event', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { title, description, coverImageUrl, destinationId, latitude, longitude, startDate, endDate, category, maxAttendees } = req.body;
        if (!title || latitude == null || longitude == null || !startDate || !category) {
            return res.status(400).json({ error: 'title, latitude, longitude, startDate, and category are required.' });
        }
        const event = await db_1.default.event.create({
            data: {
                title,
                description,
                coverImageUrl: coverImageUrl || null,
                destinationId: destinationId || null,
                latitude: Number(latitude),
                longitude: Number(longitude),
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                category,
                maxAttendees: maxAttendees ? Number(maxAttendees) : null,
                organizerId: req.user.sub,
            }
        });
        return res.status(201).json(event);
    }
    catch (err) {
        console.error('[map/event POST]', err);
        return res.status(500).json({ error: 'Failed to create event.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/ai-recommendations  — get AI recommendation layer
// ─────────────────────────────────────────────────────────
router.get('/ai-recommendations', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { lat, lng, weather = 'Sunny', temp = '28' } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required.' });
        }
        const center = { latitude: Number(lat), longitude: Number(lng) };
        const radiusKm = 10;
        // 1. Fetch user preferences
        const prefs = await db_1.default.travelPreferences.findUnique({
            where: { userId: req.user.sub },
        });
        const interests = prefs?.activities ?? [];
        // 2. Fetch destinations within 10km radius
        const bbox = (0, gis_helper_1.calculateBoundingBox)(center, radiusKm);
        const candidates = await db_1.default.destination.findMany({
            where: {
                latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
            },
            take: 15,
        });
        const nearbyDests = candidates
            .map((dest) => ({
            ...dest,
            distanceKm: (0, gis_helper_1.calculateHaversineDistance)(center, { latitude: dest.latitude, longitude: dest.longitude }),
        }))
            .filter((d) => d.distanceKm <= radiusKm);
        if (nearbyDests.length === 0) {
            return res.json({ recommendations: [] });
        }
        const placeListStr = nearbyDests
            .map((d, i) => `${i + 1}. [ID: ${d.id}] ${d.name} (${d.category}) - ${d.description || ''} - Rating: ${d.averageRating}`)
            .join('\n');
        const systemPrompt = `You are a Smart Travel Assistant. Analyze the list of nearby destinations and choose the top 3 best places for the user based on their preferences, the current weather, and temperature.
For each recommended place, provide:
1. The place ID.
2. A very short Vietnamese reason (under 120 characters) explaining why this place fits (referencing the weather and/or their interest).
3. A recommendation category/tag.

Response format must be valid JSON matching this structure:
{
  "recommendations": [
    {
      "id": "destination-id",
      "reason": "Giải thích lý do gợi ý...",
      "tag": "Ẩm Thực / Tránh Mưa / Khám Phá"
    }
  ]
}`;
        const userPrompt = `Weather: ${weather}, Temperature: ${temp}°C.
User Interests: ${interests.join(', ') || 'General travel, scenery, local food'}.
Available Nearby Places:
${placeListStr}`;
        let aiResponse = '';
        try {
            const { callAgentLLM } = require('../ai-agents/utils/agent.utils');
            aiResponse = await callAgentLLM(systemPrompt, userPrompt);
        }
        catch (aiErr) {
            console.warn('[AI Recommendations] LLM Call failed, using rule-based fallback:', aiErr);
            const fallbackRecs = nearbyDests.slice(0, 3).map((d) => {
                let reason = `Phù hợp khám phá trong thời tiết ${weather}.`;
                let tag = 'Gợi ý lân cận';
                if (d.category === 'restaurant' || d.category === 'food') {
                    reason = `Thưởng thức ẩm thực ấm cúng tại ${d.name} trong thời tiết ${temp}°C.`;
                    tag = 'Ẩm thực';
                }
                else if (weather.toLowerCase().includes('rain') || weather.toLowerCase().includes('mưa')) {
                    reason = `Điểm tránh mưa an toàn, thích hợp nghỉ ngơi.`;
                    tag = 'Tránh mưa';
                }
                return { id: d.id, reason, tag };
            });
            return res.json({ recommendations: fallbackRecs });
        }
        try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanJson);
            return res.json(result);
        }
        catch (jsonErr) {
            console.error('Failed to parse AI Recommendations JSON:', aiResponse);
            const fallbackRecs = nearbyDests.slice(0, 3).map((d) => ({
                id: d.id,
                reason: `Địa điểm phù hợp dựa trên vị trí của bạn tại ${d.name}.`,
                tag: 'Gợi ý lân cận'
            }));
            return res.json({ recommendations: fallbackRecs });
        }
    }
    catch (err) {
        console.error('[map/ai-recommendations GET]', err);
        return res.status(500).json({ error: 'Failed to fetch AI recommendations.' });
    }
});
// ─────────────────────────────────────────────────────────
// POST /api/v1/map/ai-assistant  — quick answers for destinations
// ─────────────────────────────────────────────────────────
router.post('/ai-assistant', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { destinationId, question } = req.body;
        if (!destinationId || !question) {
            return res.status(400).json({ error: 'destinationId and question are required.' });
        }
        const dest = await db_1.default.destination.findUnique({ where: { id: destinationId } });
        if (!dest) {
            return res.status(404).json({ error: 'Destination not found.' });
        }
        const systemPrompt = `You are a Smart Travel Assistant. Provide a helpful, engaging, and concise Vietnamese response (under 250 characters) to the user's question about the destination: ${dest.name} (${dest.category}).
Description: ${dest.description || ''}
Rating: ${dest.averageRating}
Address: ${dest.address || ''}

Question: "${question}"`;
        const userPrompt = `Hãy trả lời câu hỏi: "${question}" một cách ngắn gọn, súc tích và thực tế nhất.`;
        let aiResponse = '';
        try {
            const { callAgentLLM } = require('../ai-agents/utils/agent.utils');
            aiResponse = await callAgentLLM(systemPrompt, userPrompt);
        }
        catch (aiErr) {
            console.warn('[AI Assistant] LLM Call failed, using mock answer:', aiErr);
            aiResponse = `Địa điểm ${dest.name} rất tuyệt vời với đánh giá ${dest.averageRating}/5. Bạn nên ghé thăm để trải nghiệm trực tiếp!`;
        }
        return res.json({ answer: aiResponse });
    }
    catch (err) {
        console.error('[map/ai-assistant POST]', err);
        return res.status(500).json({ error: 'Failed to get answer from AI Assistant.' });
    }
});
// ─────────────────────────────────────────────────────────
// GET /api/v1/map/weather  — get active weather for location
// ─────────────────────────────────────────────────────────
router.get('/weather', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { location } = req.query;
        if (!location) {
            return res.status(400).json({ error: 'location query param is required' });
        }
        const weatherTool = new agent_tools_1.WeatherTool();
        const result = await weatherTool.execute({ location: String(location) });
        return res.json(result);
    }
    catch (err) {
        console.error('[map/weather GET]', err);
        return res.status(500).json({ error: 'Failed to fetch weather.' });
    }
});
exports.default = router;

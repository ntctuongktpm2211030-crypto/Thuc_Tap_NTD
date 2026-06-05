"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const auth_middleware_1 = require("../auth/auth.middleware");
const geo_utils_1 = require("../map/geo-utils");
const router = (0, express_1.Router)();
router.get('/:slug', auth_middleware_1.optionalAuth, async (req, res) => {
    try {
        const slug = req.params.slug;
        let destination = await db_1.default.destination.findUnique({ where: { slug } });
        if (!destination) {
            destination = await db_1.default.destination.findFirst({
                where: { name: { contains: slug.replace(/-/g, ' '), mode: 'insensitive' } },
            });
        }
        if (!destination) {
            return res.status(404).json({ error: 'Destination not found.' });
        }
        const [stories, checkins, events, nearby] = await Promise.all([
            db_1.default.post.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        { destinationId: destination.id },
                        {
                            latitude: {
                                gte: destination.latitude - 0.5,
                                lte: destination.latitude + 0.5,
                            },
                        },
                    ],
                },
                include: {
                    author: { include: { profile: true } },
                    _count: { select: { likes: true, comments: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            db_1.default.checkIn.findMany({
                where: { destinationId: destination.id },
                include: { user: { include: { profile: true } } },
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
            db_1.default.travelEvent.findMany({
                where: { destinationId: destination.id, startAt: { gte: new Date() } },
                include: { _count: { select: { participants: true } } },
                take: 10,
            }),
            db_1.default.destination.findMany({
                where: {
                    id: { not: destination.id },
                    latitude: {
                        gte: destination.latitude - 1.2,
                        lte: destination.latitude + 1.2,
                    },
                },
                take: 8,
                orderBy: { averageRating: 'desc' },
            }),
        ]);
        return res.json({
            destination,
            stories,
            checkins,
            events,
            nearby,
            stats: {
                storyCount: stories.length,
                checkinCount: checkins.length,
                eventCount: events.length,
            },
        });
    }
    catch (err) {
        console.error('[destinations/:slug]', err);
        return res.status(500).json({ error: 'Failed to load destination.' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, latitude, longitude, category, description, region, coverImageUrl } = req.body;
        if (!name || latitude == null || longitude == null) {
            return res.status(400).json({ error: 'name, latitude, longitude required.' });
        }
        const slug = (0, geo_utils_1.slugify)(name);
        const destination = await db_1.default.destination.upsert({
            where: { slug },
            create: {
                slug,
                name,
                latitude,
                longitude,
                category: category || 'attraction',
                description,
                region,
                coverImageUrl,
            },
            update: { latitude, longitude, description, region, coverImageUrl },
        });
        return res.status(201).json(destination);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to create destination.' });
    }
});
exports.default = router;

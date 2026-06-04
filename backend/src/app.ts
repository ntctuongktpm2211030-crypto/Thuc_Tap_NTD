import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';

// ─── Import all module routers ───
import authRouter from './modules/auth/auth.router';
import tripsRouter from './modules/trips/trips.router';
import postsRouter from './modules/posts/posts.router';
import mapRouter from './modules/map/map.router';
import recommendationsRouter from './modules/recommendations/recommendations.router';
import socialRouter from './modules/social/social.router';
import analyticsRouter from './modules/analytics/analytics.router';

const app = express();

// ─── Global Middleware ───
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ───
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'SmartTravel API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────
// Authentication: register / login / refresh / me
app.use('/api/v1/auth', authRouter);

// Trips: CRUD + AI generation + TSP optimization + cloning
app.use('/api/v1/trips', tripsRouter);

// Posts: blog posts + likes + bookmarks + comments
app.use('/api/v1/posts', postsRouter);

// Map/GIS: check-ins + live location + nearby + destinations
app.use('/api/v1/map', mapRouter);

// Recommendations: AI-scored + spatial proximity + destination catalog
app.use('/api/v1/recommendations', recommendationsRouter);

// Social: profile, follow/unfollow, notifications, user search
app.use('/api/v1/social', socialRouter);

// Analytics: platform stats, AI usage, GIS heatmap, trip trends
app.use('/api/v1/analytics', analyticsRouter);

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found.',
    hint: 'Available base paths: /api/v1/auth, /api/v1/trips, /api/v1/posts, /api/v1/map, /api/v1/recommendations, /api/v1/social',
  });
});

// ─── Centralized Error Handling ──────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

export default app;

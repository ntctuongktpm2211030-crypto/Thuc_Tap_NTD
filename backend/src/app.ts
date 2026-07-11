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
import chatbotRouter from './modules/chatbot/routes/chatbot.router';
import itineraryRouter from './modules/itinerary/routes/itinerary.router';
import userRecommendationRouter from './modules/recommendations/routes/recommendation.router';
import travelHistoryRouter from './modules/travel-history/routes/travel-history.router';
import favoriteFoodRouter from './modules/favorite-foods/routes/favorite-food.router';
import savedPlaceRouter from './modules/saved-places/routes/saved-place.router';
import feedbackRouter from './modules/feedback/routes/feedback.router';
import toolCallRouter from './modules/tool-calls/routes/tool-call.router';
import cacheRouter from './modules/cache/routes/cache.router';
import aiAgentRouter from './modules/ai-agents/routes/agent.router';
import ragRouter from './modules/rag/routes/rag.router';

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

app.get('/restart', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Restarting backend server...' });
  setTimeout(() => {
    process.exit(0);
  }, 500);
});

import fs from 'fs';
app.get('/clean-json', (_req: Request, res: Response) => {
  try {
    const filePath = 'd:/Thuc_Tap_NDT/knowledge-builder/import-data-camau.json';
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    function removeAccents(str: string): string {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    }

    const keywords = [
      'phú quốc', 'phụ quốc', 'hòn khô', 'cô tô', 'núi cấm', 'núi sam', 'núi mây',
      'cáp treo', 'thác', 'đèo', 'lặn biển', 'trường sa', 'hoàng sa', 'ngọc điểm',
      'ngũ hành', 'trà sư', 'tắm biển'
    ];

    const cleanData = data.filter((item: any) => {
      const titleClean = removeAccents(item.title.toLowerCase());
      const contentClean = removeAccents(item.content.toLowerCase());

      const hasBadKeyword = keywords.some(term => {
        const termClean = removeAccents(term.toLowerCase());
        return titleClean.includes(termClean) || contentClean.includes(termClean);
      });
      if (hasBadKeyword) return false;

      if (titleClean.includes('nui') || /\bnui\b/i.test(contentClean)) {
        if (!titleClean.includes('an giang') && !contentClean.includes('an giang') && !contentClean.includes('hon khoai') && !contentClean.includes('hon da bac')) {
          return false;
        }
      }

      return true;
    });

    const deletedCount = data.length - cleanData.length;
    fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');

    res.status(200).json({
      status: 'success',
      originalCount: data.length,
      cleanCount: cleanData.length,
      deletedCount
    });
  } catch (err: any) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
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

// Chatbot: Core AI Conversation + AI Memory
app.use('/api/v1/chatbot', chatbotRouter);

// Itinerary: Itineraries + Days + Activities
app.use('/api/v1/itineraries', itineraryRouter);

// Recommendations (User Custom): Add + Update + Delete + List
app.use('/api/v1/user-recommendations', userRecommendationRouter);

// Travel History: Visited Locations + Dates + Ratings + Costs
app.use('/api/v1/travel-history', travelHistoryRouter);

// Favorite Foods: Food Name + Region + Description + Rating
app.use('/api/v1/favorite-foods', favoriteFoodRouter);

// Saved Places: Place Name + Category + Coordinates + Address + Image
app.use('/api/v1/saved-places', savedPlaceRouter);

// Feedback: AI Chat Messages Rating & Comments
app.use('/api/v1/feedback', feedbackRouter);

// ToolCall: AI Chatbot Tool Usage Logs
app.use('/api/v1/tool-calls', toolCallRouter);

// Cache: Place, Food and Blog API Caching (TTL-based)
app.use('/api/v1/cache', cacheRouter);

// AI Agent: Multi-agent execution (Strategy & DI Pattern)
app.use('/api/v1/ai-agents', aiAgentRouter);

// RAG: Retrieval-Augmented Generation (Embeddings + Vector Storage + Retriever + Prompt Builder)
app.use('/api/v1/rag', ragRouter);

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

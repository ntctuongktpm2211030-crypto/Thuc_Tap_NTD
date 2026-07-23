import './db-sync';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import fs from 'fs';
import path from 'path';

// Redirect console logs to a file for headless debugging
const logFile = path.resolve(__dirname, '../backend_console.log');
const originalWrite = process.stdout.write;
const originalErrWrite = process.stderr.write;

process.stdout.write = function(chunk: any, encoding?: any, callback?: any): boolean {
  try { fs.appendFileSync(logFile, chunk); } catch(e) {}
  return originalWrite.call(process.stdout, chunk, encoding, callback);
};
process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
  try { fs.appendFileSync(logFile, chunk); } catch(e) {}
  return originalErrWrite.call(process.stderr, chunk, encoding, callback);
};


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Bind Socket.io Server to the http server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

const socketUserMap = new Map<string, string>();

// Event-driven WebSocket Manager
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // Register user for real-time alerts & notifications
  socket.on('register_user', (userId: string) => {
    if (userId) {
      socket.join(`user:${userId}`);
      socketUserMap.set(socket.id, userId);
      console.log(`[Socket.IO] Socket client ${socket.id} registered to user room: user:${userId}`);
    }
  });

  // User online heartbeat
  socket.on('ping_location', (data: { userId: string; lat: number; lng: number }) => {
    if (data && data.userId) {
      socketUserMap.set(socket.id, data.userId);
    }
    // Broadcast user location to friends/subscribers
    socket.broadcast.emit('friend_location_updated', data);
  });

  // Collaborative trip editing room coordination
  socket.on('join_trip_room', (tripId: string) => {
    socket.join(`trip:${tripId}`);
    console.log(`Client ${socket.id} joined co-planning room for trip: ${tripId}`);
  });

  // Broadcast collaborative edits in real time
  socket.on('trip_updated', (data: { tripId: string; updateDetails: any }) => {
    io.to(`trip:${data.tripId}`).emit('trip_reconciled', data.updateDetails);
  });

  // Real-time Chat Messaging
  socket.on('send_message', (messageData: { conversationId: string; senderId: string; content: string }) => {
    io.to(`conversation:${messageData.conversationId}`).emit('message_received', messageData);
  });

  socket.on('join_chat_room', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
    const userId = socketUserMap.get(socket.id);
    if (userId) {
      io.emit('friend_offline', { userId });
      socketUserMap.delete(socket.id);
      console.log(`[Socket.IO] Socket client ${socket.id} left. Broadcasted friend_offline for user: ${userId}`);
    }
  });
});

import { autoSeed } from './config/seed';
import { runGeocodingPipeline } from './scripts/extract-and-geocode';

// Call geocoding pipeline and auto-seed on startup
runGeocodingPipeline()
  .then(() => autoSeed())
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Modular Monolith Core Server listening on port ${PORT}`);
      startCacheCleanupJob();
    });
  })
  .catch(err => {
    console.error('Failed to start server components:', err);
    server.listen(PORT, () => {
      console.log(`🚀 Modular Monolith Core Server listening on port ${PORT}`);
      startCacheCleanupJob();
    });
  });

// Tác vụ dọn dẹp các bản ghi Cache đã hết hạn định kỳ
import { CacheService } from './modules/cache/services/cache.service';
const cacheService = new CacheService();

function startCacheCleanupJob() {
  console.log('[CacheCleanupJob] Đã kích hoạt tác vụ quét dọn cache hết hạn định kỳ.');
  
  // Chạy ngay lần đầu tiên sau khi khởi động server
  setTimeout(cleanExpiredCache, 5000); // Trì hoãn 5 giây để db ổn định

  // Thiết lập chu kỳ 6 giờ chạy một lần (21600000 ms)
  setInterval(cleanExpiredCache, 6 * 60 * 60 * 1000);
}

async function cleanExpiredCache() {
  console.log(`[CacheCleanupJob] [${new Date().toISOString()}] Bắt đầu dọn dẹp cache quá hạn...`);
  try {
    const resPlace = await cacheService.clearExpired('place');
    const resFood = await cacheService.clearExpired('food');
    const resBlog = await cacheService.clearExpired('blog');
    console.log(`[CacheCleanupJob] Dọn dẹp cache hoàn tất.`, {
      placeDeleted: resPlace?.count || 0,
      foodDeleted: resFood?.count || 0,
      blogDeleted: resBlog?.count || 0
    });
  } catch (err) {
    console.error('[CacheCleanupJob] Gặp lỗi khi dọn dẹp cache:', err);
  }
}


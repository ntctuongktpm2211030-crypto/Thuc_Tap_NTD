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

// Event-driven WebSocket Manager
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // User online heartbeat
  socket.on('ping_location', (data: { userId: string; lat: number; lng: number }) => {
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
    });
  })
  .catch(err => {
    console.error('Failed to start server components:', err);
    server.listen(PORT, () => {
      console.log(`🚀 Modular Monolith Core Server listening on port ${PORT}`);
    });
  });

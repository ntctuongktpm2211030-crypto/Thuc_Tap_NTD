import http from 'http';
import { Server } from 'socket.io';
import app from './app';

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

server.listen(PORT, () => {
  console.log(`🚀 Modular Monolith Core Server listening on port ${PORT}`);
});

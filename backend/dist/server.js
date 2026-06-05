"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const io_1 = require("./socket/io");
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Bind Socket.io Server to the http server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
(0, io_1.setSocketServer)(io);
// Event-driven WebSocket Manager
io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);
    socket.on('location:join', (userId) => {
        if (userId)
            socket.join(`user:${userId}`);
        socket.broadcast.emit('friend:online', { userId, socketId: socket.id });
    });
    socket.on('location:leave', (userId) => {
        if (userId)
            socket.leave(`user:${userId}`);
        socket.broadcast.emit('location:leave', { userId });
    });
    socket.on('ping_location', (data) => {
        socket.broadcast.emit('location:update', data);
        socket.broadcast.emit('friend_location_updated', data);
    });
    // Collaborative trip editing room coordination
    socket.on('join_trip_room', (tripId) => {
        socket.join(`trip:${tripId}`);
        console.log(`Client ${socket.id} joined co-planning room for trip: ${tripId}`);
    });
    // Broadcast collaborative edits in real time
    socket.on('trip_updated', (data) => {
        io.to(`trip:${data.tripId}`).emit('trip_reconciled', data.updateDetails);
    });
    // Real-time Chat Messaging
    socket.on('send_message', (messageData) => {
        io.to(`conversation:${messageData.conversationId}`).emit('message_received', messageData);
    });
    socket.on('join_chat_room', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
    });
    socket.on('disconnect', () => {
        console.log(`Socket Client Disconnected: ${socket.id}`);
    });
});
const seed_1 = require("./config/seed");
// Call auto-seed on startup
(0, seed_1.autoSeed)().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Modular Monolith Core Server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to auto-seed database:', err);
    server.listen(PORT, () => {
        console.log(`🚀 Modular Monolith Core Server listening on port ${PORT}`);
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./db-sync");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Redirect console logs to a file for headless debugging
const logFile = path_1.default.resolve(__dirname, '../backend_console.log');
const originalWrite = process.stdout.write;
const originalErrWrite = process.stderr.write;
process.stdout.write = function (chunk, encoding, callback) {
    try {
        fs_1.default.appendFileSync(logFile, chunk);
    }
    catch (e) { }
    return originalWrite.call(process.stdout, chunk, encoding, callback);
};
process.stderr.write = function (chunk, encoding, callback) {
    try {
        fs_1.default.appendFileSync(logFile, chunk);
    }
    catch (e) { }
    return originalErrWrite.call(process.stderr, chunk, encoding, callback);
};
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Bind Socket.io Server to the http server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// Event-driven WebSocket Manager
io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);
    // User online heartbeat
    socket.on('ping_location', (data) => {
        // Broadcast user location to friends/subscribers
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
const extract_and_geocode_1 = require("./scripts/extract-and-geocode");
// Call geocoding pipeline and auto-seed on startup
(0, extract_and_geocode_1.runGeocodingPipeline)()
    .then(() => (0, seed_1.autoSeed)())
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

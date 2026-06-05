"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketServer = setSocketServer;
exports.getIO = getIO;
exports.emitToAll = emitToAll;
exports.emitToRoom = emitToRoom;
let ioInstance = null;
function setSocketServer(server) {
    ioInstance = server;
}
function getIO() {
    return ioInstance;
}
function emitToAll(event, payload) {
    ioInstance?.emit(event, payload);
}
function emitToRoom(room, event, payload) {
    ioInstance?.to(room).emit(event, payload);
}

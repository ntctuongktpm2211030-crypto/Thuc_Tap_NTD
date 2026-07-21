import { Request } from 'express';

export function broadcastDashboardEvent(req: Request, type: string, payload: any) {
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('dashboard:event', { type, payload });
      console.log(`[Socket.IO] Broadcasted event '${type}' to dashboard clients.`);
    } else {
      console.warn(`[Socket.IO] Server instance not found on app, cannot broadcast event '${type}'.`);
    }
  } catch (err) {
    console.error('[Socket.IO] Broadcast failed:', err);
  }
}

export function sendRealTimeNotification(req: Request, recipientId: string, notification: any) {
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${recipientId}`).emit('new_notification', notification);
      console.log(`[Socket.IO] Pushed real-time notification to user:${recipientId}`);
    } else {
      console.warn('[Socket.IO] Server instance not found on app, cannot push notification.');
    }
  } catch (err) {
    console.error('[Socket.IO] Real-time notification push failed:', err);
  }
}

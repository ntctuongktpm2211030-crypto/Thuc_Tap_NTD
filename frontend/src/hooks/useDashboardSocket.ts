import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export function useDashboardSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to the socket server (dynamically matching backend host/port)
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';

    const socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to analytics broadcast gateway.');
    });

    socket.on('dashboard:event', (data: { type: string; payload: any }) => {
      console.log(`[Socket.IO] Real-time event received: '${data.type}'`, data.payload);

      // Invalidate specific cache keys to trigger auto-refetches without full page reloads
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'comparison'] });
      
      if (data.type === 'user') {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'users'] });
      } else if (data.type === 'checkin') {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'checkins'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'trending'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'gis'] });
      } else if (data.type === 'post') {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'posts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'top-posts'] });
      } else if (data.type === 'follower' || data.type === 'like' || data.type === 'comment' || data.type === 'review') {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'interactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'top-users'] });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from analytics gateway.');
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}

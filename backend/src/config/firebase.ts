import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;

if (projectId) {
  const apps = getApps();
  if (apps.length === 0) {
    initializeApp({
      projectId: projectId,
    });
    console.log('[Firebase] Admin SDK initialized successfully with projectId:', projectId);
  }
} else {
  console.warn('[Firebase] Warning: FIREBASE_PROJECT_ID environment variable is missing. Google Auth will fail.');
}

// Export the auth service directly
export const firebaseAuth = getAuth();

import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || 'thuc-tap-ndt';

if (getApps().length === 0) {
  initializeApp({
    projectId: projectId,
  });
  console.log('[Firebase] Admin SDK initialized successfully with projectId:', projectId);
}

export const firebaseAuth = getAuth();


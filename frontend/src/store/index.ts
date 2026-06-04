import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Map state stub — will be expanded to a proper slice when map features need store integration
const mapReducer = (
  state = { selectedLocation: null as any, checkins: [] as any[] },
  _action: { type: string }
) => state;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Allow non-serializable values in auth state (Date objects from JWTs, etc.)
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;

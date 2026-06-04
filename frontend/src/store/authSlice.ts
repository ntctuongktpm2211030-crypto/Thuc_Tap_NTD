import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, LoginPayload, RegisterPayload } from '../services/smartTravel.service';

// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Rehydrate from localStorage on startup
const storedUser = authService.getStoredUser();

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: !!storedUser && authService.isLoggedIn(),
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────────────────
// ASYNC THUNKS
// ─────────────────────────────────────────────────────────

/** Login thunk — calls backend, stores tokens, returns user */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await authService.login(payload);
      authService.saveSession(res);
      return res.user;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
      return rejectWithValue(message);
    }
  }
);

/** Register thunk — creates account and auto-logs in */
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await authService.register(payload);
      authService.saveSession(res);
      return res.user;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// ─────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      authService.clearSession();
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as AuthUser;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // REGISTER
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as AuthUser;
        state.isAuthenticated = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

import { create } from 'zustand';
import api from '../utils/api';

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('nex_token') || null,
  isAuthenticated: !!localStorage.getItem('nex_token'),
  loading: false,
  error: null,

  // Register new user
  registerUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', userData);
      localStorage.setItem('nex_token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isAuthenticated: true, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', loading: false });
    }
  },

  // Login existing user
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('nex_token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isAuthenticated: true, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Invalid Credentials', loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('nex_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: (updates) =>
    set((state) => ({ user: { ...state.user, ...updates } })),

  clearError: () => set({ error: null }),

  // Rehydrate from localStorage on app boot
  rehydrate: async () => {
    const token = localStorage.getItem('nex_token');
    if (!token) {
      set({ isAuthenticated: false, loading: false });
      return;
    }

    set({ loading: true });
    try {
      // Validate token with backend and fetch profile
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, loading: false });
    } catch (err) {
      console.error('Rehydration failed:', err);
      // If token invalid, purge it
      localStorage.removeItem('nex_token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },
}));

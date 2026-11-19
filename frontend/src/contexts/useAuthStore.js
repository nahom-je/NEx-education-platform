import { create } from 'zustand';
import api from '../utils/api';

// ─── Auth Store ─────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('nex_token') || null,
  isAuthenticated: !!localStorage.getItem('nex_token'),
  loading: false,                                    // For button spinners on login/register/password
  isRehydrating: !!localStorage.getItem('nex_token'), // ONLY for initial page load token check
  error: null,
  mustChangePassword: false,

  // Register new student with phone
  registerUser: async ({ name, phone, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, phone, password });
      localStorage.setItem('nex_token', res.data.token);
      set({
        user: res.data.user,
        token: res.data.token,
        isAuthenticated: true,
        loading: false,
        mustChangePassword: !!res.data.user?.must_change_password
      });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Registration failed',
        loading: false
      });
      return false;
    }
  },

  // Login existing student/admin with phone
  login: async (phone, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { phone, password });
      localStorage.setItem('nex_token', res.data.token);
      set({
        user: res.data.user,
        token: res.data.token,
        isAuthenticated: true,
        loading: false,
        mustChangePassword: !!res.data.user?.must_change_password
      });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Invalid phone number or password.',
        loading: false
      });
      return false;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      set((state) => ({
        loading: false,
        mustChangePassword: false,
        user: state.user ? { ...state.user, must_change_password: false } : null
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to update password.',
        loading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('nex_token');
    set({ user: null, token: null, isAuthenticated: false, mustChangePassword: false });
  },

  updateProfile: (updates) =>
    set((state) => ({ user: { ...state.user, ...updates } })),

  clearError: () => set({ error: null }),

  // Rehydrate on initial boot
  rehydrate: async () => {
    const token = localStorage.getItem('nex_token');
    if (!token) {
      set({ isAuthenticated: false, isRehydrating: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      set({
        user: res.data,
        isAuthenticated: true,
        isRehydrating: false,
        mustChangePassword: !!res.data?.must_change_password
      });
    } catch (err) {
      console.error('Rehydration failed:', err);
      localStorage.removeItem('nex_token');
      set({ user: null, token: null, isAuthenticated: false, isRehydrating: false });
    }
  },
}));

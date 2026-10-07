import { create } from 'zustand';
import api from '../utils/api';

export const useResourceStore = create((set, get) => ({
  resources: [],
  currentResource: null,
  loading: false,
  error: null,

  fetchResources: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/resources', { params: filters });
      set({ resources: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch resources', loading: false });
      console.error(err);
    }
  },

  fetchResourceById: async (id) => {
    set({ loading: true, error: null, currentResource: null });
    try {
      const { data } = await api.get(`/resources/${id}`);
      set({ currentResource: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch resource', loading: false });
    }
  },

  uploadResource: async (formData) => {
    set({ loading: true, error: null });
    try {
      // Axios automatically sets "multipart/form-data" and the correct boundary when sending FormData objects
      const { data } = await api.post('/resources', formData);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Upload failed', loading: false });
      throw err;
    }
  },

  rateResource: async (id, score) => {
    try {
      const { data } = await api.post(`/resources/${id}/rate`, { score });
      set((state) => ({
        currentResource: state.currentResource ? { ...state.currentResource, ratings: data } : null
      }));
    } catch (err) {
      console.error('Failed to rate', err);
    }
  },

  commentResource: async (id, text) => {
    try {
      const { data } = await api.post(`/resources/${id}/comment`, { text });
      set((state) => ({
        currentResource: state.currentResource ? { ...state.currentResource, comments: data } : null
      }));
    } catch (err) {
      console.error('Failed to comment', err);
    }
  },

  // --- Admin Actions ---
  fetchPendingResources: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/admin/resources/pending');
      set({ resources: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch pending resources', loading: false });
      console.error(err);
      return [];
    }
  },

  approveResource: async (id) => {
    try {
      await api.put(`/admin/resources/${id}/approve`);
      set((state) => ({
        resources: state.resources.filter((r) => r._id !== id)
      }));
    } catch (err) {
      console.error('Failed to approve resource', err);
    }
  },

  rejectResource: async (id) => {
    try {
      await api.put(`/admin/resources/${id}/reject`);
      set((state) => ({
        resources: state.resources.filter((r) => r._id !== id)
      }));
    } catch (err) {
      console.error('Failed to reject resource', err);
    }
  }
}));

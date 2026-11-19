import { create } from 'zustand';
import api from '../utils/api';

export const useResourceStore = create((set, get) => ({
  resources: [],
  currentResource: null,
  categories: [],
  courses: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    try {
      const { data } = await api.get('/categories');
      set({ categories: data });
      return data;
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      return [];
    }
  },

  fetchCourses: async (categoryId, semester = null) => {
    if (!categoryId) {
      set({ courses: [] });
      return [];
    }
    try {
      const params = semester ? { semester } : {};
      const { data } = await api.get(`/categories/${categoryId}/courses`, { params });
      set({ courses: data });
      return data;
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      set({ courses: [] });
      return [];
    }
  },

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
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch resource', loading: false });
    }
  },

  downloadResource: async (id) => {
    try {
      const { data } = await api.get(`/resources/${id}/download`);
      // Update local download counts optimistically in state
      set((state) => ({
        resources: state.resources.map((r) =>
          r._id === id || r.id === id ? { ...r, downloads: (r.downloads || 0) + 1 } : r
        ),
        currentResource:
          state.currentResource && (state.currentResource._id === id || state.currentResource.id === id)
            ? { ...state.currentResource, downloads: (state.currentResource.downloads || 0) + 1 }
            : state.currentResource
      }));
      return data.fileUrl;
    } catch (err) {
      console.error('Failed to record download:', err);
      return null;
    }
  },

  uploadResource: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/resources', formData);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Upload failed', loading: false });
      throw err;
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
        resources: state.resources.filter((r) => (r._id || r.id) !== id)
      }));
    } catch (err) {
      console.error('Failed to approve resource', err);
    }
  },

  rejectResource: async (id) => {
    try {
      await api.put(`/admin/resources/${id}/reject`);
      set((state) => ({
        resources: state.resources.filter((r) => (r._id || r.id) !== id)
      }));
    } catch (err) {
      console.error('Failed to reject resource', err);
    }
  }
}));

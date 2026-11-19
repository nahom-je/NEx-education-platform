// frontend/src/contexts/usePaymentStore.js
// Manages payment state: settings, drafts, claiming, access checks.

import { create } from 'zustand'
import api from '../utils/api'

export const usePaymentStore = create((set, get) => ({
  settings: null,
  myAccess: [],       // array of course_access rows
  myRequests: [],     // array of payment_requests
  loadingSettings: false,
  loadingAccess: false,

  fetchSettings: async () => {
    set({ loadingSettings: true })
    try {
      const { data } = await api.get('/settings')
      set({ settings: data })
    } catch (err) {
      console.error('fetchSettings error', err.message)
    } finally {
      set({ loadingSettings: false })
    }
  },

  fetchMyAccess: async () => {
    set({ loadingAccess: true })
    try {
      const { data } = await api.get('/payments/my-access')
      set({ myAccess: data || [] })
    } catch (err) {
      console.error('fetchMyAccess error', err.message)
    } finally {
      set({ loadingAccess: false })
    }
  },

  fetchMyRequests: async () => {
    try {
      const { data } = await api.get('/payments/my')
      set({ myRequests: data || [] })
    } catch (err) {
      console.error('fetchMyRequests error', err.message)
    }
  },

  createDraft: async ({ courseIds, packageCount, packageNames, fullName, phone }) => {
    const { data } = await api.post('/payments/create', { courseIds, packageCount, packageNames, fullName, phone })
    return data  // { request, courses, amount, paymentCode }
  },

  claimRequest: async (requestId, { transactionId, paymentMethod }) => {
    const { data } = await api.post(`/payments/${requestId}/claim`, { transactionId, paymentMethod })
    return data
  },

  cancelRequest: async (requestId) => {
    const { data } = await api.post(`/payments/${requestId}/cancel`)
    return data
  },

  remindAdmin: async (requestId) => {
    const { data } = await api.post(`/payments/${requestId}/remind`)
    return data
  },

  getCourseStatus: async (courseId) => {
    const { data } = await api.get(`/payments/course-status/${courseId}`)
    return data  // { status: 'locked'|'pending'|'unlocked'|'rejected'|'revoked', request? }
  },

  // Called from Socket.io: mark course as unlocked without refetch
  onCourseApproved: (courseIds) => {
    set((state) => ({
      myAccess: [
        ...state.myAccess,
        ...courseIds.map(id => ({ course_id: id, status: 'unlocked' }))
      ]
    }))
  },

  hasAccess: (courseId) => {
    const { myAccess } = get()
    return myAccess.some(a => a.course_id === courseId && a.status === 'unlocked')
  }
}))


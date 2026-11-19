// Centralized API and Socket URLs
// Handles cases whether VITE_API_URL has /api suffix or trailing slash or not
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_BASE = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE).replace(/\/api\/?$/, '').replace(/\/$/, '')

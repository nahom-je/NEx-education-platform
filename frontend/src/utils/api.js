import axios from 'axios';
import { API_BASE } from './config';
import { getDeviceId, getDeviceName } from './device';

// Configure Axios instance
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to automatically attach the token and device identification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers['X-Device-Id'] = deviceId;
      config.headers['X-Device-Name'] = getDeviceName();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

/**
 * API client for backend communication
 */
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/token', credentials),
  getMe: () => api.get('/auth/me'),
  getMeWithToken: (token) => api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  verify: () => api.get('/auth/verify'),
};

// Documents API calls
export const documentsAPI = {
  upload: (formData) => 
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  uploadBatch: (formData) => 
    api.post('/documents/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  list: (params = {}) => api.get('/documents/', { params }),
  get: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  getThumbnail: (id, size = 960) => api.get(`/documents/${id}/thumbnail?size=${size}`, { responseType: 'blob' }),
  getCategories: () => api.get('/documents/categories'),
  processPending: () => api.post('/documents/process-pending'),
};

// Search API calls
export const searchAPI = {
  search: (query) => api.post('/search/', query),
  getHistory: () => api.get('/search/history'),
};

// Notifications API calls
export const notificationsAPI = {
  list: () => api.get('/notifications/notifications'),
  send: (notificationData) => api.post('/notifications/send', notificationData),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
  root: () => api.get('/'),
};

export default api;
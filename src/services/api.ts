import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Books API
export const booksApi = {
  getAll: (params?: Record<string, string>) => api.get('/books', { params }),
  getById: (id: string) => api.get(`/books/${id}`),
  create: (data: Record<string, unknown>) => api.post('/books', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/books/${id}`, data),
  delete: (id: string) => api.delete(`/books/${id}`),
};

// Members API
export const membersApi = {
  getAll: (params?: Record<string, string>) => api.get('/members', { params }),
  getById: (id: string) => api.get(`/members/${id}`),
  create: (data: Record<string, unknown>) => api.post('/members', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
};

// Borrow API
export const borrowApi = {
  issue: (data: { studentId: string; bookId: string; dueDate: string }) => api.post('/borrow/issue', data),
  return: (id: string, data?: { finePaid?: boolean }) => api.post(`/borrow/return/${id}`, data),
  getActive: (params?: Record<string, string>) => api.get('/borrow/active', { params }),
  getOverdue: () => api.get('/borrow/overdue'),
  getHistory: (params?: Record<string, string>) => api.get('/borrow/history', { params }),
  getStudentBorrows: (studentId: string) => api.get(`/borrow/student/${studentId}`),
};

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  sendReminder: (borrowId: string) => api.post(`/notifications/reminder/${borrowId}`),
  sendBulkReminders: () => api.post('/notifications/reminders/bulk'),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, unknown>) => api.put('/settings', data),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentIssues: () => api.get('/dashboard/recent-issues'),
};

export default api;

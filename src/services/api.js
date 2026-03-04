import axios from 'axios';

const API_BASE = 'https://nexflow-2-0-backend.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('nexflow_tokens') || 'null');
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('nexflow_tokens') || 'null');
        if (!tokens?.refresh_token) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: tokens.refresh_token,
        });
        localStorage.setItem('nexflow_tokens', JSON.stringify(data));
        processQueue(null, data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('nexflow_tokens');
        localStorage.removeItem('nexflow_user');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: (data) => api.post('/auth/logout', data),
  me: () => api.get('/auth/me'),
};

export const chat = {
  listConversations: () => api.get('/chat/conversations'),
  createConversation: (title) => api.post('/chat/conversations', { title }),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
  sendMessage: async (conversationId, content, onEvent) => {
    const tokens = JSON.parse(localStorage.getItem('nexflow_tokens') || 'null');
    const response = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`,
        },
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send message');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      let currentEvent = 'message';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim();
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          onEvent({ event: currentEvent, data });
          currentEvent = 'message';
        }
      }
    }
  },
};

export const integrations = {
  list: () => api.get('/integrations/'),
  connected: () => api.get('/integrations/connected'),
  authorize: (id) => api.get(`/integrations/${id}/oauth/authorize`),
  disconnect: (id) => api.delete(`/integrations/${id}/disconnect`),
  tools: (id) => api.get(`/integrations/${id}/tools`),
};

export default api;

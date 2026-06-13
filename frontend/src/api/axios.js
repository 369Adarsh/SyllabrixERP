import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints that should never trigger a token refresh
const AUTH_ENDPOINTS = ['/auth/login', '/auth/staff-login', '/auth/register', '/auth/refresh'];

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => original.url?.includes(path));

    // Don't try to refresh on auth endpoints — just let the error bubble up
    if (isAuthEndpoint) return Promise.reject(err);

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        const isFreelancer = window.location.pathname.startsWith('/freelancer');
        window.location.href = isFreelancer ? '/freelancer/login' : '/login';
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        const isFreelancer = window.location.pathname.startsWith('/freelancer');
        window.location.href = isFreelancer ? '/freelancer/login' : '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

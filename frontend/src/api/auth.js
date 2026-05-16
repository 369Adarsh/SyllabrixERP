import api from './axios';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const staffLogin = (data) => api.post('/auth/staff-login', data);
export const logout = () => api.post('/auth/logout');
export const refreshToken = (data) => api.post('/auth/refresh', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getMe = () => api.get('/auth/me');

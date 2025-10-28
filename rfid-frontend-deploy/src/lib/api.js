// src/lib/api.js
import axios from "axios";
import axiosRetry from 'axios-retry';
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://rfid-attendance-backend-five.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased from 10s to 15s
  keepAlive: true,
  maxIdleConnections: 5,
});

// Configure axios-retry for automatic retries
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 1s, 2s, 3s backoff
  },
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx responses, but not on 4xx
    return error.code === 'ECONNABORTED' || 
           error.code === 'ETIMEDOUT' ||
           axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response && error.response.status >= 500 && error.response.status <= 599);
  },
  shouldResetTimeout: true, // Reset timeout on each retry
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken });
          const { accessToken: newAccessToken } = refreshResponse.data;

          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Only show error toast for non-polling requests (avoid spam)
    if (!originalRequest._isPolling) {
      const msg = error.response?.data?.message || error.message || "Request failed. Please try again.";
      toast.error(msg);
    }
    
    return Promise.reject(error);
  }
);

export default api;

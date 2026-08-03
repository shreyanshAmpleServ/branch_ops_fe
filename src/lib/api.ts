import axios, { type AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/** Shared axios instance — all requests go through here */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // send & receive httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach the access token from localStorage as a fallback Bearer header.
// The backend reads the cookie first; the header is a second channel for
// environments where cookies are blocked.
api.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem('salesapp-auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.tokens?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401: attempt a silent token refresh once, then retry the original request.
// On second failure: clear auth state and redirect to /login.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue subsequent 401s while a refresh is in flight
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call the real refresh endpoint — the httpOnly refreshToken cookie is
      // sent automatically thanks to `withCredentials: true`
      const { data } = await api.post<{
        status: string;
        data: { accessToken: string };
      }>('/auth/refresh');

      const newAccessToken = data.data.accessToken;

      // Persist the new access token in Zustand's persisted storage
      const raw = localStorage.getItem('salesapp-auth');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.state?.tokens) {
            parsed.state.tokens.accessToken = newAccessToken;
            localStorage.setItem('salesapp-auth', JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — clear auth and go to login
      localStorage.removeItem('salesapp-auth');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

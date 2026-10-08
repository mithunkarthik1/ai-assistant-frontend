import axios from "axios";

export const STORAGE_USER_KEY = "ai_assistant_auth_user";
export const STORAGE_TOKEN_KEY = "ai_assistant_auth_token";
export const STORAGE_REFRESH_TOKEN_KEY = "ai_assistant_auth_refresh_token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Auth header interceptor error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token expiration and 401s gracefully
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Check if 401 Unauthorized and not already retried
    if (status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = (originalRequest.url || "").toLowerCase();
      // Don't loop if login, refresh, or logout itself failed with 401
      if (
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/refresh") ||
        requestUrl.includes("/auth/logout") ||
        requestUrl.includes("/auth/signin")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const newAccessToken = res.data?.data?.access_token;
          if (newAccessToken) {
            localStorage.setItem(STORAGE_TOKEN_KEY, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.warn("Session expired. Logging out...", refreshErr);
          localStorage.removeItem(STORAGE_USER_KEY);
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
          window.dispatchEvent(new CustomEvent("ai-assistant-unauthorized"));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

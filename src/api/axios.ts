import axios from "axios";
import ENDPOINTS from "@/api/endpoints";
import { useAuthStore } from "@/store/auth";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:8888',
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    'x-platform': 'WEB'
  },
});

// Cấu hình interceptor cho request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cấu hình interceptor cho response
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(axiosInstance(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosInstance.post(ENDPOINTS.AUTH_ENDPOINTS.REFRESH_TOKEN);
        localStorage.setItem('authToken', response.data.data.accessToken);
        

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        processQueue(err);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios, { type InternalAxiosRequestConfig, type AxiosRequestHeaders } from "axios";
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

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8888';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  // we store tokens in localStorage now; don't rely on cookies
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cấu hình interceptor cho request
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    const headers = config.headers as AxiosRequestHeaders | undefined;
    if (headers && typeof headers === 'object') {
      // headers may be an AxiosRequestHeaders instance; set Authorization safely
      (headers as any).Authorization = `Bearer ${token}`;
    } else {
      // create a headers object with correct typing
      config.headers = ({ Authorization: `Bearer ${token}` } as unknown) as AxiosRequestHeaders;
    }
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
        // Use plain axios to call washing endpoint with refresh token in body
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          useAuthStore.getState().logout();
          processQueue(new Error('No refresh token'));
          return Promise.reject(error);
        }

        const washResp = await axios.post(`${BASE_URL}${ENDPOINTS.AUTH_ENDPOINTS.REFRESH_TOKEN}`, { token: refreshToken }, {
          headers: { 'Content-Type': 'application/json' }
        });

        // Response may contain tokens at data.data or data
        const data = washResp.data?.data ?? washResp.data;
        const newAccess = data?.accessToken ?? data?.access_token ?? null;
        const newRefresh = data?.refreshToken ?? data?.refresh_token ?? null;

        if (newAccess) {
          localStorage.setItem('authToken', newAccess);
          // update default header for future requests
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        }
        if (newRefresh) {
          localStorage.setItem('refreshToken', newRefresh);
        }

        processQueue(null);
        // set header for original request and retry
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccess}`;
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

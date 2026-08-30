import axios, { AxiosError } from "axios";
import { ApiResponse } from "../types/index.ts";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusiq_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Global error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Clear token on 401 unauthorized
      localStorage.removeItem("campusiq_token");
      localStorage.removeItem("campusiq_user");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

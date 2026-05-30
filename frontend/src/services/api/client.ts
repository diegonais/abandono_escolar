import axios from "axios";
import { getStoredToken } from "@/features/auth/auth-storage";

const fallbackApiUrl = "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? fallbackApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

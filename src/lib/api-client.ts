// src/lib/api-client.ts
import axios from "axios";
import { intervalManager } from "@/utils/interval-manager";
import { getAccessToken } from "@/providers/auth";

const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
const API_BASE_URL = isDevelopment
  ? "http://localhost:3000/api"
  : "https://api.nodable.ai/api";

// Create API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the access token using the unified auth system
      const token = await getAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.debug("[Auth] Token obtained and set in headers");
      } else {
        console.debug("[Auth] No auth token available");
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }

    if (isDevelopment) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      console.debug("[Auth] Request headers:", config.headers);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      console.log("📦 Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    if (isDevelopment) {
      if (error.code === "ERR_NETWORK") {
        console.error("Network error - check CORS configuration");
      } else if (error.response) {
        console.error("❌ Response Error:", {
          status: error.response.status,
          data: error.response.data,
          url: error.config.url,
          headers: error.config.headers,
        });
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

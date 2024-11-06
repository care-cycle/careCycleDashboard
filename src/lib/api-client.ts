// src/lib/api-client.ts
import axios from "axios";

const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';

const apiClient = axios.create({
  baseURL: isDevelopment
    ? 'http://10.0.0.155:3000/api'
    : 'https://api.nodable.ai/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (isDevelopment) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      console.log('📦 Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    if (isDevelopment) {
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error - check CORS configuration');
      } else if (error.response) {
        console.error('❌ Response Error:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config.url
        });
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
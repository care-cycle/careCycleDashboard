import axios from 'axios';

const BASE_URL = import.meta.env.VITE_NODE_ENV === 'development' 
  ? '/api'  
  : 'https://api.nodable.ai/api';

console.log('API Base URL:', BASE_URL); // Debug log

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('Making request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Token will be added by useAuthApi hook
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('Auth error:', {
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
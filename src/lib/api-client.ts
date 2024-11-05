import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_NODE_ENV === 'development' 
    ? '/api'  
    : 'https://api.nodable.ai/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

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
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
      const token = window.localStorage.getItem('__clerk_db_jwt');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Instead of redirecting, you might want to refresh the token or handle auth error differently
      console.error('Authentication error:', error);
      // Optional: Clear local storage
      // window.localStorage.removeItem('__clerk_db_jwt');
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
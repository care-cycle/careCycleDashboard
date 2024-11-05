import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_NODE_ENV === 'development' 
    ? '/api'  // This will use Vite's proxy
    : 'https://api.nodable.ai/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('__clerk_db_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Remove any CORS headers if they exist
  delete config.headers['Access-Control-Allow-Origin'];
  delete config.headers['Access-Control-Allow-Credentials'];
  
  return config;
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      config: error.config
    });

    if (error.response?.status === 401) {
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.nodable.ai/api',
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
  
  // Add CORS headers to the request
  config.headers['Access-Control-Allow-Origin'] = import.meta.env.VITE_NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : 'https://app.nodable.ai';
  config.headers['Access-Control-Allow-Credentials'] = true;
  
  return config;
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      config: error.config
    });

    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// Add axios default settings
axios.defaults.withCredentials = true;

export default apiClient;
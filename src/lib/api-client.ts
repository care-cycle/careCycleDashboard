// src/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Dynamically set based on environment
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  timeout: 10000,
  validateStatus: (status) => {
    return status >= 200 && status < 500;
  },
});

// Request interceptor to conditionally set 'Content-Type'
apiClient.interceptors.request.use(
  (config) => {
    const methodsWithBody = ['post', 'put', 'patch', 'delete'];

    if (methodsWithBody.includes(config.method || '')) {
      config.headers['Content-Type'] = 'application/json';
    } else {
      delete config.headers['Content-Type'];
    }

    console.log('🚀 Request:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer ***' : undefined, // Mask token
      },
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      url: response.config.url,
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default apiClient;
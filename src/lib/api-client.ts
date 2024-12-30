// src/lib/api-client.ts
import axios from "axios";
import { isAuthEnabled } from '@/lib/utils';
import { mockData } from './mock-data';

const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';

const getMockResponse = (endpoint: string) => {
  // Map endpoints to mock data
  const mockResponses: Record<string, any> = {
    '/api/calls': mockData.calls,
    '/api/billing': mockData.billing,
    '/api/user': mockData.user
  };
  
  return mockResponses[endpoint] || {};
};

// Create mock client
const mockClient = {
  get: async (url: string) => ({ data: getMockResponse(url) }),
  post: async (url: string) => ({ data: getMockResponse(url) }),
  put: async (url: string) => ({ data: getMockResponse(url) }),
  delete: async (url: string) => ({ data: getMockResponse(url) })
};

// Create real API client
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
  async (config) => {
    if (isAuthEnabled()) {
      try {
        // Get the current active session
        const session = await window.Clerk?.session;
        const token = await session?.getToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (isDevelopment) {
            console.log('🔑 Auth token added to request');
          }
        } else {
          console.warn('No auth token available');
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    
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
    // if (isDevelopment) {
      console.log('📦 Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    // }
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

// Export the appropriate client based on auth setting
export default isAuthEnabled() ? apiClient : mockClient;
import apiClient from '@/lib/api-client';
import { Call } from '@/types/calls';

// API Services
export const callsApi = {
  getCalls: async (params?: any) => {
    const response = await apiClient.get<Call[]>('/calls', { params });
    return response.data;
  },
  
  getCallById: async (id: string) => {
    const response = await apiClient.get<Call>(`/calls/${id}`);
    return response.data;
  },
  
  getCallMetrics: async (dateRange?: { from: Date; to: Date }) => {
    const response = await apiClient.get('/calls/metrics', { 
      params: dateRange 
    });
    return response.data;
  }
};

export const knowledgeApi = {
  search: async (query: string) => {
    const response = await apiClient.post('/knowledge/search', { query });
    return response.data;
  }
};

// Add other API services as needed 
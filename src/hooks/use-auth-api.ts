// src/hooks/use-auth-api.ts
import { useEffect, useState } from 'react';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface UseAuthApiOptions {
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
  showErrorToast?: boolean;
}

export function useAuthApi<T>(
  endpoint: string, 
  options: UseAuthApiOptions = {}
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { organization } = useOrganization();
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!isLoaded || !isSignedIn) {
      console.log('Auth not ready:', { isLoaded, isSignedIn });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      
      if (!token) {
        throw new Error('No auth token available');
      }

      // Normalize endpoint without adding '/api' prefix
      const normalizedEndpoint = endpoint.startsWith('/api') 
        ? endpoint.replace(/^\/api/, '') 
        : endpoint.startsWith('/') 
          ? endpoint 
          : `/${endpoint}`;

      // Log auth and request url if in development
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        console.log('Auth details:', {
          hasToken: !!token,
          organizationId: organization?.id,
          endpoint: normalizedEndpoint
        });
        console.log(`Making request to: ${apiClient.defaults.baseURL}${normalizedEndpoint}`);
      }

      const response = await apiClient.get<T>(normalizedEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-organization-id': organization?.id || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        withCredentials: true,
        timeout: 30000
      });
      
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (error: any) {
      console.error('API Error:', {
        endpoint,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      
      setError(error);
      options.onError?.(error);
      
      if (options.showErrorToast) {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [endpoint, organization?.id, isLoaded, isSignedIn]);

  return { 
    data, 
    isLoading: !isLoaded || isLoading, 
    error,
    refetch: fetchData,
    isAuthenticated: isLoaded && isSignedIn
  };
} 
import { useEffect, useState } from 'react';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import apiClient from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

interface UseAuthApiOptions {
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
  showErrorToast?: boolean;
}

export function useAuthApi<T>(
  endpoint: string, 
  options: UseAuthApiOptions = {}
) {
  const { getToken, userId, isLoaded } = useAuth();
  const { organization } = useOrganization();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      if (!isLoaded || !userId) {
        console.log('Auth not ready:', { isLoaded, userId });
        return;
      }

      setIsLoading(true);
      setError(null);

      const token = await getToken();
      console.log('Got token:', !!token);

      const headers = {
        Authorization: `Bearer ${token}`,
        'X-Organization-Id': organization?.id || ''
      };

      console.log('Making request to:', endpoint, { headers });

      const response = await apiClient.get(endpoint, { headers });
      
      console.log('Got response:', response.status, response.data);
      
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (err: any) {
      console.error('API Error Details:', {
        error: err,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        userId,
        organizationId: organization?.id,
        endpoint,
        message: err.message
      });
      
      setError(err);
      options.onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && userId) {
      fetchData();
    }
  }, [isLoaded, userId, organization?.id, endpoint]);

  return { 
    data, 
    isLoading: !isLoaded || isLoading, 
    error,
    refetch: fetchData,
    isAuthenticated: isLoaded && !!userId
  };
} 
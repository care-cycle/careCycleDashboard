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
        return;
      }

      setIsLoading(true);
      setError(null);

      const token = await getToken();
      
      const response = await apiClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Organization-Id': organization?.id || ''
        }
      });
      
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (err: any) {
      console.error(`API Error:`, {
        error: err,
        userId,
        organizationId: organization?.id,
        endpoint
      });
      
      setError(err);
      options.onError?.(err);
      
      if (options.showErrorToast !== false && err.response?.status !== 401) {
        toast({
          title: "Error",
          description: err.message || 'An error occurred',
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && userId) {
      fetchData();
    }
  }, [isLoaded, userId, organization?.id, endpoint]);

  const isAuthenticated = isLoaded && !!userId;

  return { 
    data, 
    isLoading: !isLoaded || isLoading, 
    error,
    refetch: fetchData,
    isAuthenticated
  };
} 
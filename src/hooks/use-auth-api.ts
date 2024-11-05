import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
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
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session) {
        throw new Error('No active session');
      }

      const token = await session.getToken();
      const response = await apiClient.get(endpoint);
      
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (err: any) {
      console.error(`Failed to fetch ${endpoint}:`, {
        error: err,
        sessionActive: !!session,
        hasToken: !!(await session?.getToken())
      });
      
      setError(err);
      options.onError?.(err);
      
      if (options.showErrorToast !== false && err.response?.status !== 401) {
        toast.error(err.message || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session, endpoint]);

  return { data, isLoading, error, refetch: fetchData };
} 
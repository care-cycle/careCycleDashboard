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
  const { session, isLoaded } = useAuth();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for Clerk to load
      if (!isLoaded) {
        return;
      }

      // Check for session
      if (!session) {
        console.log('No active session - waiting for auth');
        return;
      }

      const token = await session.getToken();
      if (!token) {
        console.log('No token available - waiting for auth');
        return;
      }

      const response = await apiClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setData(response.data);
      options.onSuccess?.(response.data);
    } catch (err: any) {
      console.error(`Failed to fetch ${endpoint}:`, {
        error: err,
        sessionActive: !!session,
        hasToken: !!(await session?.getToken()),
        isLoaded
      });
      
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      } else if (options.showErrorToast !== false && err.response?.status !== 401) {
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
    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, session, endpoint]);

  return { 
    data, 
    isLoading: !isLoaded || isLoading, 
    error, 
    refetch: fetchData,
    isAuthenticated: !!session
  };
} 
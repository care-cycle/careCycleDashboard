// src/hooks/use-auth-api.ts
import { useState, useEffect } from 'react';
import { isAuthEnabled } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { useAuth } from '@clerk/clerk-react';

interface UseAuthApiOptions {
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
  showErrorToast?: boolean;
}

// Default state for non-auth mode
const nonAuthState = {
  data: null,
  isLoading: false,
  error: null,
  isAuthenticated: true,
  refetch: () => Promise.resolve(null)
};

export function useAuthApi<T>(endpoint: string, options: UseAuthApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Return non-auth state immediately if auth is disabled
  if (!isAuthEnabled()) {
    return nonAuthState;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const auth = useAuth();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(endpoint);
        setData(response.data);
        options.onSuccess?.(response.data);
      } catch (err: any) {
        setError(err);
        options.onError?.(err);
        if (options.showErrorToast) {
          toast({
            title: "Error",
            description: err.message || "An error occurred",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.isLoaded && auth.isSignedIn) {
      fetchData();
    }
  }, [endpoint, auth.isLoaded, auth.isSignedIn]);

  return {
    data,
    isLoading,
    error,
    isAuthenticated: auth.isLoaded && auth.isSignedIn,
    refetch: async () => {
      // Implement refetch logic here if needed
    }
  };
} 
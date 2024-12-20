// src/hooks/use-auth-api.ts
import { useState, useEffect, useRef } from 'react';
import { isAuthEnabled } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { useAuth } from '@clerk/clerk-react';

interface UseAuthApiOptions {
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
  showErrorToast?: boolean;
}

// Cache for storing API responses
const apiCache = new Map<string, any>();

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
  const auth = useAuth();
  const fetchCount = useRef(0);

  useEffect(() => {
    // Skip effect if auth is disabled
    if (!isAuthEnabled()) {
      return;
    }

    const fetchData = async () => {
      // Check if we already have cached data
      if (apiCache.has(endpoint)) {
        setData(apiCache.get(endpoint));
        setIsLoading(false);
        return;
      }

      // Prevent duplicate fetches
      if (fetchCount.current > 0) {
        return;
      }

      try {
        setIsLoading(true);
        fetchCount.current += 1;
        const response = await apiClient.get(endpoint);
        apiCache.set(endpoint, response.data);
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

  // Return non-auth state if auth is disabled
  if (!isAuthEnabled()) {
    return nonAuthState;
  }

  const refetch = async () => {
    // Clear cache for this endpoint
    apiCache.delete(endpoint);
    fetchCount.current = 0;
    
    if (auth.isLoaded && auth.isSignedIn) {
      try {
        setIsLoading(true);
        const response = await apiClient.get(endpoint);
        apiCache.set(endpoint, response.data);
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
    }
  };

  return {
    data,
    isLoading,
    error,
    isAuthenticated: auth.isLoaded && auth.isSignedIn,
    refetch
  };
} 
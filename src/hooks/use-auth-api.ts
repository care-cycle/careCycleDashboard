// src/hooks/use-auth-api.ts
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import { useAuth } from "@clerk/clerk-react";

interface ApiError extends Error {
  message: string;
  status?: number;
}

interface UseAuthApiOptions<T> {
  onError?: (error: ApiError) => void;
  onSuccess?: (data: T) => void;
  showErrorToast?: boolean;
}

// Cache for storing API responses
const apiCache = new Map<string, unknown>();

export function useAuthApi<T>(
  endpoint: string,
  options: UseAuthApiOptions<T> = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const { toast } = useToast();
  const auth = useAuth();
  const fetchCount = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      // Check if we already have cached data
      if (apiCache.has(endpoint)) {
        setData(apiCache.get(endpoint) as T);
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
        const response = await apiClient.get<T>(endpoint);
        apiCache.set(endpoint, response.data);
        setData(response.data);
        options.onSuccess?.(response.data);
      } catch (err) {
        const apiError: ApiError =
          err instanceof Error ? err : new Error(String(err));
        setError(apiError);
        options.onError?.(apiError);
        if (options.showErrorToast) {
          toast({
            title: "Error",
            description: apiError.message || "An error occurred",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.isLoaded && auth.isSignedIn) {
      fetchData();
    }
  }, [endpoint, auth.isLoaded, auth.isSignedIn, options, toast]);

  const refetch = async () => {
    // Clear cache for this endpoint
    apiCache.delete(endpoint);
    fetchCount.current = 0;

    if (auth.isLoaded && auth.isSignedIn) {
      try {
        setIsLoading(true);
        const response = await apiClient.get<T>(endpoint);
        apiCache.set(endpoint, response.data);
        setData(response.data);
        options.onSuccess?.(response.data);
      } catch (err) {
        const apiError: ApiError =
          err instanceof Error ? err : new Error(String(err));
        setError(apiError);
        options.onError?.(apiError);
        if (options.showErrorToast) {
          toast({
            title: "Error",
            description: apiError.message || "An error occurred",
            variant: "destructive",
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
    refetch,
  };
}

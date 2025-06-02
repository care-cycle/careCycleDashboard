import { useUser, useAuth as useUnifiedAuth } from "@/providers/auth";
import apiClient from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationStatus: string;
  isPersonalClient?: boolean;
}

interface ApiError extends Error {
  message: string;
  status?: number;
}

interface UseAuthApiOptions<T> {
  onError?: (error: ApiError) => void;
  onSuccess?: (data: T) => void;
  showErrorToast?: boolean;
}

// Main auth hook for user data
export function useAuth() {
  const { isLoaded, isSignedIn } = useUnifiedAuth();
  const user = useUser();

  const { data: apiUser, isLoading } = useQuery({
    queryKey: ["auth", user?.id],
    queryFn: async () => {
      if (!isLoaded || !user) {
        return null;
      }

      const { data } = await apiClient.get("/portal/me");

      if (!data.id || !data.role) {
        console.debug("[Auth] Invalid response data:", data);
        return null;
      }

      return data as User;
    },
    enabled: isLoaded && !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  return {
    user: apiUser || null,
    loading: !isLoaded || isLoading,
  };
}

// Role management hook
export function useUserRole() {
  const { user, loading } = useAuth();

  return {
    isAdmin: user?.role === "admin",
    isLoading: loading,
  };
}

// Generic authenticated API hook with caching
const apiCache = new Map<string, unknown>();

export function useAuthApi<T>(
  endpoint: string,
  options: UseAuthApiOptions<T> = {},
) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["api", endpoint, user?.id],
    queryFn: async () => {
      // Check cache first
      if (apiCache.has(endpoint)) {
        return apiCache.get(endpoint) as T;
      }

      try {
        const response = await apiClient.get<T>(endpoint);
        apiCache.set(endpoint, response.data);
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const apiError: ApiError =
          err instanceof Error ? err : new Error(String(err));
        options.onError?.(apiError);
        if (options.showErrorToast) {
          toast({
            title: "Error",
            description: apiError.message || "An error occurred",
            variant: "destructive",
          });
        }
        throw apiError;
      }
    },
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
  });

  const clearCache = () => {
    apiCache.delete(endpoint);
    refetch();
  };

  return {
    data,
    isLoading: authLoading || isLoading,
    error,
    refetch: clearCache,
  };
}

export { useUser };

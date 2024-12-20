import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAuthApi } from './use-auth-api';
import type { ClientInfo } from '@/types/client';

export function useInitialData() {
  const { isSignedIn, isLoaded } = useAuth();
  
  const {
    data: clientInfo,
    isLoading,
    error,
    refetch
  } = useAuthApi<ClientInfo>('/portal/client/info', {
    showErrorToast: false,
    onError: (error) => {
      console.error('Failed to load initial client info:', error);
    }
  });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refetch();
    }
  }, [isLoaded, isSignedIn]);

  return {
    clientInfo,
    isLoading: isLoaded && isSignedIn ? isLoading : false,
    error
  };
} 
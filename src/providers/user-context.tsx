import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import apiClient from "@/lib/api-client";
import { useAuth, getAuthProviderName, getAccessToken } from "@/providers/auth";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  npn?: string;
  clientId: string;
  organizationStatus?: string;
}

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useAuth();
  const authProvider = getAuthProviderName();

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    // For Tesseral, add extra check to ensure we have a token
    if (authProvider === "tesseral") {
      // Give Tesseral a moment to set up the token
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if we have a token before proceeding
      const token = await getAccessToken();

      if (!token) {
        console.warn("[UserProvider] No auth token available yet, waiting...");
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await apiClient.get("/portal/me");
      setUserData(response.data);
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      // If we get a 401 with Tesseral, it might mean the token isn't ready yet
      if (authProvider === "tesseral" && error?.response?.status === 401) {
        console.warn(
          "[UserProvider] Got 401 with Tesseral, token might not be ready",
        );
      }
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, authProvider]);

  useEffect(() => {
    if (isLoaded) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, authProvider, fetchUserData]);

  const value = {
    userData,
    isLoading,
    refetch: fetchUserData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserData() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserProvider");
  }
  return context;
}

import { getAuthProviderName } from "./index";

// Define session interface for better type safety
interface ClerkSession {
  id: string;
  status: string;
  expireAt: number;
  lastActiveAt: number;
  user?: {
    id: string;
    email: string;
  };
}

interface TesseralSession {
  // Define based on actual Tesseral session structure
  // For now, keeping it minimal
  user?: {
    id: string;
    email: string;
  };
}

// Add proper types to window for auth providers
declare global {
  interface Window {
    Clerk?: {
      session: ClerkSession | null;
    };
    tesseral?: {
      session: TesseralSession | null;
      // Add other Tesseral properties as needed
    };
  }
}

/**
 * Get session from the current auth provider
 * Used to replace direct window.Clerk.session access
 */
export async function getAuthSession(): Promise<
  ClerkSession | TesseralSession | null
> {
  const provider = getAuthProviderName();

  if (provider === "clerk" && window.Clerk) {
    return window.Clerk.session;
  } else if (provider === "tesseral" && window.tesseral) {
    // Tesseral might provide session differently
    // For now, return null as Tesseral uses different auth mechanism
    return window.tesseral.session;
  }

  return null;
}

/**
 * Get authentication token for API requests
 * This is handled by the auth provider's getAccessToken method
 */
export async function getAuthToken(): Promise<string | null> {
  // This is re-exported from index.tsx
  const { getAccessToken } = await import("./index");
  return getAccessToken();
}

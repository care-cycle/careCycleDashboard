import { getAuthProviderName } from "./index";

// Add Clerk types to window for auth provider check
declare global {
  interface Window {
    Clerk?: {
      session: any;
    };
  }
}

/**
 * Get session from the current auth provider
 * Used to replace direct window.Clerk.session access
 */
export async function getAuthSession() {
  const provider = getAuthProviderName();

  if (provider === "clerk" && window.Clerk) {
    return window.Clerk.session;
  } else if (provider === "tesseral" && (window as any).tesseral) {
    // Tesseral might provide session differently
    // For now, return null as Tesseral uses different auth mechanism
    return null;
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

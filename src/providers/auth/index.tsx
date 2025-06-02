import React, { createContext, useContext, useMemo } from "react";
import { BaseAuthProvider, AuthHooks } from "./base";
import { ClerkAuthProvider } from "./clerk";
import { TesseralAuthProvider } from "./tesseral";

const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || "clerk";

// Get the auth provider instance based on environment variable
function getAuthProvider(): BaseAuthProvider {
  switch (AUTH_PROVIDER) {
    case "clerk":
      return new ClerkAuthProvider();
    case "tesseral":
      return new TesseralAuthProvider();
    default:
      throw new Error(`Unknown auth provider: ${AUTH_PROVIDER}`);
  }
}

// Create context for auth provider instance
const AuthProviderContext = createContext<BaseAuthProvider | null>(null);

// Export the unified auth provider component
export function UnifiedAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create provider instance inside component to avoid singleton issues in tests
  const authProvider = useMemo(() => getAuthProvider(), []);
  const AuthProvider = useMemo(
    () => authProvider.getProvider(),
    [authProvider],
  );

  return (
    <AuthProvider>
      <AuthProviderContext.Provider value={authProvider}>
        {children}
      </AuthProviderContext.Provider>
    </AuthProvider>
  );
}

// Helper to get auth provider
function useAuthProvider(): BaseAuthProvider {
  const provider = useContext(AuthProviderContext);
  if (!provider) {
    throw new Error("useAuthProvider must be used within UnifiedAuthProvider");
  }
  return provider;
}

// Export unified hooks that work with any provider
export function useAuth() {
  const provider = useAuthProvider();
  const hooks = useMemo(() => provider.getHooks(), [provider]);
  return hooks.useAuth();
}

export function useUser() {
  const provider = useAuthProvider();
  const hooks = useMemo(() => provider.getHooks(), [provider]);
  return hooks.useUser();
}

export function useOrganization() {
  const provider = useAuthProvider();
  const hooks = useMemo(() => provider.getHooks(), [provider]);
  return hooks.useOrganization();
}

export function useLogout() {
  const provider = useAuthProvider();
  const hooks = useMemo(() => provider.getHooks(), [provider]);
  return hooks.useLogout();
}

export function useUserSettingsUrl() {
  const provider = useAuthProvider();
  const hooks = useMemo(() => provider.getHooks(), [provider]);
  if (!hooks.useUserSettingsUrl) {
    // Return a fallback for providers that don't support this
    return "/user/profile";
  }
  return hooks.useUserSettingsUrl();
}

export function useOrganizationSettingsUrl() {
  const provider = useAuthProvider();
  const hooks = useMemo(() => provider.getHooks(), [provider]);
  if (!hooks.useOrganizationSettingsUrl) {
    // Return a fallback for providers that don't support this
    return "/organization/settings";
  }
  return hooks.useOrganizationSettingsUrl();
}

// Export provider name for conditional rendering
export function getAuthProviderName(): string {
  return AUTH_PROVIDER;
}

// Export types
export type { User, Organization } from "./base";

// Export getAccessToken as a named function
export async function getAccessToken(): Promise<string | null> {
  // Import the token store directly instead of creating a new provider instance
  const { tokenStore } = await import("./token-store");

  const token = tokenStore.getToken();
  const provider = tokenStore.getProvider();

  console.log("[getAccessToken] Token store debug:", {
    hasToken: !!token,
    provider: provider,
    expectedProvider: AUTH_PROVIDER,
    tokenLength: token?.length,
    providersMatch: provider === AUTH_PROVIDER,
  });

  // Return token if it exists (simplified for debugging)
  return token;
}

// Export the provider name for components that need it
export const authProviderName = AUTH_PROVIDER;

import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  useClerk,
  useOrganization as useClerkOrg,
} from "@clerk/clerk-react";
import {
  BaseAuthProvider,
  AuthHooks,
  AuthProviderProps,
  User,
  Organization,
} from "./base";
import { useEffect, useRef } from "react";
import { tokenStore } from "./token-store";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Component to sync Clerk token to our token store
function ClerkTokenSync({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useClerkAuth();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      tokenStore.setToken(null, "clerk");
      lastTokenRef.current = null;
      return;
    }

    const syncToken = async () => {
      try {
        const token = await getToken();

        // Only update if token actually changed
        if (token !== lastTokenRef.current) {
          lastTokenRef.current = token;
          tokenStore.setToken(token, "clerk");
        }
      } catch (error) {
        console.error("Error syncing Clerk token:", error);
        tokenStore.setToken(null, "clerk");
        lastTokenRef.current = null;
      }
    };

    // Initial sync
    syncToken();

    // Re-sync token periodically (tokens can expire)
    const interval = setInterval(syncToken, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}

export class ClerkAuthProvider extends BaseAuthProvider {
  getProvider(): React.ComponentType<AuthProviderProps> {
    return ({ children }: AuthProviderProps) => {
      if (!CLERK_PUBLISHABLE_KEY) {
        throw new Error("Missing Clerk Publishable Key");
      }

      return (
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          appearance={{
            variables: {
              colorPrimary: "#3B82F6",
            },
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
              card: "shadow-lg",
            },
          }}
        >
          <ClerkTokenSync>{children}</ClerkTokenSync>
        </ClerkProvider>
      );
    };
  }

  getHooks(): AuthHooks {
    return {
      useAuth: () => {
        const { isLoaded, isSignedIn, userId } = useClerkAuth();
        return {
          isLoaded,
          isSignedIn: isSignedIn ?? false,
          userId: userId || undefined,
        };
      },

      useUser: () => {
        const { user } = useClerkUser();
        if (!user) return null;

        return {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          name: user.fullName || undefined,
          role: user.publicMetadata?.role as string | undefined,
          npn: user.publicMetadata?.npn as string | undefined,
          unsafeMetadata: user.unsafeMetadata || {},
        };
      },

      useOrganization: () => {
        const { organization } = useClerkOrg();
        if (!organization) return null;

        return {
          id: organization.id,
          name: organization.name,
          displayName: organization.name,
          slug: organization.slug || undefined,
        };
      },

      useLogout: () => {
        const { signOut } = useClerk();
        return async () => {
          await signOut({ redirectUrl: "/sign-in" });
        };
      },

      // Clerk doesn't have direct hooks for these URLs
      useUserSettingsUrl: undefined,
      useOrganizationSettingsUrl: undefined,
    };
  }

  getProviderName(): string {
    return "clerk";
  }

  async getAccessToken(): Promise<string | null> {
    // Only return token if it's from Clerk provider
    if (tokenStore.getProvider() === "clerk") {
      return tokenStore.getToken();
    }
    return null;
  }
}

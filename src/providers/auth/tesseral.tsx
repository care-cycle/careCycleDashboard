import {
  TesseralProvider,
  useUser as useTesseralUser,
  useOrganization as useTesseralOrg,
  useLogout as useTesseralLogout,
  useUserSettingsUrl,
  useOrganizationSettingsUrl,
  useAccessToken,
  useTesseral,
} from "@tesseral/tesseral-react";
import {
  BaseAuthProvider,
  AuthHooks,
  AuthProviderProps,
  User,
  Organization,
} from "./base";
import { useState, useEffect, useRef, Component, ReactNode } from "react";
import { tokenStore } from "./token-store";

// Use dev key in development, production key otherwise
const isDevelopment = import.meta.env.DEV;
const TESSERAL_PUBLISHABLE_KEY = isDevelopment
  ? import.meta.env.VITE_TESSERAL_DEV_PUBLISHABLE_KEY
  : import.meta.env.VITE_TESSERAL_PUBLISHABLE_KEY;

// Export useTesseral for components that need the frontendApiClient
export { useTesseral } from "@tesseral/tesseral-react";

// Error boundary for Tesseral-specific errors
class TesseralErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("[Tesseral Error Boundary] Caught error:", error);

    // Check if it's a CORS error
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("CORS")
    ) {
      console.error(`
        🚨 Tesseral CORS Error Detected!
        
        This usually means your development URL is not in Tesseral's allowed origins.
        
        To fix this:
        1. Go to https://app.tesseral.com
        2. Navigate to your project settings
        3. Add http://localhost:5173 to the allowed origins
        4. Save and refresh this page
        
        Current origin: ${window.location.origin}
      `);
    }

    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold mb-2">
              Tesseral Configuration Error
            </h3>
            <p className="text-red-600 text-sm mb-2">
              Unable to connect to Tesseral. This is usually a CORS
              configuration issue.
            </p>
            <details className="text-xs text-red-500">
              <summary className="cursor-pointer">Technical Details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
                {this.state.error?.message || "Unknown error"}
              </pre>
            </details>
            <p className="text-red-600 text-sm mt-3">
              Please add{" "}
              <code className="bg-red-100 px-1 rounded">
                {window.location.origin}
              </code>{" "}
              to your Tesseral project's allowed origins.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Component to sync Tesseral token to our token store
function TesseralTokenSync({ children }: { children: React.ReactNode }) {
  const accessToken = useAccessToken();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update token if it changed to prevent unnecessary re-renders
    if (accessToken !== lastTokenRef.current) {
      lastTokenRef.current = accessToken;
      tokenStore.setToken(accessToken, "tesseral");
    }
  }, [accessToken]);

  return <>{children}</>;
}

export class TesseralAuthProvider extends BaseAuthProvider {
  getProvider(): React.ComponentType<AuthProviderProps> {
    return ({ children }: AuthProviderProps) => {
      if (!TESSERAL_PUBLISHABLE_KEY) {
        throw new Error(
          `Missing Tesseral Publishable Key for ${isDevelopment ? "development" : "production"} environment`,
        );
      }

      return (
        <TesseralErrorBoundary>
          <TesseralProvider publishableKey={TESSERAL_PUBLISHABLE_KEY}>
            <TesseralTokenSync>{children}</TesseralTokenSync>
          </TesseralProvider>
        </TesseralErrorBoundary>
      );
    };
  }

  getHooks(): AuthHooks {
    return {
      useAuth: () => {
        const user = useTesseralUser();
        const accessToken = useAccessToken();
        const [isLoaded, setIsLoaded] = useState(false);

        useEffect(() => {
          // Consider loaded when we have determined auth state
          // Either we have a user and token, or we don't have a user after waiting
          const timer = setTimeout(() => {
            setIsLoaded(true);
          }, 2000); // Give Tesseral time to redirect if needed

          // If we get a user or token before timeout, we're loaded
          if (user || accessToken) {
            setIsLoaded(true);
            clearTimeout(timer);
          }

          return () => clearTimeout(timer);
        }, [user, accessToken]);

        // Only consider signed in if we have both user and token
        const isSignedIn = !!(user && accessToken);

        return {
          isLoaded,
          isSignedIn,
          userId: user?.id,
        };
      },

      useUser: () => {
        const user = useTesseralUser();
        if (!user) return null;

        // More robust name extraction from email
        // Try to extract meaningful names from email local part
        const extractNameFromEmail = (email: string) => {
          const localPart = email.split("@")[0];

          // Handle common email patterns:
          // - first.last@domain.com
          // - firstname.lastname@domain.com
          // - john.doe@domain.com
          // - j.smith@domain.com

          if (localPart.includes(".")) {
            const parts = localPart.split(".");
            return {
              firstName: capitalizeFirst(parts[0]),
              lastName:
                parts.length > 1
                  ? capitalizeFirst(parts[parts.length - 1])
                  : "",
            };
          }

          // Handle names with underscores or hyphens
          if (localPart.includes("_") || localPart.includes("-")) {
            const separator = localPart.includes("_") ? "_" : "-";
            const parts = localPart.split(separator);
            return {
              firstName: capitalizeFirst(parts[0]),
              lastName:
                parts.length > 1
                  ? capitalizeFirst(parts[parts.length - 1])
                  : "",
            };
          }

          // For simple emails like "john@domain.com", use the whole local part as first name
          return {
            firstName: capitalizeFirst(localPart),
            lastName: "",
          };
        };

        const capitalizeFirst = (str: string) => {
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        };

        // Try to get name from API first, fallback to email parsing
        const { firstName, lastName } = extractNameFromEmail(user.email);

        return {
          id: user.id,
          email: user.email,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim() || user.email.split("@")[0],
          // TODO: Tesseral doesn't provide role/npn in the same way as Clerk
          // These might come from your backend after user is synced
          role: undefined,
          npn: undefined,
          unsafeMetadata: {},
        };
      },

      useOrganization: () => {
        const org = useTesseralOrg();
        if (!org) return null;

        return {
          id: org.id,
          name: org.displayName || "",
          displayName: org.displayName || "",
          slug: undefined, // Tesseral doesn't provide slug
        };
      },

      useLogout: () => {
        const tesseralLogout = useTesseralLogout();
        return async () => {
          tesseralLogout();
        };
      },

      useUserSettingsUrl: () => {
        return useUserSettingsUrl();
      },

      useOrganizationSettingsUrl: () => {
        return useOrganizationSettingsUrl();
      },
    };
  }

  getProviderName(): string {
    return "tesseral";
  }

  async getAccessToken(): Promise<string | null> {
    // Return the token from our store
    return tokenStore.getToken();
  }
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, getAuthProviderName } from "@/providers/auth";
import { intervalManager } from "@/utils/interval-manager";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const authProvider = getAuthProviderName();
  const location = useLocation();

  // Clear intervals when user is not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      intervalManager.clear();
    }
  }, [isLoaded, isSignedIn]);

  // Special handling for Tesseral - if not loaded, show minimal loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-6 rounded-lg">
          <div className="animate-pulse">
            {authProvider === "tesseral"
              ? "Checking authentication..."
              : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    // Don't redirect to sign-in if we're already on the unauthorized page
    if (location.pathname === "/unauthorized") {
      return null;
    }

    // Handle authentication based on provider
    if (authProvider === "tesseral") {
      // For Tesseral, redirect to home and let TesseralProvider handle the auth redirect
      return <Navigate to="/" replace />;
    } else {
      // For Clerk, redirect to sign-in page
      return <Navigate to="/sign-in" replace />;
    }
  }

  return <Outlet />;
}

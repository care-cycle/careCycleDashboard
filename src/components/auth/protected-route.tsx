import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/use-auth";
import { intervalManager } from "@/utils/interval-manager";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useUser();
  const { user, loading: isValidating } = useAuth();
  const location = useLocation();

  // Not loaded yet - show loading spinner
  if (!isLoaded || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Not signed in with Clerk - go to sign in
  if (!isSignedIn) {
    // Don't redirect to sign-in if we're already on the unauthorized page
    if (location.pathname === "/unauthorized") {
      return null;
    }
    return <Navigate to="/sign-in" replace />;
  }

  // Not authorized with backend
  if (!isValidating && !user) {
    // Clear any background tasks when unauthorized
    intervalManager.clear();
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

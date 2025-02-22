import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  console.log("[PublicRoute] Render", {
    path: location.pathname,
    isSignedIn,
    isLoaded,
    timestamp: new Date().toISOString(),
  });

  // Simplified path checking
  const isAuthPath =
    location.pathname.startsWith("/sign-in") ||
    location.pathname.startsWith("/sign-up");

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Always render children for auth paths
  if (isAuthPath) {
    return <>{children}</>;
  }

  // Redirect to home if signed in and trying to access other public routes
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

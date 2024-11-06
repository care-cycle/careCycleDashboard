import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // If auth is loaded and user is not signed in, redirect immediately
  if (isLoaded && !isSignedIn) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  // Show loading state only if auth is still loading
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // If we get here, user is authenticated
  return <>{children}</>;
}
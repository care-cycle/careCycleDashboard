import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  console.log('[PublicRoute] Render', {
    path: location.pathname,
    isSignedIn,
    isLoaded,
    timestamp: new Date().toISOString(),
  });

  const exemptPathPrefixes = [
    "/sign-up",
    "/sign-in",
  ];

  const isExemptPath = exemptPathPrefixes.some(path => location.pathname.startsWith(path));
  const isVerificationPath = location.pathname.includes('verify-email-address');

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Allow verification path to render without redirect
  if (isVerificationPath) {
    return <>{children}</>;
  }

  if (isSignedIn && !isExemptPath) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  // Determine if the user's email is verified
  const emailVerified = user?.emailAddresses?.some(
    (email) => email.verification.status === 'verified'
  ) ?? false;

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (!emailVerified) {
    return <Navigate to="/sign-up" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
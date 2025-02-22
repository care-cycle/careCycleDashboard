import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { isAuthEnabled } from "@/lib/utils";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  // If auth is disabled, allow access
  if (!isAuthEnabled()) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

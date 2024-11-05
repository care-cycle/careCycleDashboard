import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Log auth state to localStorage for persistence
    localStorage.setItem('debug_auth', JSON.stringify({
      isSignedIn,
      isLoaded,
      path: location.pathname,
      timestamp: new Date().toISOString(),
      user: user?.id
    }));

    // Delay redirect decision
    if (isLoaded && !isSignedIn) {
      console.log('Auth check failed, preparing redirect...', {
        isSignedIn,
        isLoaded,
        path: location.pathname
      });
      
      // Add 2 second delay before redirect
      setTimeout(() => {
        setShouldRedirect(true);
      }, 2000);
    }
  }, [isSignedIn, isLoaded, location.pathname, user]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (shouldRedirect) {
    console.log('Redirecting to sign-in...', {
      from: location.pathname
    });
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
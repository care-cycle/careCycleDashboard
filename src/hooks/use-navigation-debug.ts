import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useNavigationDebug = (componentName: string) => {
  const location = useLocation();

  useEffect(() => {
    console.log(`[${componentName}] Mount/Update`, {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });

    return () => {
      console.log(`[${componentName}] Unmount`, {
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    };
  }, [location.pathname, componentName]);
};

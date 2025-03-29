import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

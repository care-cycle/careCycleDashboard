import { useAuth } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClientInfo } from "./use-client-data";

export function useUserRole() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  // Use the existing client info data
  const { data: userRole, isLoading } = useQuery({
    queryKey: ["userRole", userId],
    queryFn: () => {
      const clientInfo = queryClient.getQueryData<ClientInfo>(["clientInfo"]);
      if (!clientInfo) {
        console.warn("No client info data available");
        return "member";
      }

      const role = clientInfo.user?.role;
      console.log("Using role from client info:", role);
      return role || "member";
    },
    enabled: !!userId,
    // Only run this after client info is available
    initialData: () => {
      const clientInfo = queryClient.getQueryData<ClientInfo>(["clientInfo"]);
      return clientInfo?.user?.role || "member";
    },
  });

  return {
    isAdmin: userRole === "admin",
    isLoading,
  };
}

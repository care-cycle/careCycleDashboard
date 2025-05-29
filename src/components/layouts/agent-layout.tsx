import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Phone, Users, MessageSquare, Settings, LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import apiClient from "@/lib/api-client";

interface AgentLayoutProps {
  children: ReactNode;
}

interface AgentInfo {
  name: string;
  email: string;
  npn: string;
}

export function AgentLayout({ children }: AgentLayoutProps) {
  const location = useLocation();
  const { signOut } = useClerk();
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);

  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        const response = await apiClient.get("/portal/me");
        setAgentInfo({
          name: response.data.name,
          email: response.data.email,
          npn: response.data.npn,
        });
      } catch (error) {
        console.error("Error fetching agent info:", error);
      }
    };

    fetchAgentInfo();
  }, []);

  const navigation = [
    { name: "Inquiries", href: "/inquiries", icon: MessageSquare },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Calls", href: "/calls", icon: Phone },
  ];

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Sidebar Navigation */}
      <div className="w-72 bg-white/80 backdrop-blur-md border-r border-gray-200/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50">
          <img src="/carecyclelogofull.svg" alt="CareCycle" className="h-10" />
        </div>

        {/* Agent Info */}
        {agentInfo && (
          <div className="p-6 border-b border-gray-200/50">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">{agentInfo.name}</h3>
              <p className="text-sm text-gray-600">{agentInfo.email}</p>
              <p className="text-xs text-gray-500">NPN: {agentInfo.npn}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-gray-400",
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200/50 space-y-2">
          <Link
            to="/user/profile"
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
              location.pathname === "/user/profile"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900",
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

import {
  LayoutDashboard,
  Phone,
  GitBranch,
  Users,
  CircuitBoard,
  RotateCw,
  Megaphone,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/components/layout/user-profile";
import { Link, useLocation } from "react-router-dom";
import { useRedaction } from "@/hooks/use-redaction";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Calls",
    icon: Phone,
    href: "/calls",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Appointments",
    icon: Calendar,
    href: "/appointments",
  },
  {
    title: "Inquiries",
    icon: MessageSquare,
    href: "/inquiries",
  },
  {
    title: "Sources",
    icon: Megaphone,
    href: "/sources",
  },
  {
    title: "Campaigns",
    icon: CircuitBoard,
    href: "/campaigns",
  },
  {
    title: "Journeys",
    icon: GitBranch,
    href: "/journeys",
    disabled: true,
    badge: "Coming Soon",
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

function useSidebarState() {
  // Force initial state to be false (collapsed) and ignore localStorage on first load
  const [isExpanded, setIsExpanded] = useState(false);

  // Store the user's last manual interaction preference
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved === null) {
      localStorage.setItem("sidebar-expanded", "false");
    }
  }, []);

  // Only save to localStorage when user explicitly interacts
  const handleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
    localStorage.setItem("sidebar-expanded", JSON.stringify(expanded));
  };

  return [isExpanded, handleExpand] as const;
}

// Helper function to check if a navigation item is active
const isPathActive = (itemHref: string, currentPath: string) => {
  if (itemHref === "/" && currentPath === "/") return true;
  if (itemHref === "/") return false;
  return currentPath.startsWith(itemHref);
};

export function Sidebar({ className }: SidebarProps) {
  const { isRedacted } = useRedaction();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useSidebarState();
  const location = useLocation();

  const logoSrc = {
    collapsed: "/carecyclelogo.svg",
    expanded: "/carecyclelogofull.svg",
  };
  const logoAlt = "CareCycle";

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["todayMetrics"] }),
        queryClient.invalidateQueries({ queryKey: ["clientInfo"] }),
        queryClient.invalidateQueries({ queryKey: ["metrics"] }),
        queryClient.invalidateQueries({ queryKey: ["calls"] }),
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["inquiries"] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative h-full">
      {/* Animated orbs */}
      <div className="fixed inset-0 -z-10 isolate pointer-events-none">
        <div
          aria-hidden="true"
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-30 bg-[#74E0BB] -left-1/2 top-0 pointer-events-none select-none"
          style={{
            animation: "float1 25s ease-in-out infinite alternate",
            zIndex: -9999,
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-30 bg-[#293AF9] -right-1/2 bottom-32 pointer-events-none select-none"
          style={{
            animation: "float2 20s ease-in-out infinite alternate",
            animationDelay: "-5s",
            zIndex: -9999,
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />
      </div>

      {/* Sidebar content */}
      <div
        className={cn(
          "relative h-full bg-white/40 backdrop-blur-xl border-r border-white/30",
          "shadow-[0_0_15px_rgba(0,0,0,0.03)]",
          "transition-all duration-300 ease-in-out",
          "flex flex-col",
          isExpanded ? "w-[260px]" : "w-[80px]",
          isExpanded ? "shadow-lg bg-white/60" : "",
          "overflow-hidden",
          className,
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="px-2 pt-4 pb-2 flex items-center">
          <div className="relative w-[260px] h-10">
            <img
              src={logoSrc.expanded}
              alt={logoAlt}
              className={cn(
                "absolute top-0 left-0 h-10 w-[260px] transition-all duration-300",
                "object-contain object-left bg-white/40 left-[10px]",
                isExpanded ? "opacity-100" : "opacity-0",
              )}
            />
            <img
              src={logoSrc.collapsed}
              alt={logoAlt}
              className="absolute h-10 w-10 opacity-100 z-10 bg-white/40 left-[10px]"
            />
          </div>
        </div>
        <div className="flex-1 px-2">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <div key={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full relative",
                    "hover:text-gray-900 hover:bg-white/50",
                    "transition-colors duration-200",
                    item.disabled && "opacity-50 pointer-events-none",
                    "px-2 flex items-center justify-start",
                  )}
                  asChild={!item.disabled}
                  title={item.title}
                >
                  <Link
                    to={item.disabled ? "#" : item.href}
                    className="flex items-center"
                  >
                    <div className="relative flex items-center w-[260px]">
                      <item.icon
                        className={cn(
                          "h-4 w-4 absolute left-[15px]",
                          item.disabled && "text-gray-500 opacity-50",
                          isPathActive(item.href, location.pathname)
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                      <span
                        className={cn(
                          "absolute left-[44px] whitespace-nowrap flex items-center gap-2",
                          "transition-all duration-300 ease-in-out",
                          item.disabled
                            ? isExpanded
                              ? "opacity-50"
                              : "opacity-0"
                            : isExpanded
                              ? "opacity-100"
                              : "opacity-0",
                          item.disabled && "text-gray-500",
                          isPathActive(item.href, location.pathname) &&
                            "text-primary font-medium",
                        )}
                      >
                        {item.title}
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-4 font-normal whitespace-nowrap",
                              item.disabled
                                ? "bg-gray-100/50 text-gray-500"
                                : "bg-secondary/10 text-secondary",
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </span>
                    </div>
                  </Link>
                </Button>
              </div>
            ))}
          </nav>
        </div>

        {/* Refresh Button */}
        <div className="px-2 mb-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full relative",
              "hover:text-gray-900 hover:bg-white/50",
              "px-2",
            )}
            onClick={handleRefreshData}
            disabled={isRefreshing}
            title="Refresh Data"
          >
            <div className="relative flex items-center w-[260px]">
              <RotateCw
                className={cn(
                  "h-4 w-4 absolute left-[15px]",
                  isRefreshing && "animate-spin",
                )}
              />
              <span
                className={cn(
                  "absolute left-[44px] whitespace-nowrap",
                  "transition-all duration-300 ease-in-out",
                  isExpanded ? "opacity-100" : "opacity-0",
                )}
              >
                Refresh Data
              </span>
            </div>
          </Button>
        </div>

        {/* User Profile */}
        <UserProfile
          isRedacted={isRedacted}
          className="group-hover/sidebar:[&>div>button]:p-4 pb-4"
          isParentExpanded={isExpanded}
        />
      </div>
    </div>
  );
}

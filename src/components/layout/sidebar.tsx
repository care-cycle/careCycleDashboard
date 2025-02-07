import { LayoutDashboard, Phone, GitBranch, Users, CircuitBoard, RotateCw, Megaphone, Calendar, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserProfile } from "@/components/layout/user-profile"
import { Link, useLocation } from "react-router-dom"
import { useRedaction } from "@/contexts/redaction-context"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useClientData } from "@/hooks/use-client-data"

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
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
    title: "Campaigns",
    icon: CircuitBoard,
    href: "/campaigns",
    disabled: true,
    badge: "Coming Soon",
  },
  {
    title: "Journeys",
    icon: GitBranch,
    href: "/journeys",
    disabled: true,
    badge: "Coming Soon",
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { isRedacted } = useRedaction();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const { clientInfo } = useClientData();
  
  const isNodableClient = clientInfo?.id === "10c8d3d0-080d-4316-9787-37882c1c8624";
  const logoSrc = isNodableClient 
    ? "https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/66bfa1f56b8fef22f0e4dfe5_Nodable%20Logo%20Black%20Text%2072%20ppi.png"
    : "https://cdn.prod.website-files.com/67603aac125a925e647522be/67a63954975008de5cd2df32_dash-careCycle-logo.png";
  const logoAlt = isNodableClient ? "Nodable Labs" : "CareCycle";

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['todayMetrics'] }),
        queryClient.invalidateQueries({ queryKey: ['clientInfo'] }),
        queryClient.invalidateQueries({ queryKey: ['metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['calls'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative h-full">
      {/* Animated orbs */}
      <div 
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-30 bg-[#74E0BB] -left-1/2 top-0"
        style={{
          animation: "float1 25s ease-in-out infinite alternate"
        }}
      />
      <div 
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-30 bg-[#293AF9] -right-1/2 bottom-32"
        style={{
          animation: "float2 20s ease-in-out infinite alternate",
          animationDelay: "-5s"
        }}
      />

      {/* Sidebar content */}
      <div className={cn(
        "relative h-full bg-white/40 backdrop-blur-xl border-r border-white/30",
        "shadow-[0_0_15px_rgba(0,0,0,0.03)]",
        "transition-all duration-300",
        "flex flex-col",
        className
      )}>
        <div className="p-6">
          <img 
            src={logoSrc}
            alt={logoAlt}
            className="h-12 w-auto"
          />
        </div>
        <div className="flex-1 px-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <div key={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-600",
                    "hover:text-gray-900 hover:bg-white/50",
                    "transition-colors duration-200",
                    item.disabled && "opacity-50 pointer-events-none"
                  )}
                  asChild={!item.disabled}
                >
                  <Link to={item.disabled ? "#" : item.href} className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span className="flex-1 flex items-center gap-2">
                      {item.title}
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] px-1.5 py-0 h-4 font-normal bg-secondary/10 text-secondary"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </span>
                  </Link>
                </Button>
              </div>
            ))}
          </nav>
        </div>

        {/* Refresh Button */}
        <div className="px-4 mb-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-white/50"
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            <RotateCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {/* User Profile */}
        <UserProfile isRedacted={isRedacted} />
      </div>
    </div>
  )
}
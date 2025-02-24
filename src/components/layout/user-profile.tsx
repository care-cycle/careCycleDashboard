import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, User, CreditCard, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser, useClerk } from "@clerk/clerk-react";

interface UserProfileProps {
  isRedacted: boolean;
  className?: string;
  isParentExpanded?: boolean;
}

export function UserProfile({
  isRedacted,
  className,
  isParentExpanded = false,
}: UserProfileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const { signOut } = useClerk();

  const userData = {
    fullName: isRedacted ? "***" : user?.fullName,
    email: isRedacted ? "***" : user?.primaryEmailAddress?.emailAddress,
    imageUrl:
      user?.imageUrl ||
      "https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/6722f2e1aa50560b1eae60a1_favicon-nodable-knowledge.png",
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsExpanded(false);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging out of your account",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isParentExpanded) {
      setIsExpanded(false);
    }
  }, [isParentExpanded]);

  const menuItems = [
    {
      icon: User,
      label: "Configuration",
      onClick: () => {
        setIsExpanded(false);
        navigate("/user/profile");
      },
    },
    {
      icon: CreditCard,
      label: "Billing & Usage",
      onClick: () => {
        setIsExpanded(false);
        navigate("/user/billing");
      },
    },
    {
      icon: LogOut,
      label: "Log Out",
      onClick: handleLogout,
      className: "text-red-600 hover:text-red-700 hover:bg-red-50/20",
    },
  ];

  return (
    <>
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Expanded Menu */}
        <div
          className={cn(
            "absolute bottom-full left-0 right-0",
            "glass-panel backdrop-blur-md bg-white/100",
            "border border-white/20 rounded-t-xl",
            "transition-all duration-150 ease-in-out",
            "overflow-hidden",
            isExpanded ? "h-[132px] opacity-100" : "h-0 opacity-0",
          )}
        >
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.onClick}
              className={cn(
                "w-full h-11 justify-start text-gray-600 hover:text-gray-900 hover:bg-white/50",
                "transition-colors duration-200",
                item.className,
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Profile Card */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full h-[48px] flex items-center border-t border-white/20 transition-all duration-200 hover:bg-white/50",
            isParentExpanded ? "px-4" : "pl-[19px]",
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0",
              !isParentExpanded && "left-[5px]",
            )}
          >
            <img
              src={userData.imageUrl}
              alt={userData.fullName || ""}
              className="w-6 h-6 rounded-md"
            />
          </div>
          <div
            className={cn(
              "ml-3 flex-1 overflow-hidden",
              isParentExpanded ? "opacity-100" : "opacity-0",
              "transition-opacity duration-300 ease-in-out",
            )}
          >
            <div className="text-sm font-medium text-gray-900 truncate">
              {userData.fullName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {userData.email}
            </div>
          </div>
          <div
            className={cn(
              "transition-opacity duration-300",
              isParentExpanded ? "opacity-100" : "opacity-0",
            )}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>
      </div>
    </>
  );
}

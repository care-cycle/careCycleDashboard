import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, User, CreditCard, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn, isAuthEnabled } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useUser, useClerk } from '@clerk/clerk-react'

interface UserProfileProps {
  isRedacted: boolean;
}

export function UserProfile({ isRedacted }: UserProfileProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Only call Clerk hooks when auth is enabled
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const user = isAuthEnabled() ? useUser().user : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const signOut = isAuthEnabled() ? useClerk().signOut : null;

  const clerkHooks = { 
    user, 
    signOut 
  };

  // Use the values conditionally
  const userData = {
    fullName: isRedacted ? "***" : (isAuthEnabled() && clerkHooks.user?.fullName || 'Demo User'),
    email: isRedacted ? "***" : (isAuthEnabled() && clerkHooks.user?.primaryEmailAddress?.emailAddress || 'demo@example.com'),
    imageUrl: isAuthEnabled() && clerkHooks.user?.imageUrl 
      ? clerkHooks.user.imageUrl 
      : "https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/6722f2e1aa50560b1eae60a1_favicon-nodable-knowledge.png"
  }

  const handleLogout = async () => {
    if (isAuthEnabled() && clerkHooks.signOut) {
      try {
        await clerkHooks.signOut();
        setIsExpanded(false);
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account"
        });
      } catch (error) {
        toast({
          title: "Error logging out",
          description: "There was a problem logging out of your account",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Demo Mode",
        description: "Logout is disabled in demo mode"
      });
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { 
      icon: User, 
      label: 'Configuration',
      onClick: () => {
        setIsExpanded(false)
        navigate('/user/profile')
      }
    },
    { 
      icon: CreditCard, 
      label: 'Billing & Usage',
      onClick: () => {
        setIsExpanded(false)
        navigate('/user/billing')
      }
    },
    { 
      icon: LogOut, 
      label: 'Log Out',
      onClick: handleLogout,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50/20'
    }
  ]

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Expanded Menu */}
        <div className={cn(
          "absolute bottom-full left-0 right-0",
          "glass-panel backdrop-blur-md bg-white/40",
          "border border-white/20 rounded-t-xl",
          "transition-all duration-150 ease-in-out",
          "overflow-hidden",
          isExpanded ? "h-[132px] opacity-100" : "h-0 opacity-0"
        )}>
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={item.onClick}
              className={cn(
                "w-full h-11 justify-start text-gray-600 hover:text-gray-900 hover:bg-white/50",
                "transition-colors duration-200",
                item.className
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
            "w-full p-4 flex items-center gap-3",
            "border-t border-white/20",
            "transition-colors duration-200",
            "hover:bg-white/50",
            isExpanded && "bg-white/30"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <img
              src={userData.imageUrl}
              alt={userData.fullName}
              className="w-6 h-6 rounded-md"
            />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-900">
              {userData.fullName}
            </div>
            <div className="text-xs text-gray-500">
              {userData.email}
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
    </>
  )
}
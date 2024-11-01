import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, User, CreditCard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function UserProfile() {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account"
    })
    // Additional logout logic would go here
  }

  const menuItems = [
    { icon: User, label: 'Profile Settings' },
    { icon: CreditCard, label: 'Billing & Usage' },
    { 
      icon: LogOut, 
      label: 'Log Out',
      onClick: handleLogout,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50/20'
    }
  ]

  return (
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
            src="https://cdn.prod.website-files.com/669ed0783d780b8512f370a5/6722f2e1aa50560b1eae60a1_favicon-nodable-knowledge.png"
            alt=""
            className="w-6 h-6"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">Alex Doonanco</div>
          <div className="text-xs text-gray-500">alex@nodable.ai</div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  )
}
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CampaignBadgeProps {
  name: string;
  status: string;
  className?: string;
}

export function CampaignBadge({ name, status, className = '' }: CampaignBadgeProps) {
  const statusColor = 
    status === 'completed' ? 'bg-green-100 text-green-800' :
    status === 'failed' ? 'bg-red-100 text-red-800' :
    status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
    'bg-gray-100 text-gray-800';

  const formattedStatus = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} ${className}`}>
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Status: {formattedStatus}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 
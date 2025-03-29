import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/use-preferences";
import { useInitialData } from "@/hooks/use-client-data";
import { useUserRole } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Phone, Clock, DollarSign, ArrowRightLeft } from "lucide-react";

interface TopMetricsBarProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics?: {
    title: string;
    value: string | number;
    info?: string;
  }[];
}

export function TopMetricsBar({ metrics = [], className }: TopMetricsBarProps) {
  const { selectedCampaignId, setSelectedCampaignId } = usePreferences();
  const { clientInfo } = useInitialData();
  const { isAdmin } = useUserRole();

  if (!metrics?.length) return null;

  // Generate campaign options
  const campaignOptions = [
    { value: "all", label: "All Campaigns" },
    ...(clientInfo?.campaigns?.map((campaign) => ({
      value: campaign.id,
      label: campaign.name || campaign.description,
    })) || []),
  ];

  // Filter out cost metrics for non-admin users
  const filteredMetrics = metrics.filter((metric) => {
    if (!isAdmin) {
      return (
        !metric.title.toLowerCase().includes("cost") &&
        !metric.title.toLowerCase().includes("spend")
      );
    }
    return true;
  });

  // Map metrics to icons
  const getMetricIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case "today's total calls":
        return <Phone className="h-4 w-4" />;
      case "total duration":
        return <Clock className="h-4 w-4" />;
      case "total cost":
        return <DollarSign className="h-4 w-4" />;
      case "today's transfers":
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-10 w-full",
        "bg-white/40 backdrop-blur-xl",
        "shadow-[0_0_15px_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      <div className="flex h-14 w-full items-center justify-between px-4">
        <Select
          value={selectedCampaignId}
          onValueChange={setSelectedCampaignId}
        >
          <SelectTrigger className="w-[300px] bg-white/50 border-white/30 hover:bg-white/60 transition-colors">
            <SelectValue placeholder="Select Campaign" />
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-xl border-white/30 shadow-lg">
            {campaignOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center">
          {filteredMetrics.map((metric) => (
            <TooltipProvider key={metric.title}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 px-6 hover:bg-white/50 transition-colors duration-200 h-14 first:border-l-0">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      {getMetricIcon(metric.title)}
                      <span className="text-sm whitespace-nowrap">
                        {metric.title}
                      </span>
                    </div>
                    <span className="font-medium whitespace-nowrap">
                      {metric.value}
                    </span>
                  </div>
                </TooltipTrigger>
                {metric.info && (
                  <TooltipContent className="bg-white/80 backdrop-blur-xl border-white/30">
                    <p>{metric.info}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
}

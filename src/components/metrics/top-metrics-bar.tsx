import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/use-preferences";
import { useInitialData } from "@/hooks/use-client-data";
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

  if (!metrics?.length) return null;

  // Generate campaign options
  const campaignOptions = [
    { value: "all", label: "All Campaigns" },
    ...(clientInfo?.campaigns?.map((campaign) => ({
      value: campaign.id,
      label: campaign.name || campaign.description,
    })) || []),
  ];

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
        "sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="flex h-14 w-full items-center justify-between px-4">
        <Select
          value={selectedCampaignId}
          onValueChange={setSelectedCampaignId}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select Campaign" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg">
            {campaignOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center divide-x">
          {metrics.map((metric) => (
            <TooltipProvider key={metric.title}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 px-6 hover:bg-black/5 transition-colors duration-200 h-14">
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
                  <TooltipContent>
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

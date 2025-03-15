import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  info?: string;
}

export function KPICard({ title, value, change, info }: KPICardProps) {
  const isPositiveChange = change?.startsWith("+");

  // Use state to prevent unintended concatenation
  const [displayValue, setDisplayValue] = useState<string>("Loading...");

  // Update display value when prop changes
  useEffect(() => {
    // Log the incoming value for debugging
    console.log(`KPICard "${title}" received value:`, {
      value,
      type: typeof value,
    });

    // Ensure value is treated as a string without concatenation
    if (typeof value === "number") {
      setDisplayValue(value.toLocaleString());
    } else {
      setDisplayValue(String(value));
    }
  }, [value, title]);

  return (
    <Card className="glass-panel interactive cursor-pointer overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
          {title}
          {info && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center rounded-full hover:bg-white/20 w-5 h-5 transition-colors">
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  sideOffset={4}
                  className="glass-panel bg-white/95 backdrop-blur-xl border border-white/30 shadow-lg z-[99999] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                  <p className="text-sm text-gray-900 max-w-[200px]">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{displayValue}</div>
        {change && (
          <p
            className={cn(
              "text-xs font-medium",
              isPositiveChange ? "text-emerald-600" : "text-red-600",
            )}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { cn } from "@/lib/utils";

interface TopMetricsBarProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics?: {
    title: string;
    value: string | number;
  }[];
}

export function TopMetricsBar({ metrics = [], className }: TopMetricsBarProps) {
  if (!metrics?.length) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex w-full border-b bg-background/95 backdrop-blur",
        className,
      )}
    >
      <div className="flex w-full">
        {metrics.map((metric) => (
          <div key={metric.title} className="flex-1 min-w-0 px-4 py-3">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {metric.title}
            </p>
            <p className="text-sm font-medium truncate">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

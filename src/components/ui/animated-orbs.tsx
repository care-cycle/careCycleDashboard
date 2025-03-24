import { cn } from "@/lib/utils";

interface AnimatedOrbsProps {
  className?: string;
  containerClassName?: string;
  variant?: "default" | "sidebar";
}

export function AnimatedOrbs({
  className,
  containerClassName,
  variant = "default",
}: AnimatedOrbsProps) {
  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "fixed inset-0 -z-10 isolate pointer-events-none overflow-hidden",
          containerClassName,
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0",
            "pointer-events-none select-none",
            "animate-gradient-slow",
            className,
          )}
          style={
            {
              background: `
              radial-gradient(circle at var(--gradient-pos-1, 30% 20%), rgba(23, 190, 187, 0.08), transparent 50%),
              radial-gradient(circle at var(--gradient-pos-2, 70% 80%), rgba(109, 143, 214, 0.08), transparent 50%)
            `,
              zIndex: -9999,
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              "--gradient-pos-1": "30% 20%",
              "--gradient-pos-2": "70% 80%",
            } as React.CSSProperties
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 -z-10 isolate pointer-events-none overflow-hidden",
        containerClassName,
      )}
    >
      {/* Base gradient layer */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0",
          "pointer-events-none select-none",
          "animate-gradient-base",
          className,
        )}
        style={
          {
            background: `
            radial-gradient(160% 160% at var(--gradient-pos-1, 0% 0%), rgba(23, 190, 187, 0.18) 0%, transparent 70%),
            radial-gradient(160% 160% at var(--gradient-pos-2, 100% 0%), rgba(101, 100, 219, 0.18) 0%, transparent 70%),
            radial-gradient(160% 160% at var(--gradient-pos-3, 100% 100%), rgba(109, 143, 214, 0.18) 0%, transparent 70%),
            radial-gradient(160% 160% at var(--gradient-pos-4, 0% 100%), rgba(197, 162, 246, 0.18) 0%, transparent 70%)
          `,
            zIndex: -9999,
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            "--gradient-pos-1": "0% 0%",
            "--gradient-pos-2": "100% 0%",
            "--gradient-pos-3": "100% 100%",
            "--gradient-pos-4": "0% 100%",
          } as React.CSSProperties
        }
      />
      {/* Animated overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 opacity-30",
          "pointer-events-none select-none",
          "animate-gradient-rotate",
          className,
        )}
        style={
          {
            background: `
            conic-gradient(from var(--gradient-angle, 0deg) at 50% 50%,
              rgba(23, 190, 187, 0.15) 0deg,
              rgba(101, 100, 219, 0.15) 90deg,
              rgba(109, 143, 214, 0.15) 180deg,
              rgba(197, 162, 246, 0.15) 270deg,
              rgba(23, 190, 187, 0.15) 360deg
            )
          `,
            zIndex: -9998,
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            "--gradient-angle": "0deg",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

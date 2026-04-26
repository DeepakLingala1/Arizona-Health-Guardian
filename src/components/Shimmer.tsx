// Spark AZ — shimmer skeleton with a moving gradient (replaces plain animate-pulse)
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Optional aria-label so screen readers announce a loading state */
  label?: string;
}

export function Shimmer({ className, label }: Props) {
  return (
    <div
      role={label ? "status" : undefined}
      aria-label={label}
      aria-live={label ? "polite" : undefined}
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        // 200% wide gradient that pans via the `shimmer` keyframe (in tailwind.config.ts)
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-[linear-gradient(90deg,transparent,hsl(var(--card)/0.55),transparent)]",
        "after:bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function ShimmerLines({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn("h-3", i === count - 1 ? "w-2/3" : i % 2 === 0 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

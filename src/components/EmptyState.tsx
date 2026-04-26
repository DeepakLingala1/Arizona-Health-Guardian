// Spark AZ — branded empty state. SVG glyph + voice + optional CTA.
import { ReactNode } from "react";
import { LucideIcon, Inbox, Sparkles, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "default" | "alerts" | "map" | "clusters";

interface Props {
  variant?: Variant;
  Icon?: LucideIcon;
  title?: string;
  body?: string;
  cta?: ReactNode;
  className?: string;
}

const VARIANT_ICON: Record<Variant, LucideIcon> = {
  default: Inbox,
  alerts: Inbox,
  map: MapPin,
  clusters: Sparkles,
};

export function EmptyState({ variant = "default", Icon, title, body, cta, className }: Props) {
  const Glyph = Icon ?? VARIANT_ICON[variant];
  return (
    <div
      role="status"
      className={cn(
        "card-elevated p-8 sm:p-10 text-center flex flex-col items-center gap-3",
        className
      )}
    >
      <div className="relative w-14 h-14 mb-1" aria-hidden="true">
        {/* Soft halo */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-hero opacity-70 blur-md" />
        <div className="relative w-14 h-14 rounded-2xl border border-border bg-card flex items-center justify-center">
          <Glyph className="w-6 h-6 text-primary/80" strokeWidth={1.6} />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-spark animate-spark-pulse"
            aria-hidden="true"
          />
        </div>
      </div>
      {title && <div className="font-semibold text-base">{title}</div>}
      {body && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{body}</p>
      )}
      {cta}
    </div>
  );
}

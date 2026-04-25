// Spark AZ — county alert banner shown on dashboard
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  body: string;
  severity: string;
}

const SEV_COLOR: Record<string, string> = {
  low: "risk-low",
  moderate: "risk-moderate",
  elevated: "risk-elevated",
  high: "risk-high",
};

export function AlertBanner({ title, body, severity }: Props) {
  const color = SEV_COLOR[severity] ?? "risk-elevated";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-elevated relative overflow-hidden border-l-4`}
      style={{ borderLeftColor: `hsl(var(--${color}))` }}
    >
      <div className="p-5 flex gap-4 items-start">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `hsl(var(--${color}) / 0.15)` }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: `hsl(var(--${color}))` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] uppercase tracking-widest font-bold"
            style={{ color: `hsl(var(--${color}))` }}
          >
            {severity} alert
          </div>
          <div className="font-semibold mt-0.5">{title}</div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{body}</p>
        </div>
        <Link
          to="/insights"
          className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

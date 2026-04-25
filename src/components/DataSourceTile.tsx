import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number[];
  context?: string;
  tone?: "default" | "warning" | "alert";
  feedingScore?: boolean;
}

export function DataSourceTile({ icon, label, value, unit, trend, context, tone = "default", feedingScore }: Props) {
  const toneStyles = {
    default: "border-border",
    warning: "border-risk-moderate/40",
    alert: "border-risk-high/40",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("rounded-2xl bg-card border p-5 shadow-card", toneStyles)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          tone === "alert" ? "bg-risk-high/10 text-risk-high" :
          tone === "warning" ? "bg-risk-moderate/10 text-risk-moderate" :
          "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
        {feedingScore && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            Feeding score
          </span>
        )}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {context && <div className="text-xs text-muted-foreground mt-1">{context}</div>}
      {trend && trend.length > 1 && (
        <div className="h-8 -mx-1 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.map((v, i) => ({ i, v }))}>
              <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

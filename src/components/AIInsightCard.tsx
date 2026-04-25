import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  insight: string;
  recommendations?: string[];
  loading?: boolean;
}

export function AIInsightCard({ insight, recommendations, loading }: Props) {
  const [revealed, setRevealed] = useState("");

  useEffect(() => {
    if (loading || !insight) {
      setRevealed("");
      return;
    }
    setRevealed("");
    const total = insight.length;
    const dur = 800;
    const steps = 60;
    let cancelled = false;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (cancelled) return;
      const progress = Math.min(1, i / steps);
      setRevealed(insight.slice(0, Math.floor(total * progress)));
      if (progress >= 1) clearInterval(interval);
    }, dur / steps);
    return () => { cancelled = true; clearInterval(interval); };
  }, [insight, loading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-card p-6"
    >
      {/* gradient border accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Risk Insight</div>
          <div className="text-sm font-semibold">Why this score, in plain English</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 mt-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </div>
      ) : (
        <p className="text-base leading-relaxed text-foreground/90 min-h-[5rem]">
          {revealed}
          {revealed.length < insight.length && (
            <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse" />
          )}
        </p>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recommended actions</div>
          {recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.15 }}
              className="flex items-start gap-2.5"
            >
              <div className={cn(
                "shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5",
                "bg-primary/10 text-primary"
              )}>
                {i + 1}
              </div>
              <div className="text-sm leading-relaxed text-foreground/85">{rec}</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

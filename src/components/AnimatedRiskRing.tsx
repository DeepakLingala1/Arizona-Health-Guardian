import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { bandFor } from "@/lib/riskScore";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  size?: number;
  showBand?: boolean;
}

export function AnimatedRiskRing({ score, size = 220, showBand = true }: Props) {
  const stroke = size * 0.07;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const band = bandFor(score);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const dashOffset = useTransform(count, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    const controls = animate(count, score, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [score, count]);

  const bandColors: Record<typeof band, [string, string]> = {
    Low: ["hsl(142 71% 45%)", "hsl(160 84% 39%)"],
    Moderate: ["hsl(45 94% 53%)", "hsl(38 92% 50%)"],
    Elevated: ["hsl(25 95% 56%)", "hsl(15 90% 55%)"],
    High: ["hsl(0 84% 60%)", "hsl(350 89% 58%)"],
  };
  const [c1, c2] = bandColors[band];

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`risk-grad-${band}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#risk-grad-${band})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div className="text-6xl font-bold tabular-nums leading-none" style={{ color: c1 }}>
          {rounded}
        </motion.div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Risk Score</div>
        {showBand && (
          <div
            className={cn("mt-3 px-3 py-1 rounded-full text-xs font-semibold")}
            style={{ backgroundColor: `${c1}22`, color: c1 }}
          >
            {band}
          </div>
        )}
      </div>
    </div>
  );
}

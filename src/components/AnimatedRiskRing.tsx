import { motion } from "framer-motion";

export function AnimatedRiskRing({ score = 0 }: { score?: number }) {
  const getStrokeColor = (s: number) => {
    if (s < 25) return "var(--color-success)";
    if (s < 50) return "var(--color-warning)";
    if (s < 75) return "var(--color-orange)";
    return "var(--color-destructive)";
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-3xl font-bold tabular-nums">{score}</div>
      </div>
    </div>
  );
}

// Spark AZ — Risk Ring v2: gradient arc, animated number counter, restrained glow.
// Replaces the inline SVG previously inlined in Dashboard.tsx with a self-contained component
// that's reusable on any surface (Dashboard hero, scenario card, model-card preview).
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { RiskBand } from "@/lib/riskScore";

interface Props {
  /** 0-100 composite risk score */
  score: number;
  band: RiskBand;
  bandLabel: string;
  /** Pixel size of the ring (default 192 = w-48). */
  size?: number;
  /** Label above the score, e.g. "Today" */
  topLabel?: string;
}

const BAND_COLOR_VAR: Record<RiskBand, string> = {
  Low: "--risk-low",
  Moderate: "--risk-moderate",
  Elevated: "--risk-elevated",
  High: "--risk-high",
};

// Each band gets a 2-stop gradient that gives the arc a sense of depth without flatness.
const BAND_GRADIENT: Record<RiskBand, [string, string]> = {
  Low: ["142 71% 55%", "142 71% 38%"],
  Moderate: ["45 94% 60%", "45 94% 46%"],
  Elevated: ["25 95% 60%", "25 95% 48%"],
  High: ["0 84% 65%", "0 84% 50%"],
};

export function RiskRing({ score, band, bandLabel, size = 192, topLabel }: Props) {
  const reduced = useReducedMotion();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  // Animate number counter
  const motion0 = useMotionValue(0);
  const display = useTransform(motion0, (v) => Math.round(v));
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const controls = animate(motion0, score, {
      duration: reduced ? 0 : 1.0,
      ease: "easeOut",
    });
    const unsub = display.on("change", (v) => setDisplayed(v as number));
    return () => {
      controls.stop();
      unsub();
    };
  }, [score, motion0, display, reduced]);

  // Unique gradient id so multiple rings on a page don't collide
  const idRef = useRef(`riskRingGrad-${Math.random().toString(36).slice(2, 9)}`);
  const gradId = idRef.current;
  const [from, to] = BAND_GRADIENT[band];
  const ringColor = `hsl(var(${BAND_COLOR_VAR[band]}))`;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${bandLabel}: ${score} of 100`}>
      {topLabel && (
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          {topLabel}
        </div>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor={`hsl(${from})`} />
              <stop offset="100%" stopColor={`hsl(${to})`} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          {/* Animated arc */}
          <motion.circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduced ? 0 : 1.0, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: `drop-shadow(0 0 6px ${ringColor.replace(")", " / 0.45)")})`,
            }}
          />
          {/* Tiny end-cap pulse */}
          {!reduced && score > 0 && (
            <motion.circle
              r={1.5}
              fill={ringColor}
              cx={50 + radius * Math.cos(2 * Math.PI * (score / 100) - Math.PI / 2)}
              cy={50 + radius * Math.sin(2 * Math.PI * (score / 100) - Math.PI / 2)}
              initial={{ scale: 0 }}
              animate={{ scale: [0.8, 1.4, 1] }}
              transition={{ delay: 1.0, duration: 0.9, repeat: Infinity, repeatDelay: 1.4 }}
            />
          )}
        </svg>

        {/* Score + label center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold tabular-nums leading-none">{displayed}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5 font-semibold">
            / 100
          </div>
        </div>
      </div>

      <div
        className="mt-4 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
        style={{
          backgroundColor: ringColor.replace(")", " / 0.15)"),
          color: ringColor,
        }}
      >
        {bandLabel}
      </div>
    </div>
  );
}

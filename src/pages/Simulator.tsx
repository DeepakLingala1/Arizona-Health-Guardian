import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { computeRisk, bandFor } from "@/lib/riskScore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plane, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function riskFill(score: number) {
  if (score < 25) return "#22C55E";
  if (score < 50) return "#FACC15";
  if (score < 75) return "#FB923C";
  return "#EF4444";
}

export default function Simulator() {
  const { profile } = useAuth();
  const [origin, setOrigin] = useState("Pima");
  const [destination, setDestination] = useState("Maricopa");
  const [days, setDays] = useState(3);

  const { data: counties } = useQuery({
    queryKey: ["sim-counties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("county_daily")
        .select("*")
        .order("date", { ascending: false });
      const map: Record<string, any> = {};
      for (const row of data ?? []) if (!map[row.county]) map[row.county] = row;
      return map;
    },
  });

  const { originRisk, destRisk, baseline, projected, delta, drivers } = useMemo(() => {
    const o = counties?.[origin];
    const d = counties?.[destination];
    const baselineRisk = computeRisk({
      symptoms: [],
      mood: 8,
      knownExposure: false,
      recentTravel: false,
      conditions: profile?.conditions ?? [],
      weather: o?.weather as any,
      airQuality: o?.air_quality as any,
      countyAggregate: o?.aggregate_risk ?? 30,
    });
    const projectedRisk = computeRisk({
      symptoms: [],
      mood: 8,
      knownExposure: false,
      recentTravel: true, // travel bonus
      conditions: profile?.conditions ?? [],
      weather: d?.weather as any,
      airQuality: d?.air_quality as any,
      countyAggregate: d?.aggregate_risk ?? 30,
    });
    return {
      originRisk: o?.aggregate_risk ?? 30,
      destRisk: d?.aggregate_risk ?? 30,
      baseline: baselineRisk.score,
      projected: projectedRisk.score,
      delta: projectedRisk.score - baselineRisk.score,
      drivers: projectedRisk.drivers,
    };
  }, [counties, origin, destination, profile]);

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Plane className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">What-if simulator</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Travel risk impact</h1>
        <p className="text-muted-foreground mt-1">Compare your risk between Arizona counties before you go.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 shadow-card space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">From</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTY_NAMES.map((c) => <SelectItem key={c} value={c}>{c} County</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTY_NAMES.map((c) => <SelectItem key={c} value={c}>{c} County</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Trip duration</Label>
            <span className="text-sm font-semibold tabular-nums">{days} {days === 1 ? "day" : "days"}</span>
          </div>
          <Slider min={1} max={14} step={1} value={[days]} onValueChange={(v) => setDays(v[0])} />
        </div>
      </div>

      {/* Visual diff */}
      <div className="mt-6 rounded-2xl bg-gradient-hero border border-border p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Today at home</div>
            <motion.div
              key={baseline}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold tabular-nums mt-1"
              style={{ color: riskFill(baseline) }}
            >
              {baseline}
            </motion.div>
            <div className="text-xs mt-1 text-muted-foreground">{origin} County</div>
          </div>
          <ArrowRight className="w-8 h-8 text-muted-foreground shrink-0" />
          <div className="flex-1 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Projected</div>
            <motion.div
              key={projected}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold tabular-nums mt-1"
              style={{ color: riskFill(projected) }}
            >
              {projected}
            </motion.div>
            <div className="text-xs mt-1 text-muted-foreground">{destination} County</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Net delta</span>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: delta > 0 ? "#FB923C" : delta < 0 ? "#22C55E" : "hsl(var(--muted-foreground))" }}
            >
              {delta > 0 ? "+" : ""}{delta}
            </span>
            <span className="text-sm text-muted-foreground">points</span>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-3">
            {delta > 5
              ? `This trip would meaningfully raise your risk. Consider precautions or shortening the trip.`
              : delta < -5
              ? `This trip should lower your daily risk exposure.`
              : `Minimal risk change — you're good to go with normal precautions.`}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {drivers.slice(0, 3).map((d, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label.length > 22 ? d.label.slice(0, 22) + "…" : d.label}</div>
              <div className="text-lg font-bold tabular-nums mt-1" style={{ color: d.weight > 0 ? "hsl(var(--primary))" : "hsl(var(--risk-low))" }}>
                {d.weight > 0 ? "+" : ""}{d.weight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

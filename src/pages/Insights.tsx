import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { bandFor, SYMPTOM_LABELS } from "@/lib/riskScore";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

function riskFill(score: number) {
  if (score < 25) return "#22C55E";
  if (score < 50) return "#FACC15";
  if (score < 75) return "#FB923C";
  return "#EF4444";
}

export default function Insights() {
  const { data: countyData } = useQuery({
    queryKey: ["insights-county"],
    queryFn: async () => {
      const { data } = await supabase
        .from("county_daily")
        .select("*")
        .order("date", { ascending: false });
      const map: Record<string, any> = {};
      for (const row of data ?? []) if (!map[row.county]) map[row.county] = row;
      return Object.values(map);
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-checkins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("checkins")
        .select("county, symptoms, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const topCounties = (countyData ?? [])
    .sort((a: any, b: any) => (b.aggregate_risk ?? 0) - (a.aggregate_risk ?? 0))
    .slice(0, 6);

  // Aggregate top drivers (top symptoms across counties)
  const driverMap: Record<string, number> = {};
  for (const c of countyData ?? []) {
    for (const s of (c.top_symptoms ?? []) as { symptom: string; count: number }[]) {
      driverMap[s.symptom] = (driverMap[s.symptom] ?? 0) + (s.count ?? 0);
    }
  }
  const driverData = Object.entries(driverMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s, v]) => ({ name: SYMPTOM_LABELS[s] ?? s, value: v }));

  // Cluster cards
  const clusterCards = (countyData ?? []).flatMap((c: any) =>
    ((c.clusters as { name: string; size: number; topSymptoms: string[] }[]) ?? [])
      .filter((cl) => cl.size >= 3)
      .map((cl) => ({ ...cl, county: c.county }))
  ).sort((a, b) => b.size - a.size).slice(0, 6);

  // Community pulse — group recent by county+symptom
  const pulse: { county: string; symptom: string; count: number }[] = [];
  const pulseMap: Record<string, number> = {};
  for (const c of recent ?? []) {
    for (const s of (c.symptoms ?? [])) {
      const k = `${c.county}|${s}`;
      pulseMap[k] = (pulseMap[k] ?? 0) + 1;
    }
  }
  Object.entries(pulseMap).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, count]) => {
    const [county, symptom] = k.split("|");
    pulse.push({ county, symptom, count });
  });

  return (
    <div className="container max-w-[1200px] py-8 md:py-12 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">AI-detected clusters and community trends across Arizona.</p>
      </div>

      {/* Top counties + Drivers */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Top counties by risk this week</h2>
          </div>
          <div className="space-y-2">
            {topCounties.map((c: any, i: number) => (
              <motion.div
                key={c.county}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary"
              >
                <div className="text-2xl font-bold tabular-nums w-8 text-muted-foreground">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold">{c.county} County</div>
                  <div className="text-xs text-muted-foreground">{c.checkin_count ?? 0} recent check-ins</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums" style={{ color: riskFill(c.aggregate_risk ?? 30) }}>
                    {c.aggregate_risk ?? "—"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{bandFor(c.aggregate_risk ?? 30)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Top risk drivers this week</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Clusters */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-semibold">Detected symptom clusters</h2>
        </div>
        {clusterCards.length === 0 ? (
          <div className="rounded-2xl bg-muted p-8 text-center text-muted-foreground">
            No active clusters detected. The k-means engine looks for emerging symptom patterns by county every 30 minutes.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusterCards.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-accent font-semibold">{c.county} County</span>
                  <span className="text-xs font-bold text-accent tabular-nums">{c.size} reports</span>
                </div>
                <div className="text-lg font-semibold mb-2">{c.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {c.topSymptoms.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-card text-xs">{SYMPTOM_LABELS[s] ?? s}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Community pulse */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Community pulse</h2>
        </div>
        {pulse.length === 0 ? (
          <p className="text-muted-foreground">No recent activity yet.</p>
        ) : (
          <div className="space-y-2">
            {pulse.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-b-0">
                <span><span className="tabular-nums font-bold">{p.count}</span> people in <span className="font-semibold">{p.county}</span> reported <span className="text-primary font-medium">{SYMPTOM_LABELS[p.symptom] ?? p.symptom}</span> recently</span>
                {recent && recent[0] && (
                  <span className="text-xs text-muted-foreground hidden md:block">
                    {formatDistanceToNow(new Date(recent[0].created_at!), { addSuffix: true })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

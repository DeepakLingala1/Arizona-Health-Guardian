// Spark AZ — 7-day trend (recharts) with risk-band shading, branded tooltip, shimmer skeleton.
import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceArea,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { Shimmer } from "@/components/Shimmer";
import { EmptyState } from "@/components/EmptyState";

interface Row {
  date: string;
  composite_risk: number;
  human_score: number;
  animal_score: number;
  vector_score: number;
  env_score: number;
}

interface Props {
  county: string;
}

interface TipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TipPayload[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-card px-3 py-2.5 text-xs">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} aria-hidden="true" />
            <span className="font-medium">{p.name}</span>
            <span className="ml-auto tabular-nums font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ county }: Props) {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("county_daily")
        .select("date, composite_risk, human_score, animal_score, vector_score, env_score")
        .eq("county", county)
        .gte("date", since)
        .order("date", { ascending: true });
      if (!cancel) {
        setRows((data as Row[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [county]);

  const data = useMemo(
    () =>
      rows.map((r) => ({
        date: r.date.slice(5), // MM-DD
        Composite: r.composite_risk,
        Human: r.human_score,
        Animal: r.animal_score,
        Vector: r.vector_score,
        Env: r.env_score,
      })),
    [rows]
  );

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            {t("home.trend7")}
          </div>
          <div className="text-sm font-medium mt-0.5 text-muted-foreground">
            {county} {locale === "es" ? "Condado" : "County"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Shimmer className="h-[180px] rounded-lg" label="Loading trend" />
          <div className="flex gap-3">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-12" />
            <Shimmer className="h-3 w-14" />
            <Shimmer className="h-3 w-12" />
            <Shimmer className="h-3 w-12" />
          </div>
        </div>
      ) : data.length < 2 ? (
        <EmptyState
          variant="default"
          Icon={TrendingUp}
          title={t("home.trend7")}
          body={t("home.trendEmpty")}
          className="!p-6"
        />
      ) : (
        <div className="h-[200px]" role="img" aria-label={`${t("home.trend7")} — ${county}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              {/* Risk-band shaded backgrounds (subtle) */}
              <ReferenceArea y1={0} y2={25}  fill="hsl(var(--risk-low))"      fillOpacity={0.04} />
              <ReferenceArea y1={25} y2={50} fill="hsl(var(--risk-moderate))" fillOpacity={0.04} />
              <ReferenceArea y1={50} y2={75} fill="hsl(var(--risk-elevated))" fillOpacity={0.05} />
              <ReferenceArea y1={75} y2={100} fill="hsl(var(--risk-high))"    fillOpacity={0.05} />
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.4, strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              <Line type="monotone" dataKey="Composite" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Human" stroke="hsl(var(--primary-glow))" strokeWidth={1.4} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="Animal" stroke="hsl(var(--earth))" strokeWidth={1.4} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="Vector" stroke="hsl(var(--vector))" strokeWidth={1.4} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
              <Line type="monotone" dataKey="Env" stroke="hsl(var(--spark))" strokeWidth={1.4} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

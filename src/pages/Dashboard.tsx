import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AnimatedRiskRing } from "@/components/AnimatedRiskRing";
import { AIInsightCard } from "@/components/AIInsightCard";
import { DataSourceTile } from "@/components/DataSourceTile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Wind, Users, Activity, ArrowRight, AlertTriangle, TrendingUp } from "lucide-react";
import { computeRisk, bandFor, SYMPTOM_LABELS } from "@/lib/riskScore";
import { format, subDays, startOfDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<{ insight: string; recommendations: string[] } | null>(null);

  // Last 14 user check-ins
  const { data: userCheckins } = useQuery({
    queryKey: ["user-checkins", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(14);
      return data ?? [];
    },
    enabled: !!user,
  });

  const homeCounty = profile?.home_county ?? "Pima";

  // County daily data
  const { data: countyDaily } = useQuery({
    queryKey: ["county-daily", homeCounty],
    queryFn: async () => {
      const { data } = await supabase
        .from("county_daily")
        .select("*")
        .eq("county", homeCounty)
        .order("date", { ascending: false })
        .limit(14);
      return data ?? [];
    },
  });

  const todayCounty = countyDaily?.[0];
  const todayCheckin = userCheckins?.find((c) => {
    const d = new Date(c.created_at!);
    return format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  });

  // Compute personal risk
  const risk = useMemo(() => {
    if (!todayCheckin) {
      // Baseline using county environment
      return computeRisk({
        symptoms: [],
        mood: 8,
        knownExposure: false,
        recentTravel: false,
        conditions: profile?.conditions ?? [],
        weather: (todayCounty?.weather as { temperatureF?: number }) ?? undefined,
        airQuality: (todayCounty?.air_quality as { aqi?: number; pm25?: number; dust?: number }) ?? undefined,
        countyAggregate: todayCounty?.aggregate_risk ?? 30,
        daysSinceLastSymptom: 5,
      });
    }
    return computeRisk({
      symptoms: todayCheckin.symptoms ?? [],
      mood: todayCheckin.mood ?? 7,
      knownExposure: todayCheckin.known_exposure ?? false,
      recentTravel: todayCheckin.recent_travel ?? false,
      conditions: profile?.conditions ?? [],
      weather: (todayCounty?.weather as { temperatureF?: number }) ?? undefined,
      airQuality: (todayCounty?.air_quality as { aqi?: number; pm25?: number; dust?: number }) ?? undefined,
      countyAggregate: todayCounty?.aggregate_risk ?? 30,
    });
  }, [todayCheckin, todayCounty, profile]);

  // Fetch / generate AI insight
  useEffect(() => {
    if (!user || !todayCounty) return;
    let cancelled = false;
    (async () => {
      // Try cached first
      const { data: cached } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("scope", "user")
        .eq("scope_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached && Date.now() - new Date(cached.generated_at as string).getTime() < 2 * 60 * 60 * 1000) {
        if (!cancelled) setInsight({ insight: cached.insight as string, recommendations: cached.recommendations as string[] });
        return;
      }

      setInsightLoading(true);
      try {
        const resp = await supabase.functions.invoke("generate-insight", {
          body: {
            scope: "user",
            scope_id: user.id,
            context: {
              score: risk.score,
              band: risk.band,
              county: homeCounty,
              symptoms: todayCheckin?.symptoms ?? [],
              recent_travel: todayCheckin?.recent_travel ?? false,
              known_exposure: todayCheckin?.known_exposure ?? false,
              conditions: profile?.conditions ?? [],
              weather: todayCounty?.weather,
              air_quality: todayCounty?.air_quality,
              county_aggregate: todayCounty?.aggregate_risk,
              drivers: risk.drivers.slice(0, 4),
            },
          },
        });
        if (!cancelled && resp.data && !resp.data.error) {
          setInsight({ insight: resp.data.insight, recommendations: resp.data.recommendations ?? [] });
        } else if (!cancelled) {
          // Fall back to a generic message
          setInsight({
            insight: `Your risk score today is ${risk.score} (${risk.band}) for ${homeCounty} County. Local conditions and your check-in are the main inputs. Stay attentive and follow Arizona-specific precautions for heat, dust, and air quality.`,
            recommendations: [
              "Keep hydrated — at least 8 glasses of water on hot days",
              "Limit outdoor exertion when AQI exceeds 100 or temperatures top 100°F",
              "Check in daily so the AI can refine your personalized risk",
            ],
          });
        }
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, todayCounty?.date, risk.score, homeCounty]);

  // Trend data
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = startOfDay(subDays(new Date(), 6 - i));
      const ds = format(d, "yyyy-MM-dd");
      const dayCheckins = userCheckins?.filter((c) => format(new Date(c.created_at!), "yyyy-MM-dd") === ds) ?? [];
      const personal = dayCheckins.length
        ? Math.round(dayCheckins.reduce((a, b) => a + (b.risk_score ?? 0), 0) / dayCheckins.length)
        : null;
      const county = countyDaily?.find((cd) => cd.date === ds)?.aggregate_risk ?? null;
      return {
        day: format(d, "EEE"),
        personal,
        county,
      };
    });
    return days;
  }, [userCheckins, countyDaily]);

  const weather = todayCounty?.weather as { temperatureF?: number; humidity?: number } | null;
  const aq = todayCounty?.air_quality as { aqi?: number; pm25?: number; dust?: number } | null;
  const cluster = (todayCounty?.clusters as { name: string; size: number }[] | null)?.find((c) => c.size >= 4 && c.name.includes("Respiratory"));

  return (
    <div className="container max-w-[1200px] py-8 md:py-12">
      {/* Outbreak alert */}
      {cluster && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-accent/40 bg-accent/5 p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground">Outbreak signal: {cluster.name} in {homeCounty} County</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {cluster.size} recent check-ins cluster on respiratory symptoms (cough · fever · fatigue). Velocity up week-over-week.
            </div>
          </div>
          <Link to="/insights">
            <Button variant="ghost" size="sm" className="shrink-0">View<ArrowRight className="w-4 h-4 ml-1" /></Button>
          </Link>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Risk ring + check-in CTA */}
        <div className="lg:col-span-1 rounded-2xl bg-gradient-hero border border-border p-6 flex flex-col items-center text-center shadow-card">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{format(new Date(), "EEEE · MMM d")}</div>
          <div className="text-sm text-muted-foreground mb-4">{homeCounty} County</div>
          <AnimatedRiskRing score={risk.score} />
          {!todayCheckin ? (
            <Link to="/checkin" className="w-full mt-6">
              <Button className="w-full shadow-glow" size="lg">
                Check in today <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <div className="mt-6 text-sm text-muted-foreground">
              ✓ Checked in {format(new Date(todayCheckin.created_at!), "h:mm a")}
            </div>
          )}
          <div className="w-full mt-4 pt-4 border-t border-border">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Top driver</div>
            <div className="text-sm font-medium">{risk.drivers[1]?.label ?? risk.drivers[0]?.label ?? "Baseline"}</div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="lg:col-span-2">
          {insight ? (
            <AIInsightCard insight={insight.insight} recommendations={insight.recommendations} loading={insightLoading} />
          ) : (
            <div className="rounded-2xl bg-card border border-border p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-5/6 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          )}
        </div>
      </div>

      {/* Data tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DataSourceTile
          icon={<Cloud className="w-5 h-5" />}
          label="Weather"
          value={weather?.temperatureF ? Math.round(weather.temperatureF) : "—"}
          unit="°F"
          context={weather?.humidity != null ? `${weather.humidity}% humidity` : "Live, Open-Meteo"}
          tone={(weather?.temperatureF ?? 0) >= 100 ? "warning" : "default"}
          feedingScore
          trend={countyDaily?.slice(0, 7).reverse().map((d) => (d.weather as { temperatureF?: number })?.temperatureF ?? 80)}
        />
        <DataSourceTile
          icon={<Wind className="w-5 h-5" />}
          label="Air Quality"
          value={aq?.aqi ?? "—"}
          unit="AQI"
          context={aq?.dust != null ? `Dust ${Math.round(aq.dust)} μg/m³` : "Live, Open-Meteo"}
          tone={(aq?.aqi ?? 0) > 100 ? "alert" : (aq?.aqi ?? 0) > 50 ? "warning" : "default"}
          feedingScore
          trend={countyDaily?.slice(0, 7).reverse().map((d) => (d.air_quality as { aqi?: number })?.aqi ?? 40)}
        />
        <DataSourceTile
          icon={<Activity className="w-5 h-5" />}
          label="Public Health"
          value={todayCounty?.aggregate_risk ?? "—"}
          unit="/100"
          context="County aggregate · CDC + reports"
          tone={(todayCounty?.aggregate_risk ?? 0) > 60 ? "warning" : "default"}
          feedingScore
          trend={countyDaily?.slice(0, 7).reverse().map((d) => d.aggregate_risk ?? 30)}
        />
        <DataSourceTile
          icon={<Users className="w-5 h-5" />}
          label="Community"
          value={todayCounty?.checkin_count ?? 0}
          unit="check-ins/24h"
          context={`Top: ${(todayCounty?.top_symptoms as { symptom: string }[])?.[0]?.symptom ? SYMPTOM_LABELS[((todayCounty?.top_symptoms as { symptom: string }[])?.[0]?.symptom)] ?? "—" : "—"}`}
          feedingScore
        />
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">7-Day Risk Trend</div>
            <div className="text-lg font-semibold">Your score vs {homeCounty} County</div>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="personal" name="You" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="county" name={`${homeCounty} County`} stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

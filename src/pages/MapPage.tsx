import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sparkles, Cloud, Wind, Users, Activity } from "lucide-react";
import { bandFor, SYMPTOM_LABELS } from "@/lib/riskScore";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, ResponsiveContainer } from "recharts";

function riskFill(score: number) {
  if (score < 25) return "#22C55E";
  if (score < 50) return "#FACC15";
  if (score < 75) return "#FB923C";
  return "#EF4444";
}

export default function MapPage() {
  const [geojson, setGeojson] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [insight, setInsight] = useState<{ insight: string; recommendations: string[] } | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const { data: countyData } = useQuery({
    queryKey: ["all-county-daily"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("county_daily")
        .select("*")
        .order("date", { ascending: false });
      // Pick most recent per county
      const map: Record<string, any> = {};
      for (const row of data ?? []) {
        if (!map[row.county]) map[row.county] = row;
      }
      return map;
    },
  });

  const { data: countyHistory } = useQuery({
    queryKey: ["county-history", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("county_daily")
        .select("date, aggregate_risk")
        .eq("county", selected!)
        .order("date", { ascending: true })
        .limit(14);
      return data ?? [];
    },
  });

  useEffect(() => {
    fetch("/arizona-counties.geojson").then((r) => r.json()).then(setGeojson);
  }, []);

  // Generate insight when county selected
  useEffect(() => {
    if (!selected || !countyData) return;
    setInsight(null);
    let cancelled = false;
    (async () => {
      // Cached check
      const { data: cached } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("scope", "county")
        .eq("scope_id", selected)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached && Date.now() - new Date(cached.generated_at as string).getTime() < 6 * 60 * 60 * 1000) {
        if (!cancelled) setInsight({ insight: cached.insight as string, recommendations: cached.recommendations as string[] });
        return;
      }
      setInsightLoading(true);
      const cd = countyData[selected];
      const resp = await supabase.functions.invoke("generate-insight", {
        body: {
          scope: "county",
          scope_id: selected,
          context: {
            county: selected,
            aggregate_risk: cd?.aggregate_risk ?? 30,
            checkin_count: cd?.checkin_count ?? 0,
            top_symptoms: cd?.top_symptoms ?? [],
            clusters: cd?.clusters ?? [],
            weather: cd?.weather,
            air_quality: cd?.air_quality,
          },
        },
      });
      if (!cancelled) {
        if (resp.data && !resp.data.error) {
          setInsight({ insight: resp.data.insight, recommendations: resp.data.recommendations ?? [] });
        } else {
          setInsight({
            insight: `${selected} County aggregate risk is ${cd?.aggregate_risk ?? "—"}/100 with ${cd?.checkin_count ?? 0} reported check-ins in the last 24 hours.`,
            recommendations: ["Continue daily check-ins", "Monitor local AQI", "Stay hydrated"],
          });
        }
        setInsightLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected, countyData]);

  const styleFn = (feature: any) => {
    const name = feature.properties.NAME;
    const score = countyData?.[name]?.aggregate_risk ?? 30;
    return {
      fillColor: riskFill(score),
      fillOpacity: 0.55,
      color: "#0E7C7B",
      weight: 1,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const name = feature.properties.NAME;
    const score = countyData?.[name]?.aggregate_risk ?? 30;
    const tooltip = `<div style="font-family:Inter;padding:4px 6px"><strong>${name}</strong><br/><span style="color:${riskFill(score)}">${bandFor(score)} · ${score}/100</span></div>`;
    layer.bindTooltip(tooltip, { sticky: true, className: "leaflet-tooltip-az" });
    layer.on({
      mouseover: (e) => (e.target.setStyle({ weight: 2.5, fillOpacity: 0.7 })),
      mouseout: (e) => (e.target.setStyle({ weight: 1, fillOpacity: 0.55 })),
      click: () => setSelected(name),
    });
  };

  const cd = selected ? countyData?.[selected] : null;
  const weather = cd?.weather as { temperatureF?: number } | null;
  const aq = cd?.air_quality as { aqi?: number; dust?: number } | null;
  const topSymptoms = (cd?.top_symptoms as { symptom: string; count: number }[]) ?? [];
  const clusters = (cd?.clusters as { name: string; size: number; topSymptoms: string[] }[]) ?? [];

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem-3.5rem)]">
      <div className="absolute top-4 left-4 z-[400] bg-card/95 backdrop-blur border border-border rounded-2xl px-4 py-3 shadow-card max-w-xs">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Arizona heatmap</div>
        <div className="font-semibold">15 counties · live aggregate risk</div>
        <div className="flex items-center gap-2 mt-2 text-[11px]">
          {[
            { l: "Low", c: "#22C55E" },
            { l: "Mod", c: "#FACC15" },
            { l: "Elev", c: "#FB923C" },
            { l: "High", c: "#EF4444" },
          ].map((b) => (
            <div key={b.l} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ background: b.c }} /> {b.l}
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={[34.2, -111.6]}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {geojson && countyData && (
          <GeoJSON key={JSON.stringify(countyData).slice(0, 50)} data={geojson} style={styleFn as any} onEachFeature={onEachFeature} />
        )}
      </MapContainer>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selected} County
              {cd?.aggregate_risk != null && (
                <span
                  className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
                  style={{ backgroundColor: `${riskFill(cd.aggregate_risk)}22`, color: riskFill(cd.aggregate_risk) }}
                >
                  {bandFor(cd.aggregate_risk)} · {cd.aggregate_risk}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              {cd?.checkin_count ?? 0} community check-ins in the last 24 hours
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Sparkline */}
            {countyHistory && countyHistory.length > 1 && (
              <div className="rounded-xl bg-secondary p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">14-day trend</div>
                <div className="h-16 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={countyHistory}>
                      <Line type="monotone" dataKey="aggregate_risk" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Weather + AQI */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Cloud className="w-3.5 h-3.5" /> Weather</div>
                <div className="text-2xl font-bold tabular-nums mt-1">{weather?.temperatureF ? Math.round(weather.temperatureF) : "—"}°F</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wind className="w-3.5 h-3.5" /> Air quality</div>
                <div className="text-2xl font-bold tabular-nums mt-1">{aq?.aqi ?? "—"} <span className="text-xs text-muted-foreground font-normal">AQI</span></div>
              </div>
            </div>

            {/* Top symptoms */}
            {topSymptoms.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Top reported symptoms</div>
                <div className="space-y-1.5">
                  {topSymptoms.slice(0, 3).map((t) => (
                    <div key={t.symptom} className="flex items-center gap-2 text-sm">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <span>{SYMPTOM_LABELS[t.symptom] ?? t.symptom}</span>
                      <span className="ml-auto text-muted-foreground tabular-nums">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clusters */}
            {clusters.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Detected clusters (k-means)</div>
                <div className="space-y-2">
                  {clusters.map((c, i) => (
                    <div key={i} className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{c.name}</div>
                        <span className="text-xs text-accent font-bold tabular-nums">{c.size} reports</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {c.topSymptoms.map((s) => SYMPTOM_LABELS[s] ?? s).join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insight */}
            <div className="rounded-2xl border border-border bg-gradient-hero p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="text-xs uppercase tracking-wider text-muted-foreground">AI county summary</div>
              </div>
              {insightLoading || !insight ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed">{insight.insight}</p>
                  {insight.recommendations.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {insight.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

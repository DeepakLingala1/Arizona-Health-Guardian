// Spark AZ — Arizona One Health Map (Leaflet, layer toggle, county drill-down)
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip as LTooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { Layers, X, Sparkles } from "lucide-react";

type LayerKey = "composite_risk" | "human_score" | "animal_score" | "vector_score" | "env_score";

const LAYER_META: { key: LayerKey; labelKey: string; color: string }[] = [
  { key: "composite_risk", labelKey: "map.layer.composite", color: "primary" },
  { key: "human_score", labelKey: "map.layer.human", color: "primary" },
  { key: "animal_score", labelKey: "map.layer.animal", color: "earth" },
  { key: "vector_score", labelKey: "map.layer.vector", color: "vector" },
  { key: "env_score", labelKey: "map.layer.env", color: "spark" },
];

function colorForScore(score: number) {
  if (score < 25) return "hsl(142 71% 45%)";
  if (score < 50) return "hsl(45 94% 53%)";
  if (score < 75) return "hsl(25 95% 56%)";
  return "hsl(0 84% 60%)";
}

interface CountyRow {
  county: string;
  composite_risk: number;
  human_score: number;
  animal_score: number;
  vector_score: number;
  env_score: number;
  checkin_count: number;
  top_human_symptoms: any;
  top_animal_signs: any;
  top_env_signals: any;
  clusters: any;
}

export default function MapPage() {
  const { t, locale } = useLocale();
  const [layer, setLayer] = useState<LayerKey>("composite_risk");
  const [geojson, setGeojson] = useState<any>(null);
  const [counties, setCounties] = useState<Record<string, CountyRow>>({});
  const [selected, setSelected] = useState<CountyRow | null>(null);
  const [aiInsight, setAiInsight] = useState<{ insight: string; recs: string[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/arizona-counties.geojson").then((r) => r.json()).then(setGeojson).catch(console.error);
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("county_daily")
        .select("*").gte("date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
      const map: Record<string, CountyRow> = {};
      (data ?? []).forEach((r: any) => {
        if (!map[r.county] || r.date >= (map[r.county] as any).date) map[r.county] = r;
      });
      // ensure all counties present
      COUNTY_NAMES.forEach((c) => {
        if (!map[c]) map[c] = {
          county: c, composite_risk: 0, human_score: 0, animal_score: 0,
          vector_score: 0, env_score: 0, checkin_count: 0,
          top_human_symptoms: [], top_animal_signs: [], top_env_signals: [], clusters: [],
        };
      });
      setCounties(map);
    })();
  }, []);

  const styleFn = useMemo(() => (feature: any) => {
    const name = feature.properties?.NAME ?? feature.properties?.name;
    const row = counties[name];
    const score = (row as any)?.[layer] ?? 0;
    return {
      fillColor: colorForScore(score),
      weight: 1,
      color: "hsl(var(--card))",
      fillOpacity: row?.checkin_count ? 0.75 : 0.35,
    };
  }, [counties, layer]);

  const onEach = (feature: any, lyr: L.Layer) => {
    const name = feature.properties?.NAME ?? feature.properties?.name;
    lyr.on({
      click: () => {
        const row = counties[name];
        if (row) {
          setSelected(row);
          loadAiInsight(row);
        }
      },
      mouseover: (e) => (e.target as L.Path).setStyle({ weight: 2.5, color: "hsl(var(--primary))" }),
      mouseout: (e) => (e.target as L.Path).setStyle({ weight: 1, color: "hsl(var(--card))" }),
    });
    const row = counties[name];
    lyr.bindTooltip(`<b>${name}</b><br/>${(row as any)?.[layer] ?? 0} / 100`, {
      sticky: true, className: "!bg-card !border-border !text-foreground",
    });
  };

  async function loadAiInsight(row: CountyRow) {
    setAiInsight(null);
    setAiLoading(true);
    try {
      const { data } = await supabase.functions.invoke("generate-insight", {
        body: {
          scope: "county", scope_id: row.county, language: locale,
          payload: {
            county: row.county,
            composite: row.composite_risk,
            subscores: {
              human: row.human_score, animal: row.animal_score,
              vector: row.vector_score, environmental: row.env_score,
            },
            top_human_symptoms: row.top_human_symptoms,
            top_animal_signs: row.top_animal_signs,
            top_env_signals: row.top_env_signals,
            clusters: row.clusters,
          },
        },
      });
      setAiInsight({ insight: data?.insight ?? "", recs: data?.recommendations ?? data?.raw?.watchlist ?? [] });
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="container max-w-[1200px] py-8 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("app.subtitle")}</div>
          <h1 className="text-3xl font-bold mt-1">{t("map.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === "es"
              ? "Toca un condado para ver señales Una Salud y la lectura IA."
              : "Tap a county to see One Health signals and the AI read."}
          </p>
        </div>

        <div className="card-elevated p-1.5 flex items-center gap-1 flex-wrap">
          <Layers className="w-4 h-4 text-muted-foreground ml-2" />
          {LAYER_META.map((l) => (
            <button
              key={l.key}
              onClick={() => setLayer(l.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                layer === l.key ? `bg-${l.color} text-${l.color}-foreground` : "hover:bg-secondary"
              }`}
            >
              {t(l.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-elevated overflow-hidden h-[540px]">
          <MapContainer
            center={[34.3, -111.7]} zoom={6} style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {geojson && <GeoJSON data={geojson} style={styleFn as any} onEachFeature={onEach} key={layer} />}
          </MapContainer>
        </div>

        <div className="card-elevated p-5 max-h-[540px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.county}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                      {t("common.county")}
                    </div>
                    <h2 className="text-2xl font-bold mt-0.5">{selected.county}</h2>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Composite", selected.composite_risk],
                    ["Human", selected.human_score],
                    ["Animal", selected.animal_score],
                    ["Vector", selected.vector_score],
                    ["Env", selected.env_score],
                    ["Reports", selected.checkin_count],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-xl bg-muted px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k}</div>
                      <div className="text-xl font-bold tabular-nums">{v as number}</div>
                    </div>
                  ))}
                </div>

                {Array.isArray(selected.clusters) && selected.clusters.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      {locale === "es" ? "Clústeres detectados" : "Detected clusters"}
                    </div>
                    <div className="space-y-1.5">
                      {(selected.clusters as any[]).map((c, i) => (
                        <div key={i} className="rounded-lg border border-border px-3 py-2">
                          <div className="text-sm font-semibold">{c.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.size} {locale === "es" ? "reportes" : "reports"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-gradient-to-br from-primary/5 to-spark/5 p-4 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <div className="text-xs uppercase tracking-widest text-primary font-bold">{t("home.aiInsight")}</div>
                  </div>
                  {aiLoading ? (
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-muted rounded animate-pulse w-full" />
                      <div className="h-2.5 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed">{aiInsight?.insight}</p>
                      {aiInsight?.recs && aiInsight.recs.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs">
                          {aiInsight.recs.slice(0, 3).map((r, i) => (
                            <li key={i} className="flex gap-2"><span className="text-primary">→</span>{r}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground text-sm">
                <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" />
                {locale === "es" ? "Toca un condado en el mapa." : "Click a county on the map."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className="card-elevated p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          {t(LAYER_META.find((l) => l.key === layer)!.labelKey)} · 0 → 100
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="h-2 flex-1 rounded-full bg-gradient-risk" />
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[["Low", "risk-low"], ["Mod", "risk-moderate"], ["Elev", "risk-elevated"], ["High", "risk-high"]].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full bg-${c}`} />{l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

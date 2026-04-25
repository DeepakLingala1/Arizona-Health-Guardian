// Spark AZ — Insights: weekly digest, clusters, EpiCore, travel imports
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Globe2, Plane, Users, AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface Cluster { county: string; label: string; size: number }
interface EpicoreItem {
  id: string; region: string; hazard: string; summary: string;
  severity: number; pathway: string; observed_at: string;
}
interface ApprovedAlert {
  id: string; county: string; severity: string; title: string; body: string; created_at: string;
}

const PATH_ICON: Record<string, string> = {
  travel: "✈️", vector: "🦟", animal: "🐦", environment: "🌫️",
};

export default function Insights() {
  const { t, locale } = useLocale();
  const [digest, setDigest] = useState<{ headline: string; key_findings: string[]; cluster_callouts: string[] } | null>(null);
  const [digestLoading, setDigestLoading] = useState(true);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [topCounties, setTopCounties] = useState<{ county: string; composite: number }[]>([]);
  const [epicore, setEpicore] = useState<EpicoreItem[]>([]);
  const [alerts, setAlerts] = useState<ApprovedAlert[]>([]);
  const [travel, setTravel] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: rows } = await supabase.from("county_daily")
        .select("*").gte("date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

      const latestPerCounty: Record<string, any> = {};
      (rows ?? []).forEach((r: any) => {
        if (!latestPerCounty[r.county] || latestPerCounty[r.county].date < r.date) latestPerCounty[r.county] = r;
      });
      const list = Object.values(latestPerCounty);
      const top = list
        .map((r: any) => ({ county: r.county, composite: r.composite_risk }))
        .sort((a: any, b: any) => b.composite - a.composite)
        .slice(0, 5);
      setTopCounties(top);

      const allClusters: Cluster[] = [];
      list.forEach((r: any) => {
        (r.clusters ?? []).forEach((c: any) => {
          if (c.size >= 2) allClusters.push({ county: r.county, label: c.label, size: c.size });
        });
      });
      allClusters.sort((a, b) => b.size - a.size);
      setClusters(allClusters.slice(0, 8));

      const { data: epi } = await supabase.from("epicore_feed")
        .select("*").order("observed_at", { ascending: false }).limit(8);
      setEpicore((epi as any) ?? []);

      const { data: ax } = await supabase.from("alerts")
        .select("*").eq("status", "approved")
        .order("created_at", { ascending: false }).limit(5);
      setAlerts((ax as any) ?? []);

      // AI digest
      setDigestLoading(true);
      try {
        const { data } = await supabase.functions.invoke("generate-insight", {
          body: {
            scope: "digest", scope_id: today, language: locale,
            payload: { top_counties: top, clusters: allClusters.slice(0, 5), epicore: (epi ?? []).slice(0, 5) },
          },
        });
        setDigest({
          headline: data?.insight?.split("\n")[0] ?? data?.raw?.headline ?? "",
          key_findings: data?.recommendations ?? data?.raw?.key_findings ?? [],
          cluster_callouts: data?.drivers ?? data?.raw?.cluster_callouts ?? [],
        });
      } catch (e) { console.error(e); }
      finally { setDigestLoading(false); }

      // Travel imports
      try {
        const { data: tv } = await supabase.functions.invoke("fetch-travel-imports", { body: {} });
        setTravel(tv);
      } catch (e) { console.error(e); }
    })();
  }, [locale]);

  return (
    <div className="container max-w-[1200px] py-8 space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("app.subtitle")}</div>
        <h1 className="text-3xl font-bold mt-1">{t("insights.title")}</h1>
      </div>

      {/* Weekly digest */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-6 sm:p-8 bg-gradient-hero relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-spark/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-spark" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("insights.digest")}</div>
            <div className="text-xs text-muted-foreground">Gemini 2.5 Flash · {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {digestLoading ? (
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-full mt-3" />
            <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">{digest?.headline}</h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-5">
              {digest?.key_findings.slice(0, 3).map((f, i) => (
                <div key={i} className="rounded-xl bg-card/60 p-4 border border-border/60">
                  <div className="text-xs uppercase tracking-wider text-primary font-bold">#{i + 1}</div>
                  <div className="text-sm mt-1.5">{f}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Top counties */}
      {topCounties.length > 0 && (
        <div className="card-elevated p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            {locale === "es" ? "Condados de mayor riesgo" : "Top counties by composite risk"}
          </div>
          <div className="space-y-2">
            {topCounties.map((c, i) => (
              <div key={c.county} className="flex items-center gap-3">
                <div className="w-6 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</div>
                <div className="font-medium w-24 shrink-0">{c.county}</div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.composite}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05 }}
                    className="h-full bg-gradient-risk"
                  />
                </div>
                <div className="w-10 text-right tabular-nums font-semibold">{c.composite}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clusters */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-primary" />
          {t("insights.clusters")}
        </h2>
        {clusters.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-muted-foreground text-center">
            {locale === "es" ? "Aún no hay clústeres detectados. La aplicación se está poblando." : "No clusters detected yet. The system is warming up."}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clusters.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card-elevated p-4 border-l-4 border-l-spark"
              >
                <div className="text-xs uppercase tracking-wider text-spark font-bold">{c.county} County</div>
                <div className="font-semibold mt-1">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {c.size} {locale === "es" ? "reportes en clúster" : "clustered reports"}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Approved alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-risk-elevated" />
            {locale === "es" ? "Alertas publicadas" : "Public alerts"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {alerts.map((a) => (
              <div key={a.id} className="card-elevated p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-risk-elevated/10 text-risk-elevated font-bold">
                    {a.severity}
                  </span>
                  <span className="text-xs text-muted-foreground">{a.county}</span>
                </div>
                <div className="font-semibold mt-1.5 text-sm">{a.title}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EpiCore */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Globe2 className="w-4.5 h-4.5 text-primary" />
          {t("insights.epicore")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {epicore.map((e) => (
            <div key={e.id} className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{PATH_ICON[e.pathway] ?? "•"}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{e.region}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-spark/10 text-spark font-bold">
                  sev {e.severity}
                </span>
              </div>
              <div className="font-semibold text-sm">{e.hazard}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.summary}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-3">
          {locale === "es"
            ? "Demo: muestras representativas de señales tipo EpiCore. Integración real disponible bajo solicitud."
            : "Demo data representative of EpiCore-style signals. Live integration available on request."}
        </div>
      </div>

      {/* Travel watch */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Plane className="w-4.5 h-4.5 text-primary" />
          {t("insights.travel")}
        </h2>
        <div className="card-elevated p-5">
          {travel?.watch?.filter((w: any) => w.matched_arrivals?.length > 0).length > 0 ? (
            <div className="space-y-3">
              {travel.watch
                .filter((w: any) => w.matched_arrivals?.length > 0)
                .map((w: any) => (
                  <div key={w.id} className="rounded-xl bg-spark/5 border border-spark/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-spark/15 text-spark font-bold">
                        match
                      </span>
                      <span className="font-semibold text-sm">{w.hazard}</span>
                      <span className="text-xs text-muted-foreground">· {w.region}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{w.summary}</p>
                    <div className="text-xs mt-2">
                      {w.matched_arrivals.length} {locale === "es" ? "llegada(s) coincidente(s) en últimas 24h" : "matching arrival(s) in last 24h"}: {w.matched_arrivals.map((a: any) => a.origin_label).join(", ")}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {locale === "es"
                ? "Sin coincidencias entre señales globales y llegadas recientes a Arizona."
                : "No matches between global signals and recent Arizona arrivals."}
            </div>
          )}
          {travel?.arrivals?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {locale === "es" ? "Llegadas recientes (PHX/TUS)" : "Recent arrivals (PHX/TUS)"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {travel.arrivals.slice(0, 8).map((a: any, i: number) => (
                  <div key={i} className="text-[11px] px-2 py-1 rounded-md bg-muted">
                    ✈ {a.origin_label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Spark AZ Dashboard — risk ring, AI insight, XAI, sub-scores, alert banner, scenarios
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { computeRisk, bandColor, RiskResult } from "@/lib/riskScore";
import { getPersona, PERSONAS, PersonaId } from "@/lib/personas";
import { getScenario } from "@/lib/scenarios";
import { XAIPanel } from "@/components/XAIPanel";
import { SubScoreGrid } from "@/components/SubScoreGrid";
import { AlertBanner } from "@/components/AlertBanner";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { Activity, ClipboardCheck, Sparkles, MapPin, Beaker, ArrowRight, Flame, Globe2 } from "lucide-react";
import { COUNTY_NAMES } from "@/lib/azCounties";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t, locale } = useLocale();
  const [params] = useSearchParams();
  const scenarioId = params.get("scenario");
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);

  const [persona, setPersona] = useState<PersonaId>("urban");
  const [county, setCounty] = useState<string>("Pima");
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [insight, setInsight] = useState<string>("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ title: string; body: string; severity: string } | null>(null);
  const [countyComposite, setCountyComposite] = useState<number>(0);
  const [topSymptoms, setTopSymptoms] = useState<{ key: string; count: number }[]>([]);

  // Hydrate from profile / scenario
  useEffect(() => {
    if (scenario) {
      setPersona(scenario.persona);
      setCounty(scenario.county);
    } else if (profile) {
      setPersona(((profile as any).persona ?? "urban") as PersonaId);
      setCounty(profile.home_county ?? "Pima");
    }
  }, [profile, scenarioId]); // eslint-disable-line

  // Compute risk + load county data
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: cd } = await supabase.from("county_daily")
        .select("*").eq("county", county)
        .order("date", { ascending: false }).limit(1).maybeSingle();
      if (cancel) return;

      const composite = cd?.composite_risk ?? 0;
      setCountyComposite(composite);
      setTopSymptoms((cd?.top_human_symptoms as any) ?? []);

      // Latest user check-in (only if no scenario active)
      let latest: any = null;
      if (!scenario && user) {
        const { data } = await supabase.from("checkins")
          .select("*").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        latest = data;
      }

      const r = computeRisk({
        symptoms: scenario?.symptoms ?? latest?.symptoms ?? [],
        mood: latest?.mood ?? 7,
        knownExposure: scenario?.knownExposure ?? latest?.known_exposure ?? false,
        recentTravel: scenario?.recentTravel ?? latest?.recent_travel ?? false,
        conditions: profile?.conditions ?? [],
        persona,
        county,
        weather: { temperatureF: scenario?.weatherTempF ?? (cd?.weather as any)?.temperature_2m },
        airQuality: scenario?.airQuality ?? {
          aqi: (cd?.air_quality as any)?.us_aqi,
          pm25: (cd?.air_quality as any)?.pm2_5,
          dust: (cd?.air_quality as any)?.dust,
        },
        envSignals: scenario?.envSignals ?? latest?.env_signals ?? [],
        animalSigns: scenario?.animalSigns ?? latest?.animal_signs ?? [],
        countyComposite: composite,
        travelImport: scenario?.id === "border-import",
      });
      setRisk(r);

      // Load active approved alert for county
      const { data: alert } = await supabase.from("alerts")
        .select("title,body,severity,status")
        .eq("county", county).eq("status", "approved")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      setActiveAlert(alert ?? null);

      // AI insight (cached)
      setInsightLoading(true);
      try {
        const { data: aiResp } = await supabase.functions.invoke("generate-insight", {
          body: {
            scope: "user",
            scope_id: `${county}-${persona}-${scenarioId ?? "default"}`,
            language: locale,
            payload: {
              county, persona,
              composite: r.composite, band: r.band, subscores: r.subscores,
              drivers: r.drivers,
              weather: cd?.weather, air_quality: cd?.air_quality,
              top_symptoms: cd?.top_human_symptoms,
            },
          },
        });
        if (!cancel) {
          setInsight(aiResp?.insight ?? "");
          setRecommendations(aiResp?.recommendations ?? aiResp?.raw?.recommendations ?? []);
        }
      } catch (e) {
        console.error("ai insight", e);
      } finally {
        if (!cancel) setInsightLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [persona, county, scenarioId, user, locale]); // eslint-disable-line

  const personaObj = getPersona(persona);
  const PersonaIcon = personaObj.icon;
  const composite = risk?.composite ?? 0;
  const band = risk?.band ?? "Low";
  const bandLabel = t(`band.${band}`);
  const ringColor = bandColor(band);

  return (
    <div className="container max-w-[1200px] py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            <Activity className="w-3.5 h-3.5" />
            {t("app.subtitle")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1.5 leading-tight">{t("home.todayRisk")}</h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="bg-transparent font-medium hover:text-foreground cursor-pointer focus:outline-none"
            >
              {COUNTY_NAMES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <span>· </span>
            <PersonaIcon className="w-3.5 h-3.5" />
            <span>{personaObj.label[locale]}</span>
          </div>
        </div>
        <PersonaSwitcher value={persona} onChange={setPersona} />
      </div>

      {/* Scenario badge */}
      {scenario && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-spark/30 bg-spark/5 px-4 py-3"
        >
          <div className="w-8 h-8 rounded-lg bg-spark/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-spark" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest font-bold text-spark">{scenario.badge[locale]}</div>
            <div className="text-sm text-foreground/80 mt-0.5">{scenario.hint[locale]}</div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">✕</Link>
        </motion.div>
      )}

      {activeAlert && (
        <AlertBanner title={activeAlert.title} body={activeAlert.body} severity={activeAlert.severity} />
      )}

      {/* Risk hero */}
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 card-elevated p-8 flex flex-col items-center text-center bg-gradient-hero relative overflow-hidden"
        >
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            {t("common.today")}
          </div>
          <div className="relative">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <motion.circle
                initial={{ pathLength: 0 }}
                animate={{ pathLength: composite / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                cx="50" cy="50" r="42" fill="none"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                pathLength={1}
                style={{ filter: `drop-shadow(0 0 10px ${ringColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold tabular-nums">{composite}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">/ 100</div>
            </div>
          </div>
          <div
            className="mt-4 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${ringColor.replace(")", " / 0.15)")}`, color: ringColor }}
          >
            {bandLabel}
          </div>
          <Link
            to="/checkin"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-glow transition-all"
          >
            <ClipboardCheck className="w-4 h-4" />
            {t("home.checkinCta")}
          </Link>
        </motion.div>

        {/* AI Insight */}
        <div className="lg:col-span-3 card-elevated p-6 sm:p-7 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {t("home.aiInsight")}
              </div>
              <div className="text-xs text-muted-foreground">Gemini 2.5 Flash · Spark AZ v0.1</div>
            </div>
          </div>

          {insightLoading && !insight ? (
            <div className="space-y-2 mt-2">
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-full" />
              <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ) : (
            <p className="text-base leading-relaxed text-foreground/90 mt-1">
              {insight ||
                (locale === "es"
                  ? "Spark AZ está calculando tu perfil de riesgo. Envía un reporte para personalizarlo."
                  : "Spark AZ is computing your risk profile. Submit a check-in to personalize it.")}
            </p>
          )}

          {recommendations.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border space-y-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                {locale === "es" ? "Acciones recomendadas" : "Recommended actions"}
              </div>
              {recommendations.slice(0, 3).map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>{r}</div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 text-xs text-muted-foreground flex items-center gap-1">
            <Globe2 className="w-3 h-3" />
            {locale === "es" ? "Ver fuentes y método en" : "Sources & method on"}
            <Link to="/model-card" className="text-primary hover:underline ml-1">
              {t("nav.modelCard")}
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      {risk && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("home.signals")}</h2>
            <Link to="/map" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t("nav.map")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <SubScoreGrid subs={risk.subscores} />
        </>
      )}

      {/* XAI + community */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {risk && <XAIPanel drivers={risk.drivers} />}
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              {t("home.youVsCounty")}
            </div>
            <div className="flex items-end gap-4">
              <div>
                <div className="text-3xl font-bold tabular-nums">{composite}</div>
                <div className="text-xs text-muted-foreground">{locale === "es" ? "Tú" : "You"}</div>
              </div>
              <div className="flex-1 h-14 relative bg-muted rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-risk opacity-30"
                  style={{ width: `${countyComposite}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                  style={{ left: `${composite}%` }}
                />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums">{countyComposite}</div>
                <div className="text-xs text-muted-foreground">{county}</div>
              </div>
            </div>
          </div>

          {topSymptoms.length > 0 && (
            <div className="card-elevated p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                {locale === "es" ? "Síntomas comunes en tu condado" : "Top symptoms in your county"}
              </div>
              <div className="flex flex-wrap gap-2">
                {topSymptoms.slice(0, 6).map((s) => (
                  <div key={s.key} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium">
                    {s.key.replace(/_/g, " ")}
                    <span className="text-muted-foreground ml-1.5 tabular-nums">×{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile && profile.streak > 0 && (
            <div className="card-elevated p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-spark/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-spark" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{profile.streak}</div>
                <div className="text-xs text-muted-foreground">{t("checkin.streak")}</div>
              </div>
            </div>
          )}

          <div className="card-elevated p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              {locale === "es" ? "Demos rápidos" : "Quick demos"}
            </div>
            <div className="space-y-1.5">
              {[
                { id: "valley-fever", label: locale === "es" ? "Fiebre del Valle (Pinal)" : "Valley Fever (Pinal)" },
                { id: "border-import", label: locale === "es" ? "Importación fronteriza (Yuma)" : "Border-import (Yuma)" },
                { id: "monsoon", label: locale === "es" ? "Monzón · Virus del Nilo (Maricopa)" : "Monsoon · West Nile (Maricopa)" },
                { id: "ranch-zoonotic", label: locale === "es" ? "Zoonótico ganadero (Cochise)" : "Ranch zoonotic (Cochise)" },
              ].map((s) => (
                <Link
                  key={s.id}
                  to={`/?scenario=${s.id}`}
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
                >
                  → {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 pt-2">
        <Link to="/map" className="card-elevated p-4 hover:shadow-glow transition-shadow group">
          <MapPin className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.map")}</div>
          <div className="text-xs text-muted-foreground">{locale === "es" ? "Mapa de los 15 condados" : "Heatmap of all 15 counties"}</div>
        </Link>
        <Link to="/insights" className="card-elevated p-4 hover:shadow-glow transition-shadow">
          <Sparkles className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.insights")}</div>
          <div className="text-xs text-muted-foreground">{locale === "es" ? "Clústeres y señales globales" : "Clusters & global signals"}</div>
        </Link>
        <Link to="/simulator" className="card-elevated p-4 hover:shadow-glow transition-shadow">
          <Beaker className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.simulator")}</div>
          <div className="text-xs text-muted-foreground">{locale === "es" ? "Simulador de viaje" : "Travel & activity simulator"}</div>
        </Link>
      </div>
    </div>
  );
}

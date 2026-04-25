// Spark AZ — Travel & activity simulator with AI delta explanation
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Beaker, ArrowRight, MapPin } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { computeRisk, bandColor } from "@/lib/riskScore";
import { Slider } from "@/components/ui/slider";

const ACTIVITIES = [
  { id: "indoor", label: { en: "Indoor / events", es: "Interior / eventos" } },
  { id: "outdoor", label: { en: "Outdoor / hiking", es: "Aire libre / senderismo" } },
  { id: "ranch", label: { en: "Ranch / livestock", es: "Rancho / ganado" } },
  { id: "border", label: { en: "Border crossing", es: "Cruce fronterizo" } },
  { id: "school", label: { en: "School / campus", es: "Escuela / campus" } },
];

export default function Simulator() {
  const { profile } = useAuth();
  const { t, locale } = useLocale();
  const [origin, setOrigin] = useState<string>(profile?.home_county ?? "Maricopa");
  const [destination, setDestination] = useState<string>("Yuma");
  const [days, setDays] = useState<number>(3);
  const [activity, setActivity] = useState<string>("indoor");
  const [explain, setExplain] = useState<{ insight: string; factors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const baseline = useMemo(() => computeRisk({
    symptoms: [], mood: 7, knownExposure: false, recentTravel: false,
    persona: ((profile as any)?.persona ?? "urban"), county: origin,
    countyComposite: 30,
  }), [origin, profile]);

  const projected = useMemo(() => {
    const animalSigns = activity === "ranch" ? ["sick_livestock"] : [];
    const envSignals = activity === "outdoor" ? ["dust_storm"] : [];
    return computeRisk({
      symptoms: [], mood: 7, knownExposure: false,
      recentTravel: true,
      persona: ((profile as any)?.persona ?? "urban"),
      county: destination,
      countyComposite: 35 + Math.min(days * 3, 20),
      animalSigns, envSignals,
      travelImport: activity === "border",
      weather: { temperatureF: destination === "Maricopa" || destination === "Yuma" ? 100 : 85 },
    });
  }, [destination, days, activity, profile]);

  const delta = projected.composite - baseline.composite;

  async function runAI() {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("generate-insight", {
        body: {
          scope: "simulator", scope_id: `${origin}-${destination}-${days}-${activity}`,
          language: locale,
          payload: {
            origin, destination, days, activity,
            baseline: baseline.composite, projected: projected.composite,
          },
        },
      });
      setExplain({ insight: data?.insight ?? "", factors: data?.recommendations ?? data?.raw?.top_factors ?? [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
          <Beaker className="w-3.5 h-3.5" /> What-if
        </div>
        <h1 className="text-3xl font-bold mt-1">{t("sim.title")}</h1>
        <p className="text-muted-foreground mt-1.5">
          {locale === "es"
            ? "Compara tu riesgo basal con un viaje proyectado dentro de Arizona."
            : "Compare your baseline risk against a projected trip within Arizona."}
        </p>
      </div>

      <div className="card-elevated p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("sim.origin")}</label>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)}
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm font-medium">
              {COUNTY_NAMES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("sim.dest")}</label>
            <select value={destination} onChange={(e) => setDestination(e.target.value)}
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm font-medium">
              {COUNTY_NAMES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("sim.duration")}</label>
          <div className="mt-2 flex items-center gap-3">
            <Slider value={[days]} onValueChange={([v]) => setDays(v)} min={1} max={14} step={1} className="flex-1" />
            <div className="w-16 text-right tabular-nums font-semibold">{days}d</div>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("sim.activity")}</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => (
              <button
                key={a.id}
                onClick={() => setActivity(a.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  activity === a.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-muted-foreground/40"
                }`}
              >
                {a.label[locale]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runAI}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-spark text-spark-foreground font-semibold hover:bg-spark/90 disabled:opacity-50 shadow-spark"
        >
          <Beaker className="w-4 h-4" />
          {loading ? (locale === "es" ? "Analizando…" : "Analyzing…") : t("sim.run")}
        </button>
      </div>

      {/* Result */}
      <div className="card-elevated p-6">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{origin}</div>
            <div className="text-4xl font-bold tabular-nums mt-1">{baseline.composite}</div>
            <div className="text-xs mt-1" style={{ color: bandColor(baseline.band) }}>{t(`band.${baseline.band}`)}</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <motion.div
              key={delta}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-3 py-1 rounded-full text-sm font-bold tabular-nums ${
                delta > 0 ? "bg-risk-high/10 text-risk-high" : delta < 0 ? "bg-risk-low/10 text-risk-low" : "bg-muted text-muted-foreground"
              }`}
            >
              {delta > 0 ? "+" : ""}{delta}
            </motion.div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("sim.delta")}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{destination}</div>
            <div className="text-4xl font-bold tabular-nums mt-1">{projected.composite}</div>
            <div className="text-xs mt-1" style={{ color: bandColor(projected.band) }}>{t(`band.${projected.band}`)}</div>
          </div>
        </div>

        {explain && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
              {locale === "es" ? "Análisis IA" : "AI analysis"}
            </div>
            <p className="text-sm leading-relaxed">{explain.insight}</p>
            {explain.factors.length > 0 && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {locale === "es" ? "Factores principales" : "Top factors"}
                </div>
                <ul className="space-y-1.5">
                  {explain.factors.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary">→</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

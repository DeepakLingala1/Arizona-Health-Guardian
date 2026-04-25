import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { computeRisk } from "@/lib/riskScore";
import { getPersona, PERSONAS } from "@/lib/personas";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t, locale } = useLocale();
  const [composite, setComposite] = useState(0);
  const [insight, setInsight] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: county } = await supabase.from("county_daily")
        .select("*").eq("county", profile.home_county)
        .order("date", { ascending: false }).limit(1).maybeSingle();

      const { data: my } = await supabase.from("checkins")
        .select("*").eq("user_id", user?.id ?? "").order("created_at", { ascending: false }).limit(1).maybeSingle();

      const r = computeRisk({
        symptoms: my?.symptoms ?? [],
        mood: my?.mood ?? 7,
        knownExposure: my?.known_exposure ?? false,
        recentTravel: my?.recent_travel ?? false,
        conditions: profile.conditions ?? [],
        persona: (profile as any).persona,
        county: profile.home_county,
        weather: { temperatureF: (county?.weather as any)?.temperature_2m },
        airQuality: {
          aqi: (county?.air_quality as any)?.us_aqi,
          pm25: (county?.air_quality as any)?.pm2_5,
          dust: (county?.air_quality as any)?.dust,
        },
        countyComposite: county?.composite_risk ?? 0,
      });
      setComposite(r.composite);

      // Cached AI insight
      const { data: ai } = await supabase.from("ai_insights")
        .select("*").eq("scope", "county").eq("scope_id", profile.home_county).eq("language", locale)
        .order("generated_at", { ascending: false }).limit(1).maybeSingle();
      if (ai?.insight) setInsight(ai.insight);
    })();
  }, [profile, user, locale]);

  const persona = getPersona((profile as any)?.persona);

  return (
    <div className="container max-w-[1200px] py-8 space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("app.subtitle")}</div>
        <h1 className="text-3xl font-bold mt-1">{t("home.todayRisk")}</h1>
        <div className="text-muted-foreground mt-1">{profile?.home_county} County · {persona.label[locale]}</div>
      </div>

      <div className="card-elevated p-8 flex items-center gap-6">
        <div className="relative w-32 h-32 rounded-full bg-gradient-risk flex items-center justify-center shadow-glow">
          <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
            <div className="text-4xl font-bold tabular-nums">{composite}</div>
          </div>
        </div>
        <div>
          <div className="text-sm uppercase tracking-wider text-muted-foreground">Composite</div>
          <div className="text-2xl font-semibold mt-1">{t(`band.${composite < 25 ? "Low" : composite < 50 ? "Moderate" : composite < 75 ? "Elevated" : "High"}`)}</div>
          <div className="text-sm text-muted-foreground mt-2 max-w-xl">
            {insight || "Spark AZ is computing your One Health risk. Submit a check-in to personalize your score."}
          </div>
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="font-semibold mb-2">🚧 {t("app.name")} rebuild in progress</div>
        <p className="text-sm text-muted-foreground">
          The new One Health schema, design system, bilingual layer, persona engine, risk model v2, and 6 edge functions are all in place.
          The full UI rebuild (One Health 3-tab check-in, map layers, HITL queue, Model Card, scenarios, etc.) is the next batch.
          Ask me to <strong>continue the build</strong> and I'll wire up the rest.
        </p>
      </div>
    </div>
  );
}

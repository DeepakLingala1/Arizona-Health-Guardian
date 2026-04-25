// Spark AZ — Profile / preferences
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { PERSONAS, PersonaId, getPersona } from "@/lib/personas";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ClipboardCheck, FileText, Database, Users, RefreshCw } from "lucide-react";

const CONDITIONS = [
  { id: "asthma", en: "Asthma", es: "Asma" },
  { id: "diabetes", en: "Diabetes", es: "Diabetes" },
  { id: "heart", en: "Heart condition", es: "Condición cardíaca" },
  { id: "pregnancy", en: "Pregnancy", es: "Embarazo" },
  { id: "immunocompromised", en: "Immunocompromised", es: "Inmunocomprometido" },
];

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const navigate = useNavigate();

  const [persona, setPersona] = useState<PersonaId>(((profile as any)?.persona ?? "urban"));
  const [county, setCounty] = useState<string>(profile?.home_county ?? "Pima");
  const [conditions, setConditions] = useState<string[]>(profile?.conditions ?? []);
  const [busy, setBusy] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  async function resetDemo() {
    if (!confirm(locale === "es"
      ? "¿Borrar datos de demo y volver a sembrar? Esto puede tardar 10–20 segundos."
      : "Wipe demo data and reseed? This may take 10–20 seconds.")) return;
    setReseeding(true);
    try {
      // Wipe checkins, county_daily, alerts, review_log, ai_insights cache
      await supabase.from("review_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("ai_insights").delete().neq("scope_id", "");
      await supabase.from("county_daily").delete().neq("county", "");
      await supabase.from("checkins").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      toast.message(locale === "es" ? "Sembrando datos…" : "Reseeding demo data…");
      await supabase.functions.invoke("seed-demo");
      toast.message(locale === "es" ? "Calculando agregados…" : "Computing aggregates…");
      await supabase.functions.invoke("compute-county-aggregate", { body: {} });
      await supabase.functions.invoke("evaluate-alerts", { body: {} });
      toast.success(locale === "es" ? "Demo restablecida" : "Demo reset complete");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Reset failed");
    } finally {
      setReseeding(false);
    }
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      persona, home_county: county, conditions, language: locale, onboarded: true,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error("Save failed"); return; }
    toast.success(locale === "es" ? "Guardado" : "Saved");
    refreshProfile();
  }

  function toggle(id: string) {
    setConditions((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  }

  const personaObj = getPersona(persona);

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <h1 className="text-3xl font-bold">{t("nav.profile")}</h1>

      {/* Persona */}
      <div className="card-elevated p-5 space-y-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("onb.persona")}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PERSONAS.map((p) => {
            const PIcon = p.icon;
            const active = p.id === persona;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <PIcon className="w-4 h-4 text-primary mb-1" />
                <div className="text-xs font-semibold leading-tight">{p.label[locale]}</div>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground italic">{personaObj.description[locale]}</div>
      </div>

      {/* County */}
      <div className="card-elevated p-5 space-y-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("onb.county")}</div>
        <select value={county} onChange={(e) => setCounty(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none font-medium">
          {COUNTY_NAMES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Conditions */}
      <div className="card-elevated p-5 space-y-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("onb.conditions")}</div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => {
            const active = conditions.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium border ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-muted-foreground/40"
                }`}
              >
                {c[locale]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <div className="card-elevated p-5 space-y-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{t("nav.language")}</div>
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => setLocale("en")} className={`px-4 py-2 text-sm ${locale === "en" ? "bg-primary text-primary-foreground" : ""}`}>English</button>
          <button onClick={() => setLocale("es")} className={`px-4 py-2 text-sm ${locale === "es" ? "bg-primary text-primary-foreground" : ""}`}>Español</button>
        </div>
      </div>

      <button
        onClick={save} disabled={busy}
        className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "…" : t("common.save")}
      </button>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-3 pt-4">
        <button onClick={() => navigate("/checkin")} className="card-elevated p-4 text-left hover:shadow-glow">
          <ClipboardCheck className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.checkin")}</div>
        </button>
        <button onClick={() => navigate("/review")} className="card-elevated p-4 text-left hover:shadow-glow">
          <ShieldCheck className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.review")}</div>
          <div className="text-xs text-muted-foreground">Analyst HITL</div>
        </button>
        <button onClick={() => navigate("/model-card")} className="card-elevated p-4 text-left hover:shadow-glow">
          <FileText className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.modelCard")}</div>
        </button>
        <button onClick={() => navigate("/data-sources")} className="card-elevated p-4 text-left hover:shadow-glow">
          <Database className="w-5 h-5 text-primary mb-2" />
          <div className="font-semibold">{t("nav.dataSources")}</div>
        </button>
      </div>

      <div className="pt-4 text-xs text-muted-foreground text-center">
        {locale === "es" ? "ID anónimo:" : "Anonymous ID:"} <code className="font-mono">{user?.id?.slice(0, 8)}…</code>
      </div>
    </div>
  );
}

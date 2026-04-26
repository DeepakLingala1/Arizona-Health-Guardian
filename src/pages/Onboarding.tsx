// Spark AZ — first-run 4-step wizard with branded finale. Gates on profile.onboarded.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Activity, ShieldCheck, MapPin, ChevronRight, ChevronLeft, Check,
  Sparkles, Lock, EyeOff, Users, Languages, ClipboardCheck, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { PERSONAS, PersonaId, getPersona } from "@/lib/personas";

const AGE_BANDS = ["<18", "18-34", "35-54", "55-74", "75+"] as const;
const CONDITIONS = [
  { id: "asthma", en: "Asthma", es: "Asma" },
  { id: "diabetes", en: "Diabetes", es: "Diabetes" },
  { id: "heart", en: "Heart condition", es: "Condición cardíaca" },
  { id: "pregnancy", en: "Pregnancy", es: "Embarazo" },
  { id: "immunocompromised", en: "Immunocompromised", es: "Inmunocomprometido" },
];

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<PersonaId>("urban");
  const [county, setCounty] = useState<string>("Pima");
  const [ageBand, setAgeBand] = useState<string>("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // If already onboarded, bounce home
  useEffect(() => {
    if (profile?.onboarded && step !== 4) navigate("/", { replace: true });
  }, [profile?.onboarded, navigate, step]);

  // Hydrate from existing partial profile if present
  useEffect(() => {
    if (profile && !profile.onboarded) {
      setPersona((profile.persona ?? "urban") as PersonaId);
      setCounty(profile.home_county ?? "Pima");
      setAgeBand(profile.age_band ?? "");
      setConditions(profile.conditions ?? []);
    }
  }, [profile?.id]); // eslint-disable-line

  function toggleCondition(id: string) {
    setConditions((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    const update = {
      persona, home_county: county, conditions, language: locale,
      onboarded: true,
      ...(ageBand ? { age_band: ageBand } : {}),
    };
    const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(locale === "es" ? "No se pudo guardar" : "Couldn't save");
      return;
    }
    await refreshProfile();
    // Brand confetti on success
    confetti({
      particleCount: 80, spread: 80, origin: { y: 0.6 },
      colors: ["#0E7C7B", "#F97316", "#5A8F69"],
    });
    setStep(4); // finale screen
  }

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const personaObj = getPersona(persona);
  const PersonaIcon = personaObj.icon;
  const totalSteps = 3;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient backdrop — subtle radial gradient that lifts brand */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-hero" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full -z-10 opacity-40"
        style={{ background: "radial-gradient(closest-side, hsl(var(--spark) / 0.18), transparent)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full -z-10 opacity-40"
        style={{ background: "radial-gradient(closest-side, hsl(var(--primary) / 0.18), transparent)" }}
        aria-hidden="true"
      />

      <div className="w-full max-w-xl">
        {/* Header strip */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow relative">
              <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-spark animate-spark-pulse" aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight">{t("app.name")}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("app.subtitle")}
              </div>
            </div>
          </div>
          {step <= 3 && (
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold tabular-nums">
              {t("onb.step")} {step} {t("onb.of")} {totalSteps}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {step <= 3 && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6" aria-hidden="true">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={false}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section
              key="step1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="card-elevated p-6 sm:p-8 space-y-5"
              aria-labelledby="onb-welcome"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-spark font-bold">
                <Sparkles className="w-3.5 h-3.5" /> {t("app.tagline")}
              </div>
              <h1 id="onb-welcome" className="text-3xl sm:text-4xl font-bold leading-tight">
                {t("onb.welcomeTitle")}
              </h1>
              <p className="text-foreground/85 leading-relaxed">{t("onb.welcomeBody2")}</p>

              <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {locale === "es" ? "Tu privacidad" : "Your privacy"}
                </div>
                {[
                  { Icon: EyeOff, txt: t("onb.privacy.t1") },
                  { Icon: Lock, txt: t("onb.privacy.t2") },
                  { Icon: Users, txt: t("onb.privacy.t3") },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <row.Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{row.txt}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" /> {t("onb.lang")}
                </div>
                <div className="inline-flex rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    aria-pressed={locale === "en"}
                    className={`px-4 py-2 text-sm font-medium ${
                      locale === "en" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("es")}
                    aria-pressed={locale === "es"}
                    className={`px-4 py-2 text-sm font-medium ${
                      locale === "es" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    Español
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="card-elevated p-6 sm:p-8 space-y-5"
              aria-labelledby="onb-persona"
            >
              <h2 id="onb-persona" className="text-2xl sm:text-3xl font-bold leading-tight">
                {t("onb.personaPick")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("onb.personaHelp")}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label={t("onb.personaPick")}>
                {PERSONAS.filter((p) => p.id !== "analyst").map((p) => {
                  const Icon = p.icon;
                  const active = p.id === persona;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPersona(p.id)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/5 shadow-card"
                          : "border-border hover:border-muted-foreground/40 hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        {active && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
                      </div>
                      <div className="text-sm font-semibold mt-2 leading-tight">{p.label[locale]}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {p.description[locale]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section
              key="step3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="card-elevated p-6 sm:p-8 space-y-5"
              aria-labelledby="onb-loc"
            >
              <h2 id="onb-loc" className="text-2xl sm:text-3xl font-bold leading-tight">
                {t("onb.locationTitle")}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {t("onb.locationHelp")}
              </p>

              <div>
                <label htmlFor="onb-county" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {t("onb.county")}
                </label>
                <select
                  id="onb-county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none font-medium"
                >
                  {COUNTY_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {t("onb.ageOptional")}
                </div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("onb.ageOptional")}>
                  {AGE_BANDS.map((a) => {
                    const active = ageBand === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setAgeBand(active ? "" : a)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  {t("onb.conditions")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const active = conditions.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleCondition(c.id)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" aria-hidden="true" />}
                        {c[locale]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section
              key="step4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="card-elevated p-8 sm:p-10 text-center space-y-5 relative overflow-hidden"
              aria-labelledby="onb-done"
            >
              <div className="absolute inset-0 bg-gradient-hero opacity-60" aria-hidden="true" />
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow"
              >
                <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
              </motion.div>

              <div className="relative">
                <h2 id="onb-done" className="text-3xl sm:text-4xl font-bold leading-tight">
                  {t("onb.allSet")}
                </h2>
                <p className="text-foreground/85 mt-3 max-w-md mx-auto">{t("onb.allSetBody")}</p>
              </div>

              {/* Quick recap pills */}
              <div className="relative flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium">
                  <PersonaIcon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  {personaObj.label[locale]}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  {county}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium">
                  <Languages className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  {locale === "en" ? "English" : "Español"}
                </span>
              </div>

              <div className="relative flex flex-col sm:flex-row gap-2.5 justify-center pt-3">
                <button
                  type="button"
                  onClick={() => navigate("/checkin")}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-glow"
                >
                  <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                  {t("onb.firstCheckin")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary"
                >
                  {t("onb.skipToHome")}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {step <= 3 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> {t("onb.back")}
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-glow"
              >
                {t("onb.next")} <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-spark text-spark-foreground text-sm font-semibold hover:bg-spark/90 shadow-spark disabled:opacity-50"
              >
                {saving ? (locale === "es" ? "Guardando…" : "Saving…") : t("onb.finish")}
                {!saving && <Sparkles className="w-4 h-4" aria-hidden="true" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

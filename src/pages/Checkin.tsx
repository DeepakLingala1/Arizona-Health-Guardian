// Spark AZ — One Health 3-tab check-in
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { User, PawPrint, CloudFog, Check, ChevronRight, ChevronLeft, ClipboardCheck, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import {
  SYMPTOM_LABELS, ANIMAL_SIGN_LABELS, ENV_SIGNAL_LABELS,
  computeRisk, bandColor,
} from "@/lib/riskScore";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { getPersona, PersonaId } from "@/lib/personas";
import { Slider } from "@/components/ui/slider";

type Tab = "self" | "animal" | "environment";

export default function Checkin() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, locale } = useLocale();
  const navigate = useNavigate();

  const persona: PersonaId = ((profile as any)?.persona ?? "urban") as PersonaId;
  const personaObj = getPersona(persona);
  const [tab, setTab] = useState<Tab>(personaObj.defaultTab);
  const [county, setCounty] = useState<string>(profile?.home_county ?? "Pima");

  // Self
  const [mood, setMood] = useState<number>(7);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [knownExposure, setKnownExposure] = useState(false);
  const [recentTravel, setRecentTravel] = useState(false);
  const [travelDest, setTravelDest] = useState("");

  // Animal
  const [animalType, setAnimalType] = useState("");
  const [animalSigns, setAnimalSigns] = useState<string[]>([]);
  const [animalCount, setAnimalCount] = useState<number>(1);

  // Environment
  const [envSignals, setEnvSignals] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.home_county) setCounty(profile.home_county);
    setTab(getPersona((profile as any)?.persona).defaultTab);
  }, [profile]);

  const previewRisk = useMemo(() => computeRisk({
    symptoms, mood, knownExposure, recentTravel,
    conditions: profile?.conditions ?? [],
    persona, county,
    envSignals, animalSigns,
  }), [symptoms, mood, knownExposure, recentTravel, envSignals, animalSigns, persona, county, profile?.conditions]);

  const toggle = (arr: string[], setArr: (a: string[]) => void, key: string) =>
    setArr(arr.includes(key) ? arr.filter((s) => s !== key) : [...arr, key]);

  const hasSomething =
    symptoms.length > 0 || animalSigns.length > 0 || envSignals.length > 0 ||
    knownExposure || recentTravel;

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const rows: any[] = [];
      if (tab === "self" || symptoms.length > 0 || knownExposure || recentTravel) {
        rows.push({
          user_id: user.id, county, category: "self",
          mood, symptoms, known_exposure: knownExposure,
          recent_travel: recentTravel, travel_destination: recentTravel ? travelDest : null,
          notes: notes || null,
          risk_score: previewRisk.composite,
        });
      }
      if (tab === "animal" || animalSigns.length > 0) {
        rows.push({
          user_id: user.id, county, category: "animal",
          animal_type: animalType || null, animal_signs: animalSigns,
          animal_count: animalCount, symptoms: [],
          notes: notes || null,
        });
      }
      if (tab === "environment" || envSignals.length > 0) {
        rows.push({
          user_id: user.id, county, category: "environment",
          env_signals: envSignals, symptoms: [],
          notes: notes || null,
        });
      }
      if (rows.length === 0) {
        rows.push({
          user_id: user.id, county, category: "self",
          mood: 9, symptoms: [], known_exposure: false, recent_travel: false,
          notes: locale === "es" ? "Reporte: estoy bien hoy" : "Reported fine today",
          risk_score: previewRisk.composite,
        });
      }

      const { error } = await supabase.from("checkins").insert(rows);
      if (error) throw error;

      // Bump streak
      const today = new Date().toISOString().slice(0, 10);
      const last = profile?.last_checkin_date;
      const newStreak = last === today
        ? (profile?.streak ?? 0)
        : (last && new Date(today).getTime() - new Date(last).getTime() <= 86400000 * 1.5)
          ? (profile?.streak ?? 0) + 1
          : 1;
      await supabase.from("profiles").update({ streak: newStreak, last_checkin_date: today }).eq("id", user.id);
      await refreshProfile();

      // Trigger county aggregate (fire and forget)
      supabase.functions.invoke("compute-county-aggregate", { body: {} }).catch(console.error);

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ["#0E7C7B", "#F97316", "#5A8F69"] });
      toast.success(t("checkin.submitted"));
      setTimeout(() => navigate("/"), 800);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const TABS = [
    { id: "self" as Tab, label: t("checkin.tab.self"), Icon: User, color: "primary" },
    { id: "animal" as Tab, label: t("checkin.tab.animal"), Icon: PawPrint, color: "earth" },
    { id: "environment" as Tab, label: t("checkin.tab.environment"), Icon: CloudFog, color: "spark" },
  ];

  const ringColor = bandColor(previewRisk.band);

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("checkin.title")}</h1>
        <p className="text-muted-foreground mt-1.5">{t("checkin.subtitle")}</p>
      </div>

      {/* County selector */}
      <div className="card-elevated p-4 flex items-center gap-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
          {t("common.county")}
        </div>
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="flex-1 bg-transparent font-medium focus:outline-none"
        >
          {COUNTY_NAMES.map((c) => <option key={c}>{c}</option>)}
        </select>

        {profile && profile.streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark/10 text-spark text-sm font-semibold">
            <Flame className="w-4 h-4" />
            {profile.streak}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((tb) => {
          const TIcon = tb.Icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                active
                  ? `border-${tb.color} bg-${tb.color}/5 shadow-card`
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center bg-${tb.color}/10 text-${tb.color} mb-2`}>
                <TIcon className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold">{tb.label}</div>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="card-elevated p-6 space-y-5"
        >
          {tab === "self" && (
            <>
              <div>
                <label className="text-sm font-semibold">{t("checkin.mood")}</label>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl">😷</span>
                  <Slider value={[mood]} onValueChange={([v]) => setMood(v)} min={1} max={10} step={1} className="flex-1" />
                  <span className="text-2xl">😀</span>
                  <div className="w-8 text-right tabular-nums font-semibold">{mood}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">{t("checkin.symptoms")}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(SYMPTOM_LABELS).map(([k, l]) => (
                    <ChipBtn key={k} active={symptoms.includes(k)} onClick={() => toggle(symptoms, setSymptoms, k)}>
                      {l[locale]}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <ToggleCard active={knownExposure} onClick={() => setKnownExposure(!knownExposure)} label={t("checkin.exposure")} />
                <ToggleCard active={recentTravel} onClick={() => setRecentTravel(!recentTravel)} label={t("checkin.travel")} />
              </div>

              {recentTravel && (
                <div>
                  <label className="text-sm font-semibold">{t("checkin.travelTo")}</label>
                  <input
                    value={travelDest} onChange={(e) => setTravelDest(e.target.value)}
                    placeholder="Sonora, MX · CA · ..."
                    className="mt-2 w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                  />
                </div>
              )}
            </>
          )}

          {tab === "animal" && (
            <>
              <div>
                <label className="text-sm font-semibold">{t("checkin.animalType")}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["cattle", "horse", "sheep", "goat", "pig", "pet", "wild bird", "wildlife", "rodent"].map((a) => (
                    <ChipBtn key={a} active={animalType === a} onClick={() => setAnimalType(a)}>
                      {a}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">{t("checkin.animalSigns")}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(ANIMAL_SIGN_LABELS).map(([k, l]) => (
                    <ChipBtn key={k} active={animalSigns.includes(k)} onClick={() => toggle(animalSigns, setAnimalSigns, k)}>
                      {l[locale]}
                    </ChipBtn>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">{t("checkin.animalCount")}</label>
                <div className="mt-3 flex items-center gap-3">
                  <Slider value={[animalCount]} onValueChange={([v]) => setAnimalCount(v)} min={1} max={20} step={1} className="flex-1" />
                  <div className="w-10 text-right tabular-nums font-semibold">{animalCount}+</div>
                </div>
              </div>
            </>
          )}

          {tab === "environment" && (
            <>
              <div>
                <label className="text-sm font-semibold">{t("checkin.envSignals")}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(ENV_SIGNAL_LABELS).map(([k, l]) => (
                    <ChipBtn key={k} active={envSignals.includes(k)} onClick={() => toggle(envSignals, setEnvSignals, k)}>
                      {l[locale]}
                    </ChipBtn>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold">{t("checkin.notes")}</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="mt-2 w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm resize-none"
              placeholder={locale === "es" ? "Algo que quieras añadir…" : "Anything you'd like to add…"}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Live risk preview + submit */}
      <div className="card-elevated p-5 flex items-center gap-5 sticky bottom-20 md:bottom-4 bg-card/95 backdrop-blur-xl">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={ringColor} strokeWidth="8" strokeLinecap="round"
              pathLength={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: previewRisk.composite / 100 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
            {previewRisk.composite}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {locale === "es" ? "Vista previa del riesgo" : "Live risk preview"}
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: ringColor }}>
            {t(`band.${previewRisk.band}`)}
          </div>
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-glow transition-all"
        >
          {submitting ? (locale === "es" ? "Enviando…" : "Saving…") : (
            <>
              <ClipboardCheck className="w-4 h-4" />
              {hasSomething ? t("common.submit") : t("checkin.fineToday")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-card"
          : "bg-card border-border hover:border-muted-foreground/40"
      }`}
    >
      {active && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
      {children}
    </button>
  );
}

function ToggleCard({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border-2 text-left transition-all ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          active ? "border-primary bg-primary" : "border-muted-foreground/40"
        }`}>
          {active && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </button>
  );
}

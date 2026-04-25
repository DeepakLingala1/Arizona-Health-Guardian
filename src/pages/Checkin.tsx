import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Smile, Frown, Meh } from "lucide-react";
import { ALL_SYMPTOMS, SYMPTOM_LABELS, computeRisk } from "@/lib/riskScore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { format, differenceInCalendarDays } from "date-fns";

const STEPS = ["How you feel", "Symptoms", "Exposure", "Review"];

export default function Checkin() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(7);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [recentTravel, setRecentTravel] = useState(false);
  const [knownExposure, setKnownExposure] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const toggleSymptom = (s: string) => {
    setSymptoms((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  };

  const submit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    const today = format(new Date(), "yyyy-MM-dd");

    // Compute risk score
    const r = computeRisk({
      symptoms,
      mood,
      knownExposure,
      recentTravel,
      conditions: profile.conditions ?? [],
      countyAggregate: 40,
    });

    const { error } = await supabase.from("checkins").insert({
      user_id: user.id,
      county: profile.home_county,
      mood,
      symptoms,
      recent_travel: recentTravel,
      known_exposure: knownExposure,
      risk_score: r.score,
    });

    if (error) {
      toast.error("Failed to save check-in");
      setSubmitting(false);
      return;
    }

    // Streak update
    let newStreak = 1;
    if (profile.last_checkin_date) {
      const diff = differenceInCalendarDays(new Date(today), new Date(profile.last_checkin_date));
      if (diff === 0) newStreak = profile.streak;
      else if (diff === 1) newStreak = profile.streak + 1;
    }
    await supabase.from("profiles").update({
      streak: newStreak,
      last_checkin_date: today,
    }).eq("id", user.id);

    // Trigger county aggregate (fire-and-forget)
    supabase.functions.invoke("compute-county-aggregate", { body: { county: profile.home_county } });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#0E7C7B", "#FF6B5B", "#22C55E"],
    });
    toast.success("Check-in saved", { description: `Risk score updated to ${r.score}` });
    await refreshProfile();
    setTimeout(() => navigate("/"), 600);
  };

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className={cn("text-[10px] uppercase tracking-wider mt-1.5 hidden sm:block", i === step ? "text-foreground font-semibold" : "text-muted-foreground")}>
                {label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 -mt-4", i < step ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-card p-6 md:p-8 min-h-[420px]">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-2xl font-bold mb-2">How are you feeling overall?</h2>
              <p className="text-sm text-muted-foreground mb-8">A quick gut check from 1 (rough) to 10 (great).</p>
              <div className="flex justify-center mb-6">
                {mood <= 3 ? <Frown className="w-20 h-20 text-risk-elevated" /> :
                 mood <= 6 ? <Meh className="w-20 h-20 text-risk-moderate" /> :
                 <Smile className="w-20 h-20 text-risk-low" />}
              </div>
              <div className="text-center text-5xl font-bold tabular-nums mb-6">{mood}</div>
              <Slider min={1} max={10} step={1} value={[mood]} onValueChange={(v) => setMood(v[0])} />
              <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>Awful</span><span>Great</span></div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-2xl font-bold mb-2">Any symptoms today?</h2>
              <p className="text-sm text-muted-foreground mb-6">Tap all that apply. Skip if you feel fine.</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all",
                      symptoms.includes(s)
                        ? "bg-primary text-primary-foreground border-primary shadow-glow"
                        : "bg-card border-border hover:border-primary/40"
                    )}
                  >
                    {SYMPTOM_LABELS[s]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-2xl font-bold mb-2">Recent exposure or travel?</h2>
              <p className="text-sm text-muted-foreground mb-8">Helps us calibrate your community risk.</p>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary cursor-pointer">
                  <div>
                    <div className="font-semibold">Known exposure</div>
                    <div className="text-sm text-muted-foreground">In contact with someone sick in the last 5 days</div>
                  </div>
                  <Switch checked={knownExposure} onCheckedChange={setKnownExposure} />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary cursor-pointer">
                  <div>
                    <div className="font-semibold">Recent travel</div>
                    <div className="text-sm text-muted-foreground">Out of state or abroad in the last 7 days</div>
                  </div>
                  <Switch checked={recentTravel} onCheckedChange={setRecentTravel} />
                </label>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              <h2 className="text-2xl font-bold mb-2">Review</h2>
              <p className="text-sm text-muted-foreground mb-6">Looks right? Submit to refresh your risk score.</p>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between p-3 rounded-xl bg-muted">
                  <dt className="text-muted-foreground">How you feel</dt><dd className="font-semibold tabular-nums">{mood}/10</dd>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted">
                  <dt className="text-muted-foreground">Symptoms</dt>
                  <dd className="font-semibold text-right max-w-xs">
                    {symptoms.length === 0 ? "None" : symptoms.map((s) => SYMPTOM_LABELS[s]).join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted">
                  <dt className="text-muted-foreground">Known exposure</dt><dd className="font-semibold">{knownExposure ? "Yes" : "No"}</dd>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted">
                  <dt className="text-muted-foreground">Recent travel</dt><dd className="font-semibold">{recentTravel ? "Yes" : "No"}</dd>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-muted">
                  <dt className="text-muted-foreground">County</dt><dd className="font-semibold">{profile?.home_county}</dd>
                </div>
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={prev} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="shadow-glow">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent-glow">
            {submitting ? "Saving…" : (<>Submit check-in <Check className="w-4 h-4 ml-1" /></>)}
          </Button>
        )}
      </div>
    </div>
  );
}

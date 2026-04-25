import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { COUNTY_NAMES } from "@/lib/azCounties";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Moon, Sun, RotateCcw, User } from "lucide-react";

const AGE_BANDS = ["<18", "18-34", "35-54", "55-74", "75+"];
const CONDITIONS = [
  { id: "asthma", label: "Asthma" },
  { id: "diabetes", label: "Diabetes" },
  { id: "heart_disease", label: "Heart disease" },
  { id: "immunocompromised", label: "Immunocompromised" },
  { id: "pregnancy", label: "Pregnancy" },
  { id: "copd", label: "COPD" },
];

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const { theme, toggle } = useTheme();
  const [ageBand, setAgeBand] = useState(profile?.age_band ?? "35-54");
  const [conditions, setConditions] = useState<string[]>(profile?.conditions ?? []);
  const [homeCounty, setHomeCounty] = useState(profile?.home_county ?? "Pima");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (profile) {
      setAgeBand(profile.age_band ?? "35-54");
      setConditions(profile.conditions ?? []);
      setHomeCounty(profile.home_county ?? "Pima");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      age_band: ageBand,
      conditions,
      home_county: homeCounty,
    }).eq("id", user.id);
    if (error) toast.error("Failed to save");
    else { toast.success("Profile updated"); await refreshProfile(); }
    setSaving(false);
  };

  const resetDemo = async () => {
    setResetting(true);
    toast.info("Re-seeding demo data...");
    const { error } = await supabase.functions.invoke("seed-demo", { body: { force: true } });
    if (error) toast.error("Reset failed");
    else toast.success("Demo data reset");
    setResetting(false);
  };

  return (
    <div className="container max-w-2xl py-8 md:py-12 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary mb-1">
          <User className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">Profile</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your preferences</h1>
        <p className="text-muted-foreground mt-1">Personalize your risk model. Anonymous & private.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 shadow-card space-y-5">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Age band</Label>
          <Select value={ageBand} onValueChange={setAgeBand}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AGE_BANDS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Home county</Label>
          <Select value={homeCounty} onValueChange={setHomeCounty}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTY_NAMES.map((c) => <SelectItem key={c} value={c}>{c} County</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Chronic conditions</Label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map((c) => (
              <label key={c.id} className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-secondary cursor-pointer">
                <Checkbox
                  checked={conditions.includes(c.id)}
                  onCheckedChange={(v) => {
                    setConditions((cur) => v ? [...cur, c.id] : cur.filter((x) => x !== c.id));
                  }}
                />
                <span className="text-sm">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save preferences"}
        </Button>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <div>
              <div className="font-semibold">Dark mode</div>
              <div className="text-sm text-muted-foreground">Easier on the eyes at night</div>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </div>

      <div className="rounded-2xl bg-muted border border-dashed border-border p-6 text-center">
        <div className="text-sm text-muted-foreground mb-3">Reset all seeded check-ins, county aggregates, and AI insights to the demo baseline.</div>
        <Button variant="outline" onClick={resetDemo} disabled={resetting}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          {resetting ? "Re-seeding..." : "Reset demo data"}
        </Button>
      </div>
    </div>
  );
}

import { LockKeyhole, ShieldCheck, UserCheck, ClipboardCheck, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import ReviewQueue from "@/pages/ReviewQueue";

function displayRole(role: string | null | undefined) {
  if (!role || role === "public") return "public";
  return role;
}

export default function AdminConsole() {
  const { profile, user, loading, refreshProfile } = useAuth();
  const { t, locale } = useLocale();
  const isAnalyst = profile?.role === "analyst";

  async function enableDemoAnalystAccess() {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      role: "analyst",
      persona: profile?.persona ?? "urban",
      home_county: profile?.home_county ?? "Pima",
      language: locale,
      onboarded: profile?.onboarded ?? true,
    }, { onConflict: "id" });
    if (error) {
      toast.error(locale === "es" ? "No se pudo activar el rol" : "Could not enable analyst role");
      return;
    }
    await refreshProfile();
    toast.success(locale === "es" ? "Acceso de analista activado" : "Analyst access enabled");
  }

  if (loading) {
    return (
      <div className="container max-w-3xl py-12 space-y-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          <LockKeyhole className="w-3.5 h-3.5" aria-hidden="true" />
          {t("nav.admin")}
        </div>
        <section className="card-elevated p-6 space-y-4" aria-label={t("common.loading")}>
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
        </section>
      </div>
    );
  }

  if (!isAnalyst) {
    return (
      <div className="container max-w-3xl py-12 space-y-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          <LockKeyhole className="w-3.5 h-3.5" aria-hidden="true" />
          {t("nav.admin")}
        </div>

        <section className="card-elevated p-6 border-l-4 border-l-spark">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-spark/10 text-spark flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold">{t("admin.lockedTitle")}</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {t("admin.lockedBody")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {t("admin.currentRole")}
              </div>
              <div className="mt-1 font-mono text-sm font-bold uppercase">
                {displayRole(profile?.role)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {t("admin.requiredRole")}
              </div>
              <div className="mt-1 font-mono text-sm font-bold uppercase">analyst</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={enableDemoAnalystAccess}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-spark text-spark-foreground text-sm font-semibold hover:bg-spark/90 transition-colors"
            >
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              {t("admin.demoAccess")}
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("admin.demoHint")}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {t("nav.admin")}
            </div>
            <h1 className="text-3xl font-bold mt-1">{t("admin.title")}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {t("admin.subtitle")}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            <UserCheck className="w-4 h-4" aria-hidden="true" />
            {t("admin.roleVerified")}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <ClipboardCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            <div className="text-sm font-semibold mt-2">{t("review.title")}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("admin.reviewMetric")}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            <div className="text-sm font-semibold mt-2">{t("admin.rlsProtected")}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("admin.rlsMetric")}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <History className="w-4 h-4 text-primary" aria-hidden="true" />
            <div className="text-sm font-semibold mt-2">{t("admin.auditReady")}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("admin.auditMetric")}</div>
          </div>
        </div>
      </section>

      <ReviewQueue />
    </div>
  );
}

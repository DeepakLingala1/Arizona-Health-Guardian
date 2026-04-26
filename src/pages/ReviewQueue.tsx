// Spark AZ — Analyst HITL Review Queue
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Edit3, Check, AlertTriangle, History, Download, Inbox } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string; county: string; severity: string;
  title: string; body: string; status: string; created_at: string;
  reviewed_by?: string; reviewed_at?: string; review_notes?: string;
}

const SEV_COLOR: Record<string, string> = {
  low: "risk-low", moderate: "risk-moderate", elevated: "risk-elevated", high: "risk-high",
};

interface LogEntry {
  id: string;
  alert_id: string | null;
  actor: string | null;
  action: string;
  before: any;
  after: any;
  created_at: string;
}

export default function ReviewQueue() {
  const { profile, user } = useAuth();
  const { t, locale } = useLocale();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const isAnalyst = profile?.role === "analyst";

  async function load() {
    let q = supabase.from("alerts").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setAlerts((data as any) ?? []);

    const { data: logRows } = await supabase
      .from("review_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setLogs((logRows as any) ?? []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function becomeAnalyst() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ role: "analyst" }).eq("id", user.id);
    if (error) { toast.error("Couldn't enable analyst mode"); return; }
    toast.success(locale === "es" ? "Modo analista activado" : "Analyst mode enabled");
    setTimeout(() => window.location.reload(), 600);
  }

  function exportCsv() {
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const alertsHeader = ["id","county","severity","status","title","body","ai_generated","created_at","reviewed_at","review_notes"];
    const alertsRows = (alerts as unknown as Array<Record<string, unknown>>).map((a) => [
      a.id, a.county, a.severity, a.status, a.title, a.body,
      a.ai_generated ?? "", a.created_at, a.reviewed_at ?? "", a.review_notes ?? "",
    ].map(esc).join(","));
    const logHeader = ["id","alert_id","actor","action","before_title","after_title","created_at"];
    const logRows = (logs as unknown as Array<Record<string, unknown>>).map((l) => {
      const before = (l.before as { title?: string } | null) ?? {};
      const after = (l.after as { title?: string } | null) ?? {};
      return [
        l.id, l.alert_id ?? "", l.actor ?? "", l.action,
        before.title ?? "", after.title ?? "",
        l.created_at,
      ].map(esc).join(",");
    });
    const csv =
      `# spark-az alerts export · ${new Date().toISOString()}\n` +
      `# filter: ${filter}\n\n` +
      `# alerts\n${alertsHeader.join(",")}\n${alertsRows.join("\n")}\n\n` +
      `# review_log (last 20)\n${logHeader.join(",")}\n${logRows.join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spark-az-alerts-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("review.exported"));
  }

  async function act(alert_id: string, action: "approve" | "edit" | "reject", overrideTitle?: string, overrideBody?: string) {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("review-action", {
        body: { alert_id, action, title: overrideTitle, body: overrideBody, notes: notes || null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(action === "approve" ? "Approved & published" : action === "reject" ? "Rejected" : "Saved");
      setEditing(null); setNotes("");
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? "Action failed");
    } finally { setBusy(false); }
  }

  if (!isAnalyst) {
    return (
      <div className="container max-w-2xl py-12 space-y-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> {t("nav.review")}
        </div>
        <h1 className="text-3xl font-bold">{t("review.title")}</h1>
        <p className="text-muted-foreground">{t("review.subtitle")}</p>

        <div className="card-elevated p-6 border-spark/20 border-l-4 border-l-spark">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-spark" />
            <div className="font-semibold">
              {locale === "es" ? "Modo demo de analista" : "Analyst demo mode"}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {locale === "es"
              ? "Esta cola está restringida a analistas de salud pública. Para esta demostración, puedes activar el rol de analista en tu perfil."
              : "This queue is restricted to public-health analysts. For this prototype demo, you can grant yourself the analyst role to see the workflow."}
          </p>
          <button
            onClick={becomeAnalyst}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-spark text-spark-foreground font-semibold hover:bg-spark/90"
          >
            <ShieldCheck className="w-4 h-4" />
            {locale === "es" ? "Activar modo analista" : "Enable analyst mode"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Analyst HITL
          </div>
          <h1 className="text-3xl font-bold mt-1">{t("review.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("review.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="card-elevated p-1 inline-flex">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={alerts.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary disabled:opacity-40"
            aria-label={t("review.export")}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            {t("review.export")}
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          variant="alerts"
          Icon={Inbox}
          title={t("review.title")}
          body={t("empty.alerts")}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((a) => {
              const sev = SEV_COLOR[a.severity] ?? "risk-elevated";
              const isEditing = editing === a.id;
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="card-elevated p-5 border-l-4"
                  style={{ borderLeftColor: `hsl(var(--${sev}))` }}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `hsl(var(--${sev}) / 0.15)`, color: `hsl(var(--${sev}))` }}
                    >{a.severity}</span>
                    <span className="text-xs text-muted-foreground">{a.county} County</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                      {a.status}
                    </span>
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm font-semibold mb-2"
                      />
                      <textarea
                        value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm resize-none"
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">{a.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                    </>
                  )}

                  {a.review_notes && !isEditing && (
                    <div className="mt-3 text-xs text-muted-foreground italic">
                      ✎ {a.review_notes}
                    </div>
                  )}

                  {a.status === "pending" && (
                    <>
                      {isEditing && (
                        <input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={locale === "es" ? "Notas (opcional)…" : "Reviewer notes (optional)…"}
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm"
                        />
                      )}
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <button
                          disabled={busy}
                          onClick={() => isEditing
                            ? act(a.id, "edit", editTitle, editBody)
                            : act(a.id, "approve")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          {isEditing
                            ? (locale === "es" ? "Guardar y aprobar" : "Save & approve")
                            : t("review.approve")}
                        </button>
                        {!isEditing && (
                          <button
                            onClick={() => { setEditing(a.id); setEditTitle(a.title); setEditBody(a.body); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-sm font-semibold hover:bg-secondary/70"
                          >
                            <Edit3 className="w-4 h-4" /> {t("review.edit")}
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() => act(a.id, "reject")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> {t("review.reject")}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => setEditing(null)}
                            className="text-sm text-muted-foreground hover:text-foreground ml-auto"
                          >{t("common.cancel")}</button>
                        )}
                      </div>
                    </>
                  )}

                  {a.reviewed_at && (
                    <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <History className="w-3 h-3" />
                      {locale === "es" ? "Revisado" : "Reviewed"} {new Date(a.reviewed_at).toLocaleString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* HITL audit log */}
      <section className="card-elevated p-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {locale === "es" ? "Registro de auditoría" : "Audit log"}
            </div>
            <div className="text-xs text-muted-foreground">
              {locale === "es" ? "Últimas 20 acciones de revisión humana." : "Last 20 human-in-the-loop review actions."}
            </div>
          </div>
        </div>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            {locale === "es" ? "Sin acciones registradas todavía." : "No actions logged yet."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((l) => {
              const beforeT = (l.before as any)?.title;
              const afterT = (l.after as any)?.title;
              const titleChanged = l.action === "edit" && beforeT && afterT && beforeT !== afterT;
              const actionColor =
                l.action === "approve" ? "risk-low"
                : l.action === "reject" ? "risk-high"
                : "spark";
              return (
                <div key={l.id} className="py-3 flex items-start gap-3 text-sm">
                  <span
                    className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded mt-0.5 shrink-0"
                    style={{
                      backgroundColor: `hsl(var(--${actionColor}) / 0.15)`,
                      color: `hsl(var(--${actionColor}))`,
                    }}
                  >
                    {l.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {afterT ?? beforeT ?? l.alert_id?.slice(0, 8) ?? "—"}
                    </div>
                    {titleChanged && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        <span className="line-through opacity-70">{beforeT}</span>
                        <span className="mx-1.5">→</span>
                        <span>{afterT}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{new Date(l.created_at).toLocaleString()}</span>
                      {l.actor && (
                        <span className="font-mono">· {l.actor.slice(0, 8)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

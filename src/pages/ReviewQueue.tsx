// Spark AZ - analyst HITL review queue
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Check, History, Download, Inbox } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
  id: string;
  county: string;
  severity: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  ai_generated?: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
}

interface AlertSnapshot {
  title?: string;
  [key: string]: unknown;
}

interface LogEntry {
  id: string;
  alert_id: string | null;
  actor: string | null;
  action: string;
  before: AlertSnapshot | null;
  after: AlertSnapshot | null;
  created_at: string;
}

const SEV_COLOR: Record<string, string> = {
  low: "risk-low",
  moderate: "risk-moderate",
  elevated: "risk-elevated",
  high: "risk-high",
};

const FILTERS = ["pending", "approved", "rejected", "all"] as const;
type Filter = (typeof FILTERS)[number];

function actionToast(action: "approve" | "edit" | "reject", locale: "en" | "es") {
  if (locale === "es") {
    if (action === "approve") return "Aprobado y publicado";
    if (action === "reject") return "Rechazado";
    return "Guardado";
  }
  if (action === "approve") return "Approved and published";
  if (action === "reject") return "Rejected";
  return "Saved";
}

export default function ReviewQueue() {
  const { t, locale } = useLocale();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    let q = supabase.from("alerts").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);

    const { data: alertRows, error: alertsError } = await q;
    if (alertsError) {
      const message = locale === "es" ? "No se pudieron cargar alertas" : "Could not load alerts";
      setLoadError(message);
      setLoading(false);
      toast.error(message);
      return;
    }
    setAlerts(alertRows ?? []);

    const { data: logRows, error: logsError } = await supabase
      .from("review_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (logsError) {
      const message = locale === "es" ? "No se pudo cargar auditoria" : "Could not load audit log";
      setLoadError(message);
      setLoading(false);
      toast.error(message);
      return;
    }
    setLogs((logRows ?? []) as LogEntry[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function exportCsv() {
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const alertsHeader = ["id", "county", "severity", "status", "title", "body", "ai_generated", "created_at", "reviewed_at", "review_notes"];
    const alertsRows = alerts.map((a) => [
      a.id,
      a.county,
      a.severity,
      a.status,
      a.title,
      a.body,
      a.ai_generated ?? "",
      a.created_at,
      a.reviewed_at ?? "",
      a.review_notes ?? "",
    ].map(esc).join(","));

    const logHeader = ["id", "alert_id", "actor", "action", "before_title", "after_title", "created_at"];
    const logRows = logs.map((l) => [
      l.id,
      l.alert_id ?? "",
      l.actor ?? "",
      l.action,
      l.before?.title ?? "",
      l.after?.title ?? "",
      l.created_at,
    ].map(esc).join(","));

    const csv =
      `# spark-az alerts export - ${new Date().toISOString()}\n` +
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

  async function act(alertId: string, action: "approve" | "edit" | "reject", overrideTitle?: string, overrideBody?: string) {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("review-action", {
        body: { alert_id: alertId, action, title: overrideTitle, body: overrideBody, notes: notes || null },
      });
      if (error) throw error;

      const response = data as { error?: string } | null;
      if (response?.error) throw new Error(response.error);

      toast.success(actionToast(action, locale));
      setEditing(null);
      setNotes("");
      await load();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold">
            Analyst HITL
          </div>
          <h2 className="text-2xl font-bold mt-1">{t("review.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t("review.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="card-elevated p-1 inline-flex">
            {FILTERS.map((f) => (
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

      {loadError ? (
        <section className="card-elevated p-5 border-l-4 border-l-destructive">
          <div className="font-semibold">{loadError}</div>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "es"
              ? "La consola sigue cargada, pero Supabase no devolvio la cola. Intenta refrescar o revisar permisos."
              : "The console is loaded, but Supabase did not return the queue. Try refreshing or checking permissions."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-secondary"
          >
            {locale === "es" ? "Reintentar" : "Retry"}
          </button>
        </section>
      ) : loading ? (
        <div className="space-y-3" aria-label={t("common.loading")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="card-elevated p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card-elevated p-5 border-l-4"
                  style={{ borderLeftColor: `hsl(var(--${sev}))` }}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `hsl(var(--${sev}) / 0.15)`, color: `hsl(var(--${sev}))` }}
                    >
                      {a.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.county} County</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                      {a.status}
                    </span>
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm font-semibold mb-2"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={3}
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
                      Edited note: {a.review_notes}
                    </div>
                  )}

                  {a.status === "pending" && (
                    <>
                      {isEditing && (
                        <input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={locale === "es" ? "Notas (opcional)..." : "Reviewer notes (optional)..."}
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
                          <Check className="w-4 h-4" aria-hidden="true" />
                          {isEditing
                            ? (locale === "es" ? "Guardar y aprobar" : "Save and approve")
                            : t("review.approve")}
                        </button>
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditing(a.id);
                              setEditTitle(a.title);
                              setEditBody(a.body);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-sm font-semibold hover:bg-secondary/70"
                          >
                            <Edit3 className="w-4 h-4" aria-hidden="true" />
                            {t("review.edit")}
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() => act(a.id, "reject")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                          {t("review.reject")}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => setEditing(null)}
                            className="text-sm text-muted-foreground hover:text-foreground ml-auto"
                          >
                            {t("common.cancel")}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {a.reviewed_at && (
                    <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <History className="w-3 h-3" aria-hidden="true" />
                      {locale === "es" ? "Revisado" : "Reviewed"} {new Date(a.reviewed_at).toLocaleString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <section className="card-elevated p-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {locale === "es" ? "Registro de auditoria" : "Audit log"}
            </div>
            <div className="text-xs text-muted-foreground">
              {locale === "es" ? "Ultimas 20 acciones de revision humana." : "Last 20 human-in-the-loop review actions."}
            </div>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            {locale === "es" ? "Sin acciones registradas todavia." : "No actions logged yet."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((l) => {
              const beforeTitle = l.before?.title;
              const afterTitle = l.after?.title;
              const titleChanged = l.action === "edit" && beforeTitle && afterTitle && beforeTitle !== afterTitle;
              const actionColor =
                l.action === "approve"
                  ? "risk-low"
                  : l.action === "reject"
                    ? "risk-high"
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
                      {afterTitle ?? beforeTitle ?? l.alert_id?.slice(0, 8) ?? "-"}
                    </div>
                    {titleChanged && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        <span className="line-through opacity-70">{beforeTitle}</span>
                        <span className="mx-1.5">to</span>
                        <span>{afterTitle}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{new Date(l.created_at).toLocaleString()}</span>
                      {l.actor && (
                        <span className="font-mono">by {l.actor.slice(0, 8)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

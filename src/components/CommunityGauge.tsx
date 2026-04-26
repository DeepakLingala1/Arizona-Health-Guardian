// Spark AZ — community contribution gauge (engagement: "your county needs X more reports")
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface Props {
  county: string;
  reportsToday: number;
  /** target reports/day for reliable signal detection (k-means min) */
  target?: number;
}

export function CommunityGauge({ county, reportsToday, target = 10 }: Props) {
  const { t, locale } = useLocale();
  const pct = Math.max(0, Math.min(100, Math.round((reportsToday / target) * 100)));
  const remaining = Math.max(0, target - reportsToday);

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-earth/10 flex items-center justify-center">
          <Users className="w-4 h-4 text-earth" aria-hidden="true" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {t("home.contribution")}
          </div>
          <div className="text-xs text-muted-foreground">
            {county} {locale === "es" ? "Condado" : "County"}
          </div>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <div className="text-3xl font-bold tabular-nums" aria-live="polite">{reportsToday}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t("home.contribReports")}
          </div>
        </div>
        <div className="flex-1 pb-1">
          <div
            className="h-2.5 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("home.contribution")}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${pct >= 100 ? "bg-risk-low" : "bg-gradient-earth"}`}
            />
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1.5 tabular-nums">
            {pct}% · {locale === "es" ? "meta" : "of"} {target} {t("home.contribTarget")}
          </div>
        </div>
      </div>

      {remaining > 0 ? (
        <Link
          to="/checkin"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {locale === "es"
            ? `Faltan ${remaining} reportes — ${t("home.contribAddOne")}`
            : `${remaining} more needed — ${t("home.contribAddOne")}`}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      ) : (
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-risk-low">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          {locale === "es" ? "Detección de señales activa" : "Signal detection unlocked"}
        </div>
      )}
    </div>
  );
}

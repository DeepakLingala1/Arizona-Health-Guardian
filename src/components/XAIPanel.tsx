// Spark AZ — XAI panel: explains "why this score" with weighted bars
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ArrowUp, ArrowDown } from "lucide-react";
import { buildXAI, CATEGORY_COLOR } from "@/lib/explain";
import { RiskDriver } from "@/lib/riskScore";
import { useLocale } from "@/lib/i18n";

export function XAIPanel({ drivers, title }: { drivers: RiskDriver[]; title?: string }) {
  const { locale, t } = useLocale();
  const bars = buildXAI(drivers, locale).slice(0, 8);
  const max = Math.max(...bars.map((b) => b.pct), 1);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="card-elevated p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {locale === "es" ? "Explicabilidad" : "Explainability"}
            </div>
            <h3 className="text-lg font-semibold mt-0.5">{title ?? t("home.drivers")}</h3>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground" aria-label="About">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {locale === "es"
                ? "Cada barra muestra cuánto contribuye un factor a tu puntuación. Verde reduce, rojo aumenta."
                : "Each bar shows how much a factor contributes to your score. Green pushes down, red pushes up."}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-2.5">
          {bars.map((b, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {b.direction === "up" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-risk-elevated shrink-0" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-risk-low shrink-0" />
                      )}
                      <span className="truncate font-medium">{b.label}</span>
                    </div>
                    <span className="tabular-nums text-xs font-semibold ml-3 shrink-0" style={{ color: CATEGORY_COLOR[b.category] }}>
                      {b.weight > 0 ? "+" : ""}{b.weight}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.pct / max) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: CATEGORY_COLOR[b.category] }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="font-semibold mb-1 capitalize">{b.category}</div>
                <div className="text-xs">{b.tooltip}</div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          {locale === "es"
            ? "Modelo determinístico v0.1. Ver Ficha del modelo para detalles."
            : "Deterministic model v0.1. See Model Card for full methodology."}
        </div>
      </div>
    </TooltipProvider>
  );
}

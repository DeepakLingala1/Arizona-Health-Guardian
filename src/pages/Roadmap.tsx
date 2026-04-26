// Spark AZ — Roadmap (required deliverable: future roadmap + investor/partnership view)
import { motion } from "framer-motion";
import {
  Rocket, Users, GitBranch, Globe2, TrendingUp, ShieldCheck, Bell,
  Brain, Workflow, Building2, HandHeart, Target, BarChart3,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface Phase {
  key: string;
  Icon: typeof Rocket;
  color: string;
  titleKey: string;
  windowEn: string;
  windowEs: string;
  bullets: { en: string; es: string }[];
  done?: boolean;
}

const PHASES: Phase[] = [
  {
    key: "now",
    Icon: GitBranch,
    color: "primary",
    titleKey: "rd.now",
    windowEn: "May 2026 — hackathon prototype",
    windowEs: "Mayo 2026 — prototipo del hackathon",
    done: true,
    bullets: [
      { en: "Bilingual web app (EN/ES) covering all 15 AZ counties", es: "App web bilingüe (EN/ES) cubriendo los 15 condados de AZ" },
      { en: "One Health composite score (Human / Animal / Vector / Environmental)", es: "Puntaje compuesto Una Salud (Humano / Animal / Vector / Ambiental)" },
      { en: "Explainable driver bars + Gemini 2.5 Flash narrative", es: "Barras explicables + narrativa Gemini 2.5 Flash" },
      { en: "Analyst HITL review queue with audit log", es: "Cola de revisión analista HITL con registro de auditoría" },
      { en: "Synthetic-data demo with 4 named storylines", es: "Demo con datos sintéticos y 4 escenarios" },
    ],
  },
  {
    key: "q3",
    Icon: Rocket,
    color: "spark",
    titleKey: "rd.q3",
    windowEn: "Q3 2026 — Pima + Maricopa pilot",
    windowEs: "T3 2026 — Piloto Pima + Maricopa",
    bullets: [
      { en: "Onboard 1,000+ residents across 2 counties via UA / community partners", es: "Reclutar 1,000+ residentes en 2 condados con socios comunitarios y UA" },
      { en: "Live analyst desk staffed by ADHS / county epidemiologists", es: "Escritorio analista en vivo operado por epidemiólogos ADHS / condado" },
      { en: "Push + email + SMS alerts for approved high-severity advisories", es: "Alertas push + email + SMS para avisos aprobados de alta severidad" },
      { en: "Native iOS / Android shells for low-bandwidth regions", es: "Apps nativas iOS / Android para regiones de bajo ancho de banda" },
      { en: "Real Open-Meteo / OpenSky / EpiCore-API integrations (replace demo seeds)", es: "Integraciones reales Open-Meteo / OpenSky / EpiCore (reemplazan seeds)" },
    ],
  },
  {
    key: "q4",
    Icon: HandHeart,
    color: "earth",
    titleKey: "rd.q4",
    windowEn: "Q4 2026 — Tribal & border partnerships",
    windowEs: "T4 2026 — Alianzas tribales y fronterizas",
    bullets: [
      { en: "Co-design partnerships with Navajo Nation, Tohono O'odham, San Carlos Apache health teams", es: "Co-diseño con equipos de salud Navajo Nation, Tohono O'odham, San Carlos Apache" },
      { en: "Border-clinic integration: Santa Cruz / Yuma cross-border travel-import workflows", es: "Integración con clínicas fronterizas: flujos de importación Santa Cruz / Yuma" },
      { en: "USSD / SMS-only fallback for low-bandwidth tribal lands", es: "Reserva USSD / SMS para tierras tribales de bajo ancho de banda" },
      { en: "Veterinary-network partner for animal-signal validation", es: "Red veterinaria para validar señales animales" },
      { en: "Live EpiCore webhook ingestion → cross-jurisdiction alerts", es: "Ingesta vía webhook de EpiCore → alertas entre jurisdicciones" },
    ],
  },
  {
    key: "q1",
    Icon: TrendingUp,
    color: "vector",
    titleKey: "rd.q1",
    windowEn: "Q1 2027 — Statewide scale",
    windowEs: "T1 2027 — Escala estatal",
    bullets: [
      { en: "All 15 AZ counties live with named analyst desks", es: "Los 15 condados de AZ activos con escritorios analistas designados" },
      { en: "ML calibration of risk weights against documented outbreaks (Bayesian update)", es: "Calibración ML de pesos de riesgo contra brotes documentados (Bayesiano)" },
      { en: "Forward-projection simulator powered by Epydemix SEIR models", es: "Simulador de proyección con modelos SEIR de Epydemix" },
      { en: "Public CSV / GeoJSON open-data API for researchers and journalists", es: "API abierta CSV / GeoJSON para investigadores y periodistas" },
      { en: "Quarterly model-card refresh with calibration plots vs ADHS confirmed cases", es: "Actualización trimestral del model card con gráficos de calibración vs ADHS" },
    ],
  },
  {
    key: "beyond",
    Icon: Globe2,
    color: "primary",
    titleKey: "rd.beyond",
    windowEn: "2027+ — Beyond Arizona",
    windowEs: "2027+ — Más allá de Arizona",
    bullets: [
      { en: "Multi-state expansion (NM, CA, TX, NV) under shared cross-border framework", es: "Expansión multi-estatal (NM, CA, TX, NV) en marco transfronterizo compartido" },
      { en: "Federated analyst network with shared review SLAs (< 30 min)", es: "Red federada de analistas con SLAs de revisión (< 30 min)" },
      { en: "Open-source the One Health risk engine for global participatory surveillance", es: "Liberar el motor Una Salud como código abierto para vigilancia global" },
      { en: "Genomic-pathway plug-in: link self-reports to public sequencing repos", es: "Complemento genómico: vincular reportes con repositorios públicos de secuencias" },
    ],
  },
];

const METRICS = [
  { Icon: Target, en: "Detection lead-time", es: "Tiempo de detección", val: "− 5 to − 14 days", caption: { en: "vs ADHS confirmed-case curve", es: "vs curva confirmada ADHS" } },
  { Icon: BarChart3, en: "Alert precision (HITL-approved)", es: "Precisión de alertas (HITL)", val: "≥ 0.75", caption: { en: "true outbreak / total approved", es: "brote real / total aprobado" } },
  { Icon: Users, en: "Coverage", es: "Cobertura", val: "≥ 10 reports / county-week", caption: { en: "in 15 of 15 counties", es: "en 15 de 15 condados" } },
  { Icon: ShieldCheck, en: "Equity gap", es: "Brecha de equidad", val: "< 25%", caption: { en: "rural-vs-urban participation gap", es: "brecha rural vs urbano" } },
  { Icon: Workflow, en: "Analyst SLA", es: "SLA del analista", val: "< 30 min", caption: { en: "pending → approved/rejected", es: "pendiente → aprobado/rechazado" } },
  { Icon: Bell, en: "User retention", es: "Retención de usuarios", val: "≥ 40% W4", caption: { en: "4-week active retention", es: "retención activa 4 semanas" } },
];

const INVEST = [
  { Icon: Building2, en: "Cloud + analyst desk", es: "Nube + escritorio analista", val: "$120K / yr",
    caption: { en: "Supabase Pro, AI Gateway credits, on-call analyst rotation", es: "Supabase Pro, créditos AI Gateway, rotación de analistas" } },
  { Icon: Brain, en: "ML calibration team", es: "Equipo de calibración ML", val: "0.5 FTE",
    caption: { en: "Quarterly recalibration + model-card refresh", es: "Recalibración trimestral + actualización del model card" } },
  { Icon: HandHeart, en: "Community engagement", es: "Compromiso comunitario", val: "1 FTE per region",
    caption: { en: "Tribal liaison + Spanish-first promotores network", es: "Enlace tribal + red de promotores en español" } },
  { Icon: ShieldCheck, en: "Public-health governance", es: "Gobernanza salud pública", val: "MOU + ADHS sign-off",
    caption: { en: "Quarterly review of HITL audit log", es: "Revisión trimestral del registro HITL" } },
];

export default function Roadmap() {
  const { t, locale } = useLocale();

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
          <Rocket className="w-3.5 h-3.5" aria-hidden="true" /> {t("nav.roadmap")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mt-1.5">{t("rd.title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{t("rd.subtitle")}</p>
      </header>

      <ol className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {PHASES.map((p, i) => {
          const Icon = p.Icon;
          return (
            <motion.li
              key={p.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative pl-14"
            >
              <div
                className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center bg-${p.color}/10 text-${p.color} border-2 ${
                  p.done ? `border-${p.color}` : "border-card"
                } shadow-card`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="card-elevated p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs uppercase tracking-widest font-bold" style={{ color: `hsl(var(--${p.color}))` }}>
                    {t(p.titleKey)}
                  </div>
                  {p.done && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-risk-low/10 text-risk-low">
                      {locale === "es" ? "Hecho" : "Shipped"}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {locale === "es" ? p.windowEs : p.windowEn}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {p.bullets.map((b, j) => (
                    <li key={j} className="text-sm flex gap-2">
                      <span className="text-primary mt-0.5" aria-hidden="true">▸</span>
                      <span>{b[locale]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          );
        })}
      </ol>

      <section className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold">{t("rd.metricsTitle")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {METRICS.map((m, i) => {
            const Icon = m.Icon;
            return (
              <div key={i} className="rounded-xl border border-border p-4 bg-secondary/20">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {locale === "es" ? m.es : m.en}
                  </div>
                </div>
                <div className="text-xl font-bold mt-1.5 tabular-nums">{m.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.caption[locale]}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card-elevated p-6 bg-gradient-hero">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-spark/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-spark" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold">{t("rd.investTitle")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {INVEST.map((m, i) => {
            const Icon = m.Icon;
            return (
              <div key={i} className="rounded-xl bg-card/70 border border-border p-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-spark" aria-hidden="true" />
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {locale === "es" ? m.es : m.en}
                  </div>
                </div>
                <div className="text-xl font-bold mt-1.5">{m.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.caption[locale]}</div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">
          {locale === "es"
            ? "Modelo de costos preliminar para un piloto de dos condados; se ajustará con datos reales del despliegue."
            : "Preliminary cost model for a 2-county pilot; refined with real deployment data."}
        </p>
      </section>
    </div>
  );
}

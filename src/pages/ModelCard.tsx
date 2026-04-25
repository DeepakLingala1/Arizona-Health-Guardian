// Spark AZ — Model Card (judge-ready transparency)
import { useLocale } from "@/lib/i18n";
import {
  ShieldCheck, GitBranch, Cog, AlertTriangle, Users, Gauge, BarChart3, BookOpen, Network, ListChecks,
} from "lucide-react";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

export default function ModelCard() {
  const { t, locale } = useLocale();

  const sections = [
    {
      Icon: BookOpen, title: locale === "es" ? "Propósito" : "Purpose",
      body: locale === "es"
        ? "Spark AZ es un prototipo de vigilancia participativa Una Salud para Arizona que combina señales humanas, animales y ambientales auto-reportadas con datos abiertos de clima, calidad del aire y vectores para producir una puntuación de riesgo compuesto explicable a nivel individual y de condado."
        : "Spark AZ is a One Health participatory surveillance prototype for Arizona that fuses self-reported human, animal, and environmental signals with open weather, air quality, and vector data to produce an explainable composite risk score at the individual and county level.",
    },
    {
      Icon: GitBranch, title: locale === "es" ? "Versión del modelo" : "Model version",
      body: "v0.1 · deterministic composite scoring + k-means symptom clustering + Gemini 2.5 Flash for narrative.",
    },
    {
      Icon: Cog, title: locale === "es" ? "Cómo se calcula" : "How the score is computed",
      bullets: [
        locale === "es"
          ? "Línea base (20) + síntomas auto-reportados ponderados (fiebre/disnea = peso alto)."
          : "Baseline (20) + weighted self-reported symptoms (fever / shortness-of-breath = highest weight).",
        locale === "es"
          ? "Sub-puntuaciones por categoría: Humano, Animal, Vector, Ambiental — combinadas (0.45 / 0.20 / 0.15 / 0.20)."
          : "Per-category sub-scores: Human, Animal, Vector, Environmental — combined as 0.45 / 0.20 / 0.15 / 0.20.",
        locale === "es"
          ? "Modificadores por persona (ranchero + signos animales = peso adicional, etc.)."
          : "Persona modifiers (e.g. rancher + animal signs = extra weight; outdoor worker + extreme heat).",
        locale === "es"
          ? "Ajustes por condiciones crónicas (asma + AQI alto, diabetes + propagación comunitaria)."
          : "Chronic-condition adjustments (asthma × elevated AQI, diabetes × community spread).",
        locale === "es"
          ? "Decaimiento por recuperación (sin síntomas 3+ días → -10)."
          : "Recovery decay (no symptoms 3+ days → −10).",
        locale === "es"
          ? "Detección de clústeres por k-means en vectores binarios de síntomas (umbral mínimo 6 reportes)."
          : "Cluster detection via k-means on binary symptom vectors (min 6 reports threshold).",
      ],
    },
    {
      Icon: BarChart3, title: locale === "es" ? "Insumos de datos" : "Inputs",
      bullets: [
        locale === "es" ? "Reportes auto-anonimizados (humano / animal / ambiente)" : "Self-reported anonymous check-ins (human / animal / environment)",
        "Open-Meteo: " + (locale === "es" ? "clima por hora y AQI por condado" : "hourly weather + AQI per county"),
        locale === "es" ? "ADHS / CDC: condiciones de fondo" : "ADHS / CDC: background prevalence",
        locale === "es" ? "OpenSky: llegadas a PHX/TUS (sin clave)" : "OpenSky: PHX/TUS arrivals (no key)",
        locale === "es" ? "Demo EpiCore: señales globales tipo participativo" : "EpiCore-style demo signals for global pathway matching",
        locale === "es" ? "Geometría de condados: TIGER simplificada" : "County geometry: simplified TIGER GeoJSON",
      ],
    },
    {
      Icon: ShieldCheck, title: locale === "es" ? "Privacidad y ética" : "Privacy & ethics",
      bullets: [
        locale === "es" ? "Sin PII recopilada. Autenticación anónima." : "No PII collected. Anonymous authentication.",
        locale === "es" ? "Datos vinculados sólo al ID anónimo y al condado." : "Data linked only to an anonymous user ID and county.",
        locale === "es" ? "RLS estricto: cada persona sólo ve sus propios reportes." : "Strict Row-Level Security: each user only sees their own check-ins.",
        locale === "es" ? "Las alertas IA NUNCA se publican sin revisión humana (HITL)." : "AI-generated alerts NEVER publish without human-in-the-loop review.",
        locale === "es" ? "Soporte bilingüe EN/ES en todas las páginas." : "Bilingual EN/ES support on every page.",
      ],
    },
    {
      Icon: Users, title: locale === "es" ? "HITL & gobernanza" : "HITL & governance",
      body: locale === "es"
        ? "Spark AZ genera alertas en estado pending. Los analistas de salud pública (rol analyst) pueden aprobar, editar o rechazar antes de la publicación. Cada acción se audita en review_log."
        : "Spark AZ generates alerts in a pending state. Public-health analysts (analyst role) can approve, edit, or reject before publication. Every action is audited in review_log with before/after snapshots.",
    },
    {
      Icon: AlertTriangle, title: locale === "es" ? "Limitaciones" : "Limitations",
      bullets: [
        locale === "es" ? "Datos sintéticos para la demo (~800 reportes) — no es vigilancia real." : "Synthetic seed data (~800 reports) for the demo — this is not live surveillance.",
        locale === "es" ? "El modelo es determinístico; no aprende de retroalimentación todavía." : "The model is deterministic; it does not learn from feedback yet.",
        locale === "es" ? "Sub-cobertura conocida en condados rurales/tribales con baja participación." : "Known under-coverage in rural / tribal counties with low participation.",
        locale === "es" ? "La narrativa IA es un complemento — no reemplaza el juicio clínico ni de salud pública." : "AI narrative is a supplement — it does not replace clinical or public-health judgment.",
        locale === "es" ? "Las llegadas OpenSky pueden no incluir tráfico privado de bajo nivel." : "OpenSky arrivals may miss low-altitude or private traffic.",
      ],
    },
    {
      Icon: Gauge, title: locale === "es" ? "Métricas previstas (post-piloto)" : "Planned metrics (post-pilot)",
      bullets: [
        locale === "es" ? "Tiempo de detección: días entre primer pico de señal y confirmación oficial" : "Detection lead-time: days between first signal spike and official confirmation",
        locale === "es" ? "Precisión / recall a nivel de alerta vs. brotes documentados" : "Alert-level precision / recall vs. documented outbreaks",
        locale === "es" ? "Cobertura: % de condados con ≥10 reportes/semana" : "Coverage: % of counties with ≥10 reports / week",
        locale === "es" ? "Equidad: tasa de cobertura en condados rurales vs. urbanos" : "Equity: coverage rate in rural vs. urban counties",
      ],
    },
  ];

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
        <ShieldCheck className="w-3.5 h-3.5" /> {t("mc.title")}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{t("mc.subtitle")}</h1>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          ["v0.1", "Model"],
          ["15", locale === "es" ? "Condados" : "Counties"],
          ["EN/ES", locale === "es" ? "Idiomas" : "Languages"],
          ["HITL", "Governance"],
          ["Open-Meteo", "Live data"],
          ["Gemini 2.5 Flash", "AI"],
        ].map(([k, v]) => (
          <div key={k} className="card-elevated p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{v}</div>
            <div className="font-bold mt-0.5">{k}</div>
          </div>
        ))}
      </div>

      {/* Architecture diagram */}
      <section className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{locale === "es" ? "Arquitectura del sistema" : "System architecture"}</h2>
        </div>
        <ArchitectureDiagram />
      </section>

      {sections.map((s, i) => {
        const Icon = s.Icon;
        return (
          <section key={i} className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            {s.body && <p className="text-sm leading-relaxed text-foreground/85">{s.body}</p>}
            {s.bullets && (
              <ul className="space-y-2 mt-1">
                {s.bullets.map((b, j) => (
                  <li key={j} className="text-sm flex gap-2">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {/* Rubric alignment */}
      <section className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ListChecks className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{locale === "es" ? "Alineación con la rúbrica" : "Rubric alignment"}</h2>
        </div>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  {locale === "es" ? "Criterio" : "Criterion"}
                </th>
                <th className="py-2 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  {locale === "es" ? "Cómo Spark AZ lo cubre" : "How Spark AZ delivers"}
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr]:border-b [&_tr]:border-border/60 [&_td]:py-2.5 [&_td]:align-top">
              <tr>
                <td className="pr-3 font-semibold">{locale === "es" ? "Una Salud" : "One Health"}</td>
                <td className="px-3 text-foreground/85">{locale === "es" ? "Reportes humanos + animales + ambientales unidos en un solo puntaje compuesto y mapa." : "Human + animal + environmental check-ins fused into one composite score and map."}</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold">{locale === "es" ? "Datos abiertos" : "Open data"}</td>
                <td className="px-3 text-foreground/85">Open-Meteo (wx + AQI), OpenSky (arrivals), TIGER (county geometry), ADHS/CDC reference, EpiCore-style demo feed.</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold">{locale === "es" ? "IA explicable" : "Explainable AI"}</td>
                <td className="px-3 text-foreground/85">{locale === "es" ? "Panel XAI con barras por impulsor, tooltips por categoría y narrativa Gemini con citas." : "XAI panel with per-driver bars, category tooltips, and Gemini narrative citing inputs."}</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold">HITL</td>
                <td className="px-3 text-foreground/85">{locale === "es" ? "Cola de revisión analista (aprobar / editar / rechazar) con auditoría completa." : "Analyst review queue (approve / edit / reject) with full audit log of every action."}</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold">{locale === "es" ? "Equidad" : "Equity"}</td>
                <td className="px-3 text-foreground/85">{locale === "es" ? "Bilingüe EN/ES, los 15 condados de AZ, móvil primero, autenticación anónima sin PII." : "Bilingual EN/ES, all 15 AZ counties, mobile-first, anonymous auth, no PII collected."}</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold">{locale === "es" ? "Detección temprana" : "Early detection"}</td>
                <td className="px-3 text-foreground/85">{locale === "es" ? "Detección de clústeres k-means + simulador + vigilancia de importación por viaje." : "k-means symptom clustering + travel-import watch + simulator for what-if exposure."}</td>
              </tr>
              <tr>
                <td className="pr-3 font-semibold">{locale === "es" ? "Transparencia" : "Transparency"}</td>
                <td className="px-3 text-foreground/85">{locale === "es" ? "Esta ficha del modelo + página de fuentes de datos + diagrama de arquitectura." : "This model card + data sources page + architecture diagram, all linked from every screen."}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-xs text-muted-foreground text-center pt-4">
        Spark AZ is an academic prototype for the University of Arizona Ending Pandemics Academy "Spot the Spark" Challenge — May 2026.
      </div>
    </div>
  );
}

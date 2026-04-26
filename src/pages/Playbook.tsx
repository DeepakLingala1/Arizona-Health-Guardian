// Spark AZ — AZ Use-case Playbook (rubric requirement: "explain how the tool would be used in Arizona")
import { motion } from "framer-motion";
import {
  Building2, Tent, Globe2, ArrowRight, Sparkles, ShieldCheck, Bell,
  ClipboardCheck, MapPin, Users, AlertTriangle, Stethoscope, PawPrint, Plane,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface Step {
  day: string;
  who: { en: string; es: string };
  whoIcon: typeof Users;
  what: { en: string; es: string };
}

interface Story {
  id: string;
  Icon: typeof Building2;
  color: string;
  titleKey: string;
  scenario: { en: string; es: string };
  region: string;
  steps: Step[];
  outcome: { en: string; es: string };
}

const STORIES: Story[] = [
  {
    id: "county",
    Icon: Building2,
    color: "primary",
    titleKey: "pb.county.title",
    region: "Maricopa County",
    scenario: {
      en: "West Nile precursor: dead birds + mosquito index spiking in south Phoenix in late monsoon.",
      es: "Precursor del Nilo Occidental: aves muertas + alto índice de mosquitos al sur de Phoenix en fin de monzón.",
    },
    steps: [
      { day: "1",
        whoIcon: PawPrint,
        who: { en: "Residents (rancher / parent persona)", es: "Residentes (perfil ranchero / padre)" },
        what: {
          en: "Self-report: dead-bird cluster + high mosquito activity + standing water near three south Phoenix ZIPs.",
          es: "Reporte: aves muertas + alta actividad de mosquitos + agua estancada en tres códigos postales del sur de Phoenix.",
        } },
      { day: "1–2",
        whoIcon: Sparkles,
        who: { en: "Spark AZ engine", es: "Motor Spark AZ" },
        what: {
          en: "County-aggregator + k-means cluster detection raises Maricopa vector_score from 18 → 64. Composite crosses the 65-elevated threshold; AI generates a draft alert in pending state.",
          es: "Agregador + clústeres k-means elevan vector_score de Maricopa 18 → 64. El compuesto cruza el umbral 65; la IA genera una alerta en estado pendiente.",
        } },
      { day: "2",
        whoIcon: ShieldCheck,
        who: { en: "MCDPH analyst on review desk", es: "Analista MCDPH en escritorio de revisión" },
        what: {
          en: "Reviews the draft, edits the title to reference specific ZIPs, approves. Audit log captures before/after + reviewer ID.",
          es: "Revisa el borrador, edita el título para incluir códigos postales, aprueba. El registro de auditoría guarda antes/después + ID del revisor.",
        } },
      { day: "2",
        whoIcon: Bell,
        who: { en: "Maricopa residents in affected ZIPs", es: "Residentes de Maricopa en códigos afectados" },
        what: {
          en: "Receive realtime banner + push notification in EN or ES. Asthma & senior personas get an extra advisory line.",
          es: "Reciben banner en tiempo real + notificación push en EN o ES. Perfiles asma y adulto mayor reciben línea adicional.",
        } },
      { day: "3",
        whoIcon: Stethoscope,
        who: { en: "MCDPH Vector Control", es: "Control de Vectores MCDPH" },
        what: {
          en: "Schedules same-week ovitrap inspection at flagged ZIPs. Spark AZ tracks return-to-baseline.",
          es: "Programa inspección de ovitrampas en la semana en códigos señalados. Spark AZ rastrea el retorno a línea base.",
        } },
    ],
    outcome: {
      en: "Detection ~7 days ahead of typical lab-confirmation pathway. Vector Control acts on a precursor signal, not a confirmed case.",
      es: "Detección ~7 días antes de la vía típica de confirmación. Control de Vectores actúa sobre una señal precursora, no un caso confirmado.",
    },
  },
  {
    id: "tribal",
    Icon: Tent,
    color: "earth",
    titleKey: "pb.tribal.title",
    region: "Apache / Navajo Counties",
    scenario: {
      en: "Hantavirus precursor: rodent activity + sick livestock reports clustering on remote tribal lands during wet spring.",
      es: "Precursor de Hantavirus: actividad de roedores + ganado enfermo agrupándose en tierras tribales remotas en primavera húmeda.",
    },
    steps: [
      { day: "1",
        whoIcon: Users,
        who: { en: "Tribal-community member (tribal persona)", es: "Miembro comunidad tribal (perfil tribal)" },
        what: {
          en: "Submits a report via SMS (or web): 'rodent activity + sick livestock' near a hogan cluster. Persona modifier adds remote-county weight.",
          es: "Envía un reporte por SMS (o web): 'roedores + ganado enfermo' cerca de un grupo de hogans. El modificador del perfil añade peso de condado remoto.",
        } },
      { day: "1–3",
        whoIcon: Sparkles,
        who: { en: "Spark AZ engine", es: "Motor Spark AZ" },
        what: {
          en: "Detects a 3-report animal cluster in Apache; persona × remote-county modifier boosts visibility despite low absolute volume.",
          es: "Detecta clúster de 3 reportes animales en Apache; el modificador perfil × condado remoto aumenta la visibilidad pese a poco volumen absoluto.",
        } },
      { day: "3",
        whoIcon: ShieldCheck,
        who: { en: "Tribal liaison + ADHS analyst", es: "Enlace tribal + analista ADHS" },
        what: {
          en: "Co-review the draft. Edit it in the analyst's voice, approve with a note: 'Rodent-clean-out reminders only — avoid stigmatizing language.'",
          es: "Co-revisan el borrador. Lo editan, aprueban con nota: 'Recordatorios de limpieza de roedores — evitar lenguaje estigmatizante.'",
        } },
      { day: "3",
        whoIcon: Bell,
        who: { en: "Local clinic + community", es: "Clínica local + comunidad" },
        what: {
          en: "Hantavirus messaging goes out via SMS + radio + clinic. Veterinarian outreach to inspect livestock.",
          es: "Mensajería sobre Hantavirus por SMS + radio + clínica. Veterinario revisa el ganado.",
        } },
    ],
    outcome: {
      en: "Spark AZ closes a known coverage gap by weighting low-volume signals from remote tribal counties higher — without diluting alerts elsewhere.",
      es: "Spark AZ cierra una brecha conocida ponderando más alto las señales de bajo volumen en condados tribales remotos — sin diluir alertas en otros lugares.",
    },
  },
  {
    id: "border",
    Icon: Globe2,
    color: "spark",
    titleKey: "pb.border.title",
    region: "Santa Cruz & Yuma Counties",
    scenario: {
      en: "Travel-import: dengue uptick in northern Sonora; cross-border travelers begin reporting fever + GI in Yuma.",
      es: "Importación: aumento de dengue en norte de Sonora; viajeros transfronterizos reportan fiebre + GI en Yuma.",
    },
    steps: [
      { day: "0",
        whoIcon: Globe2,
        who: { en: "EpiCore feed", es: "Feed EpiCore" },
        what: {
          en: "Confirms dengue cluster in Sonora, MX (severity 3, pathway: travel).",
          es: "Confirma brote de dengue en Sonora, MX (severidad 3, vía: viaje).",
        } },
      { day: "1",
        whoIcon: Plane,
        who: { en: "OpenSky + travel-import joiner", es: "OpenSky + enlazador de importación" },
        what: {
          en: "Last-24h KPHX/KTUS arrivals from MMHO (Hermosillo) match the Sonora dengue signal.",
          es: "Llegadas últimas 24h KPHX/KTUS desde MMHO (Hermosillo) coinciden con señal Sonora.",
        } },
      { day: "2",
        whoIcon: ClipboardCheck,
        who: { en: "Border-region residents (border persona)", es: "Residentes fronterizos (perfil fronterizo)" },
        what: {
          en: "5 self-reports include fever + recent travel to Sonora. Persona × travel-import modifier triggers a Yuma watch.",
          es: "5 reportes incluyen fiebre + viaje reciente a Sonora. Perfil × importación dispara vigilancia en Yuma.",
        } },
      { day: "2",
        whoIcon: ShieldCheck,
        who: { en: "Yuma County DPH analyst", es: "Analista DPH del Condado de Yuma" },
        what: {
          en: "Approves a clinician-targeted advisory: 'Consider dengue in returning travelers, Yuma–Sonora corridor.'",
          es: "Aprueba un aviso para médicos: 'Considerar dengue en viajeros que regresan, corredor Yuma–Sonora.'",
        } },
      { day: "2–3",
        whoIcon: Stethoscope,
        who: { en: "Border clinics", es: "Clínicas fronterizas" },
        what: {
          en: "Update intake screening and patient-education flyer (EN/ES) within 24 hrs.",
          es: "Actualizan triage y volante de educación al paciente (EN/ES) en menos de 24h.",
        } },
    ],
    outcome: {
      en: "Cross-border signal turns into a clinician-ready advisory before the first lab confirmation. EN/ES + persona-aware delivery is what makes it actionable.",
      es: "Señal transfronteriza se convierte en aviso para médicos antes de la primera confirmación de laboratorio. EN/ES + entrega por perfil es lo que la hace accionable.",
    },
  },
];

export default function Playbook() {
  const { t, locale } = useLocale();

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {t("nav.playbook")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mt-1.5">{t("pb.title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{t("pb.subtitle")}</p>
      </header>

      <nav className="grid sm:grid-cols-3 gap-3" aria-label={t("nav.playbook")}>
        {STORIES.map((s) => {
          const Icon = s.Icon;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="card-elevated p-4 hover:shadow-glow transition-shadow group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${s.color}/10 text-${s.color} mb-2`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="font-semibold text-sm">{t(s.titleKey)}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.region}</div>
            </a>
          );
        })}
      </nav>

      {STORIES.map((s) => {
        const Icon = s.Icon;
        return (
          <section
            key={s.id}
            id={s.id}
            className="card-elevated p-6 sm:p-7 scroll-mt-24"
            aria-labelledby={`${s.id}-title`}
          >
            <header className="flex items-start gap-4 mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${s.color}/10 text-${s.color} shrink-0`}>
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id={`${s.id}-title`} className="text-xl sm:text-2xl font-bold leading-tight">
                  {t(s.titleKey)}
                </h2>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                  {s.region}
                </div>
                <div className="mt-2 inline-flex items-start gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-spark mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      {t("pb.useCaseLabel")}:
                    </span>{" "}
                    {s.scenario[locale]}
                  </span>
                </div>
              </div>
            </header>

            <ol className="relative space-y-4 sm:pl-2">
              {s.steps.map((step, i) => {
                const WhoIcon = step.whoIcon;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-[auto_1fr] gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        {t("pb.day")}
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center bg-${s.color}/10 text-${s.color} font-bold text-sm tabular-nums shrink-0 mt-0.5`}
                      >
                        {step.day}
                      </div>
                      {i < s.steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1.5 min-h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-semibold">
                        <WhoIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        {step.who[locale]}
                      </div>
                      <div className="text-sm mt-1.5 leading-relaxed">{step.what[locale]}</div>
                    </div>
                  </motion.li>
                );
              })}
            </ol>

            <footer className="mt-6 pt-5 border-t border-border flex items-start gap-3 rounded-b-xl">
              <ArrowRight className={`w-4 h-4 text-${s.color} mt-0.5 shrink-0`} aria-hidden="true" />
              <div>
                <div className="text-xs uppercase tracking-wider font-bold" style={{ color: `hsl(var(--${s.color}))` }}>
                  {t("pb.outcomeLabel")}
                </div>
                <p className="text-sm text-foreground/85 mt-1 leading-relaxed">{s.outcome[locale]}</p>
              </div>
            </footer>
          </section>
        );
      })}

      <section className="card-elevated p-6 border-l-4 border-l-primary">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          {locale === "es" ? "Por qué Arizona, por qué ahora" : "Why Arizona, why now"}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            { en: "All 15 counties span border, urban, rural, and tribal contexts in one state — a near-perfect testbed for participatory One Health.", es: "Los 15 condados abarcan contextos fronterizo, urbano, rural y tribal — un campo de prueba casi perfecto para vigilancia Una Salud participativa." },
            { en: "Arizona-specific threats (Valley Fever, WNV, Hantavirus, monsoon respiratory surges, dust, smoke, border-import) require a fused human + animal + environmental signal — not isolated disease surveillance.", es: "Las amenazas específicas (Fiebre del Valle, VNO, Hantavirus, picos respiratorios de monzón, polvo, humo, importación fronteriza) requieren señales humano + animal + ambiental — no vigilancia aislada por enfermedad." },
            { en: "Existing infrastructure (ADHS, county DPHs, UA Ending Pandemics Academy, tribal health programs) means Spark AZ can plug into review desks rather than build them from scratch.", es: "Infraestructura existente (ADHS, DPH de condado, Academia, programas tribales) permite que Spark AZ conecte con escritorios analistas existentes." },
            { en: "Bilingual EN/ES coverage from day 0 — not a v2 patch — addresses the largest underserved population in the state.", es: "Cobertura bilingüe EN/ES desde el día 0 — no un parche v2 — cubre la mayor población subatendida del estado." },
          ].map((row, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary mt-0.5" aria-hidden="true">▸</span>
              <span>{row[locale]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Spark AZ — bilingual dictionary (en / es)
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Locale = "en" | "es";

type Dict = Record<string, string>;

const en: Dict = {
  // brand
  "app.name": "Spark AZ",
  "app.tagline": "Spot the spark before it becomes a fire.",
  "app.subtitle": "One Health · Arizona",

  // nav
  "nav.home": "Home",
  "nav.checkin": "Check-in",
  "nav.map": "Map",
  "nav.insights": "Insights",
  "nav.simulator": "Simulator",
  "nav.admin": "Admin console",
  "nav.review": "Review queue",
  "nav.modelCard": "Model card",
  "nav.dataSources": "Data sources",
  "nav.profile": "Profile",
  "nav.roadmap": "Roadmap",
  "nav.playbook": "AZ Playbook",
  "nav.more": "More",
  "nav.language": "Language",
  "nav.search": "Search · ⌘K",

  // common
  "common.county": "County",
  "common.today": "Today",
  "common.loading": "Loading…",
  "common.continue": "Continue",
  "common.back": "Back",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.submit": "Submit",
  "common.optional": "Optional",
  "common.skip": "Skip",
  "common.viewAll": "View all",

  // risk bands
  "band.Low": "Low",
  "band.Moderate": "Moderate",
  "band.Elevated": "Elevated",
  "band.High": "High",

  // home
  "home.todayRisk": "Your risk today",
  "home.noCheckin": "No check-in yet today",
  "home.checkinCta": "Check in now",
  "home.aiInsight": "AI insight",
  "home.drivers": "What's driving this score",
  "home.signals": "One Health signals",
  "home.signal.human": "Human",
  "home.signal.animal": "Animal",
  "home.signal.vector": "Vector",
  "home.signal.environment": "Environment",
  "home.trend": "7-day trend",
  "home.youVsCounty": "You vs your county",
  "home.alertActive": "Active alert in your county",

  // check-in
  "checkin.title": "One Health check-in",
  "checkin.subtitle": "Report what you're seeing in yourself, your animals, and your environment.",
  "checkin.tab.self": "Self",
  "checkin.tab.animal": "Animals",
  "checkin.tab.environment": "Environment",
  "checkin.fineToday": "I'm fine today",
  "checkin.mood": "How are you feeling?",
  "checkin.symptoms": "Any symptoms?",
  "checkin.exposure": "Known exposure to someone sick",
  "checkin.travel": "Recent travel (last 7 days)",
  "checkin.travelTo": "Where to?",
  "checkin.animalType": "Type of animal",
  "checkin.animalSigns": "Signs you observed",
  "checkin.animalCount": "How many animals?",
  "checkin.envSignals": "What did you notice in your environment?",
  "checkin.notes": "Notes (optional)",
  "checkin.submitted": "Check-in saved. Thank you for contributing.",
  "checkin.streak": "Day streak",

  // onboarding
  "onb.welcome": "Welcome to Spark AZ",
  "onb.welcomeBody": "A One Health surveillance prototype for Arizona. Help us spot outbreaks early — anonymously.",
  "onb.lang": "Choose your language",
  "onb.persona": "Which best describes you?",
  "onb.county": "Where in Arizona do you live?",
  "onb.optional": "A bit about you (optional)",
  "onb.ageBand": "Age range",
  "onb.conditions": "Existing conditions",
  "onb.start": "Start using Spark AZ",

  // map
  "map.title": "Arizona One Health map",
  "map.layer.composite": "Composite",
  "map.layer.human": "Human",
  "map.layer.animal": "Animal",
  "map.layer.vector": "Vector",
  "map.layer.env": "Environmental",

  // insights
  "insights.title": "Insights",
  "insights.digest": "Weekly AI digest",
  "insights.clusters": "Detected clusters",
  "insights.epicore": "Global signals (EpiCore)",
  "insights.travel": "Travel import watch",

  // simulator
  "sim.title": "Travel & activity simulator",
  "sim.origin": "Origin county",
  "sim.dest": "Destination county",
  "sim.duration": "Days",
  "sim.activity": "Primary activity",
  "sim.run": "Run simulation",
  "sim.delta": "Projected risk change",

  // review
  "review.title": "Alert review queue",
  "review.subtitle": "Approve, edit, or reject AI-generated alerts before they reach the public.",
  "review.approve": "Approve",
  "review.edit": "Edit",
  "review.reject": "Reject",
  "review.empty": "No pending alerts. The system is quiet right now.",

  // admin
  "admin.title": "Admin console",
  "admin.subtitle": "Protected analyst workspace for alert review, publishing decisions, and audit history.",
  "admin.lockedTitle": "Admin console requires analyst access",
  "admin.lockedBody": "Resident and shared pages stay open, but approving, editing, rejecting, and auditing public alerts is restricted to the analyst role.",
  "admin.currentRole": "Current role",
  "admin.requiredRole": "Required role",
  "admin.demoAccess": "Enable demo analyst access",
  "admin.demoHint": "For production, this role should be assigned through an organization admin or identity provider.",
  "admin.roleVerified": "Role verified",
  "admin.reviewMetric": "Approve, edit, or reject pending alerts.",
  "admin.rlsProtected": "Role policies active",
  "admin.rlsMetric": "Pending alerts and logs require analyst access.",
  "admin.auditReady": "Audit log enabled",
  "admin.auditMetric": "Every review action keeps before and after context.",

  // model card
  "mc.title": "Model card",
  "mc.subtitle": "Spark AZ Composite Risk Model v0.1",

  // ds
  "ds.title": "Data sources & methodology",

  // onboarding
  "onb.step": "Step",
  "onb.of": "of",
  "onb.next": "Next",
  "onb.back": "Back",
  "onb.finish": "Finish setup",
  "onb.welcomeTitle": "Welcome to Spark AZ",
  "onb.welcomeBody2": "A One Health early-warning prototype for Arizona. Your anonymous reports — yours, your animals', your environment's — feed a county-level risk score that's reviewed by a public-health analyst before any alert reaches the public.",
  "onb.privacy.t1": "No PII is collected. Your account is anonymous.",
  "onb.privacy.t2": "Reports are linked only to a county and an anonymous ID.",
  "onb.privacy.t3": "Every AI-generated alert is reviewed by a human before publication.",
  "onb.personaPick": "Pick the role that best fits you",
  "onb.personaHelp": "We use this to weight what matters most for your daily risk read. You can change it any time in Profile.",
  "onb.locationTitle": "Where you are, what we should know",
  "onb.locationHelp": "We use county only — never an exact location.",
  "onb.ageOptional": "Age range (optional)",
  "onb.allSet": "You're all set",
  "onb.allSetBody": "Your daily Spark AZ read is ready. Submit your first check-in to personalize it.",
  "onb.firstCheckin": "Submit my first check-in",
  "onb.skipToHome": "Take me to the dashboard",

  // roadmap
  "rd.title": "Roadmap",
  "rd.subtitle": "From hackathon prototype to statewide One Health surveillance",
  "rd.now": "Now (May 2026)",
  "rd.q3": "Q3 2026 — Pilot",
  "rd.q4": "Q4 2026 — Partnerships",
  "rd.q1": "Q1 2027 — Scale",
  "rd.beyond": "2027+ — Beyond",
  "rd.metricsTitle": "What we'll measure during pilot",
  "rd.investTitle": "What it would take to operate at AZ scale",

  // playbook
  "pb.title": "How Spark AZ works in Arizona",
  "pb.subtitle": "Three real workflows: county health department, tribal community, border clinic.",
  "pb.county.title": "Maricopa County Department of Public Health",
  "pb.tribal.title": "Apache / Navajo tribal community health",
  "pb.border.title": "Santa Cruz / Yuma border clinic",
  "pb.day": "Day",
  "pb.useCaseLabel": "Use case",
  "pb.outcomeLabel": "Outcome",

  // dashboard additions
  "home.trend7": "7-day trend",
  "home.trendEmpty": "Not enough data yet — keep checking in.",
  "home.contribution": "Your county's contribution",
  "home.contribReports": "reports today",
  "home.contribTarget": "target for signal detection",
  "home.contribAddOne": "Add yours →",
  "home.realtime.newAlert": "New alert in",

  // review queue
  "review.export": "Export CSV",
  "review.exported": "Exported",

  // command palette
  "cmd.placeholder": "Jump to a county, page, or scenario…",
  "cmd.empty": "Nothing matches.",
  "cmd.section.pages": "Pages",
  "cmd.section.counties": "Arizona counties",
  "cmd.section.scenarios": "Demo scenarios",
  "cmd.section.actions": "Actions",
  "cmd.toggleTheme": "Toggle dark / light theme",
  "cmd.toggleLocale": "Switch language (EN / ES)",
  "cmd.runCheckin": "Open the daily check-in",

  // empty states
  "empty.alerts": "No pending alerts. The system is quiet right now.",
  "empty.county": "Click a county on the map.",
  "empty.clusters": "No clusters detected yet — the system is warming up.",

  // auth / account dropdown
  "auth.account": "Account",
  "auth.anonId": "Anonymous ID",
  "auth.signOut": "Sign out",
  "auth.signOutHint": "Ends this anonymous session and starts a fresh one.",
  "auth.signOutConfirm": "Sign out and reset this session? Your check-ins will stay in the dataset but will no longer be linked to you.",
};

const es: Dict = {
  "app.name": "Spark AZ",
  "app.tagline": "Detecta la chispa antes de que se vuelva incendio.",
  "app.subtitle": "Una Salud · Arizona",

  "nav.home": "Inicio",
  "nav.checkin": "Reporte",
  "nav.map": "Mapa",
  "nav.insights": "Análisis",
  "nav.simulator": "Simulador",
  "nav.admin": "Consola admin",
  "nav.review": "Revisión",
  "nav.modelCard": "Ficha del modelo",
  "nav.dataSources": "Fuentes de datos",
  "nav.profile": "Perfil",
  "nav.roadmap": "Hoja de ruta",
  "nav.playbook": "Manual AZ",
  "nav.more": "Más",
  "nav.language": "Idioma",
  "nav.search": "Buscar · ⌘K",

  "common.county": "Condado",
  "common.today": "Hoy",
  "common.loading": "Cargando…",
  "common.continue": "Continuar",
  "common.back": "Atrás",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.submit": "Enviar",
  "common.optional": "Opcional",
  "common.skip": "Omitir",
  "common.viewAll": "Ver todo",

  "band.Low": "Bajo",
  "band.Moderate": "Moderado",
  "band.Elevated": "Elevado",
  "band.High": "Alto",

  "home.todayRisk": "Tu riesgo hoy",
  "home.noCheckin": "Aún no hay reporte de hoy",
  "home.checkinCta": "Reportar ahora",
  "home.aiInsight": "Análisis IA",
  "home.drivers": "Qué impulsa esta puntuación",
  "home.signals": "Señales Una Salud",
  "home.signal.human": "Humano",
  "home.signal.animal": "Animal",
  "home.signal.vector": "Vector",
  "home.signal.environment": "Ambiente",
  "home.trend": "Tendencia de 7 días",
  "home.youVsCounty": "Tú vs tu condado",
  "home.alertActive": "Alerta activa en tu condado",

  "checkin.title": "Reporte Una Salud",
  "checkin.subtitle": "Reporta lo que ves en ti, tus animales y tu entorno.",
  "checkin.tab.self": "Yo",
  "checkin.tab.animal": "Animales",
  "checkin.tab.environment": "Ambiente",
  "checkin.fineToday": "Hoy estoy bien",
  "checkin.mood": "¿Cómo te sientes?",
  "checkin.symptoms": "¿Algún síntoma?",
  "checkin.exposure": "Contacto conocido con alguien enfermo",
  "checkin.travel": "Viajes recientes (últimos 7 días)",
  "checkin.travelTo": "¿A dónde?",
  "checkin.animalType": "Tipo de animal",
  "checkin.animalSigns": "Signos que observaste",
  "checkin.animalCount": "¿Cuántos animales?",
  "checkin.envSignals": "¿Qué notaste en tu entorno?",
  "checkin.notes": "Notas (opcional)",
  "checkin.submitted": "Reporte guardado. Gracias por contribuir.",
  "checkin.streak": "Días seguidos",

  "onb.welcome": "Bienvenido a Spark AZ",
  "onb.welcomeBody": "Un prototipo de vigilancia Una Salud para Arizona. Ayúdanos a detectar brotes temprano, de forma anónima.",
  "onb.lang": "Elige tu idioma",
  "onb.persona": "¿Cuál te describe mejor?",
  "onb.county": "¿Dónde vives en Arizona?",
  "onb.optional": "Un poco sobre ti (opcional)",
  "onb.ageBand": "Rango de edad",
  "onb.conditions": "Condiciones existentes",
  "onb.start": "Comenzar a usar Spark AZ",

  "map.title": "Mapa Una Salud de Arizona",
  "map.layer.composite": "Compuesto",
  "map.layer.human": "Humano",
  "map.layer.animal": "Animal",
  "map.layer.vector": "Vector",
  "map.layer.env": "Ambiental",

  "insights.title": "Análisis",
  "insights.digest": "Resumen semanal IA",
  "insights.clusters": "Clústeres detectados",
  "insights.epicore": "Señales globales (EpiCore)",
  "insights.travel": "Vigilancia de importación",

  "sim.title": "Simulador de viaje y actividad",
  "sim.origin": "Condado de origen",
  "sim.dest": "Condado de destino",
  "sim.duration": "Días",
  "sim.activity": "Actividad principal",
  "sim.run": "Ejecutar simulación",
  "sim.delta": "Cambio proyectado en el riesgo",

  "review.title": "Cola de revision de alertas",
  "review.subtitle": "Aprueba, edita o rechaza alertas generadas por IA antes de publicarlas.",
  "review.approve": "Aprobar",
  "review.edit": "Editar",
  "review.reject": "Rechazar",
  "review.empty": "No hay alertas pendientes. Todo tranquilo ahora.",

  // admin
  "admin.title": "Consola admin",
  "admin.subtitle": "Espacio protegido para revision de alertas, decisiones de publicacion y auditoria.",
  "admin.lockedTitle": "La consola admin requiere acceso de analista",
  "admin.lockedBody": "Las paginas publicas y compartidas siguen abiertas, pero aprobar, editar, rechazar y auditar alertas publicas esta restringido al rol de analista.",
  "admin.currentRole": "Rol actual",
  "admin.requiredRole": "Rol requerido",
  "admin.demoAccess": "Activar acceso demo de analista",
  "admin.demoHint": "En produccion, este rol debe asignarse mediante un administrador de la organizacion o proveedor de identidad.",
  "admin.roleVerified": "Rol verificado",
  "admin.reviewMetric": "Aprueba, edita o rechaza alertas pendientes.",
  "admin.rlsProtected": "Politicas de rol activas",
  "admin.rlsMetric": "Alertas pendientes y logs requieren acceso de analista.",
  "admin.auditReady": "Auditoria habilitada",
  "admin.auditMetric": "Cada accion guarda contexto antes y despues.",

  "mc.title": "Ficha del modelo",
  "mc.subtitle": "Modelo de riesgo compuesto Spark AZ v0.1",

  "ds.title": "Fuentes de datos y metodología",

  // onboarding
  "onb.step": "Paso",
  "onb.of": "de",
  "onb.next": "Siguiente",
  "onb.back": "Atrás",
  "onb.finish": "Terminar configuración",
  "onb.welcomeTitle": "Bienvenido a Spark AZ",
  "onb.welcomeBody2": "Un prototipo de alerta temprana Una Salud para Arizona. Tus reportes anónimos — tuyos, de tus animales y de tu entorno — alimentan un puntaje de riesgo a nivel de condado, revisado por un analista de salud pública antes de cualquier alerta.",
  "onb.privacy.t1": "No se recopila PII. Tu cuenta es anónima.",
  "onb.privacy.t2": "Los reportes se vinculan solo a un condado y a un ID anónimo.",
  "onb.privacy.t3": "Cada alerta generada por IA es revisada por una persona antes de publicarse.",
  "onb.personaPick": "Elige el rol que mejor te describe",
  "onb.personaHelp": "Lo usamos para ponderar lo que más importa en tu lectura diaria de riesgo. Puedes cambiarlo en cualquier momento desde Perfil.",
  "onb.locationTitle": "Dónde estás y qué deberíamos saber",
  "onb.locationHelp": "Usamos solo el condado — nunca tu ubicación exacta.",
  "onb.ageOptional": "Rango de edad (opcional)",
  "onb.allSet": "¡Todo listo!",
  "onb.allSetBody": "Tu lectura diaria Spark AZ está lista. Envía tu primer reporte para personalizarla.",
  "onb.firstCheckin": "Enviar mi primer reporte",
  "onb.skipToHome": "Llévame al panel",

  // roadmap
  "rd.title": "Hoja de ruta",
  "rd.subtitle": "Del prototipo del hackathon a vigilancia Una Salud estatal",
  "rd.now": "Ahora (mayo 2026)",
  "rd.q3": "T3 2026 — Piloto",
  "rd.q4": "T4 2026 — Alianzas",
  "rd.q1": "T1 2027 — Escala",
  "rd.beyond": "2027+ — Más allá",
  "rd.metricsTitle": "Qué mediremos durante el piloto",
  "rd.investTitle": "Qué se necesita para operar a escala estatal",

  // playbook
  "pb.title": "Cómo funciona Spark AZ en Arizona",
  "pb.subtitle": "Tres flujos reales: departamento de salud del condado, comunidad tribal, clínica fronteriza.",
  "pb.county.title": "Departamento de Salud Pública de Maricopa",
  "pb.tribal.title": "Salud comunitaria tribal Apache / Navajo",
  "pb.border.title": "Clínica fronteriza Santa Cruz / Yuma",
  "pb.day": "Día",
  "pb.useCaseLabel": "Caso de uso",
  "pb.outcomeLabel": "Resultado",

  // dashboard additions
  "home.trend7": "Tendencia 7 días",
  "home.trendEmpty": "Aún no hay datos suficientes — sigue reportando.",
  "home.contribution": "Aporte de tu condado",
  "home.contribReports": "reportes hoy",
  "home.contribTarget": "meta para detección de señales",
  "home.contribAddOne": "Suma el tuyo →",
  "home.realtime.newAlert": "Nueva alerta en",

  // review queue
  "review.export": "Exportar CSV",
  "review.exported": "Exportado",

  // command palette
  "cmd.placeholder": "Salta a un condado, página o escenario…",
  "cmd.empty": "Nada coincide.",
  "cmd.section.pages": "Páginas",
  "cmd.section.counties": "Condados de Arizona",
  "cmd.section.scenarios": "Escenarios de demo",
  "cmd.section.actions": "Acciones",
  "cmd.toggleTheme": "Cambiar tema oscuro / claro",
  "cmd.toggleLocale": "Cambiar idioma (EN / ES)",
  "cmd.runCheckin": "Abrir el reporte diario",

  // empty states
  "empty.alerts": "No hay alertas pendientes. Todo tranquilo ahora.",
  "empty.county": "Toca un condado en el mapa.",
  "empty.clusters": "Aún no hay clústeres detectados — el sistema se está preparando.",

  // auth / account dropdown
  "auth.account": "Cuenta",
  "auth.anonId": "ID anónimo",
  "auth.signOut": "Cerrar sesión",
  "auth.signOutHint": "Finaliza esta sesión anónima e inicia una nueva.",
  "auth.signOutConfirm": "¿Cerrar sesión y reiniciar? Tus reportes permanecerán en el dataset pero ya no estarán vinculados a ti.",
};

const DICTS: Record<Locale, Dict> = { en, es };

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  setLocale: () => {},
  t: (k) => k,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("spark.locale") as Locale) || "en";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("spark.locale", l);
    document.documentElement.lang = l;
    // Also persist to profile if logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("profiles").update({ language: l }).eq("id", data.user.id);
      }
    });
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Hydrate from profile on mount (after auth)
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        supabase.from("profiles").select("language").eq("id", session.user.id).maybeSingle().then(({ data }) => {
          if (data?.language && data.language !== locale) {
            setLocaleState(data.language as Locale);
            localStorage.setItem("spark.locale", data.language);
          }
        });
      }
    });
    return () => sub.data.subscription.unsubscribe();
  }, []); // eslint-disable-line

  const t = (key: string) => DICTS[locale][key] ?? DICTS.en[key] ?? key;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);

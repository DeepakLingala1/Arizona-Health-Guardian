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
  "nav.review": "Review queue",
  "nav.modelCard": "Model card",
  "nav.dataSources": "Data sources",
  "nav.profile": "Profile",
  "nav.more": "More",
  "nav.language": "Language",

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
  "review.title": "Analyst review queue",
  "review.subtitle": "Approve, edit, or reject AI-generated alerts before they reach the public.",
  "review.approve": "Approve",
  "review.edit": "Edit",
  "review.reject": "Reject",
  "review.empty": "No pending alerts. The system is quiet right now.",

  // model card
  "mc.title": "Model card",
  "mc.subtitle": "Spark AZ Composite Risk Model v0.1",

  // ds
  "ds.title": "Data sources & methodology",
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
  "nav.review": "Revisión",
  "nav.modelCard": "Ficha del modelo",
  "nav.dataSources": "Fuentes de datos",
  "nav.profile": "Perfil",
  "nav.more": "Más",
  "nav.language": "Idioma",

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

  "review.title": "Cola de revisión",
  "review.subtitle": "Aprueba, edita o rechaza alertas generadas por IA antes de publicarlas.",
  "review.approve": "Aprobar",
  "review.edit": "Editar",
  "review.reject": "Rechazar",
  "review.empty": "No hay alertas pendientes. Todo tranquilo ahora.",

  "mc.title": "Ficha del modelo",
  "mc.subtitle": "Modelo de riesgo compuesto Spark AZ v0.1",

  "ds.title": "Fuentes de datos y metodología",
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

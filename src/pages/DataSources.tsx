// Spark AZ — Data Sources page
import { useLocale } from "@/lib/i18n";
import { Cloud, Wind, Plane, Globe2, Map, Database, Sparkles, Shield } from "lucide-react";

export default function DataSources() {
  const { t, locale } = useLocale();

  const sources = [
    { Icon: Cloud, name: "Open-Meteo Weather", url: "https://open-meteo.com",
      desc: locale === "es" ? "Temperatura, humedad, precipitación por hora — sin clave." : "Hourly temperature, humidity, precipitation — no API key.",
      cat: "Environment" },
    { Icon: Wind, name: "Open-Meteo Air Quality", url: "https://open-meteo.com/en/docs/air-quality-api",
      desc: locale === "es" ? "AQI EE.UU., PM2.5/PM10, polvo y ozono por condado." : "US AQI, PM2.5/PM10, dust, ozone per county.",
      cat: "Environment" },
    { Icon: Plane, name: "OpenSky Network", url: "https://opensky-network.org",
      desc: locale === "es" ? "Llegadas a aeropuertos PHX/TUS (sin clave) para vigilancia de importación." : "PHX/TUS airport arrivals (no key) for travel-import watch.",
      cat: "Travel" },
    { Icon: Globe2, name: "EpiCore-style feed (demo)", url: "https://www.endingpandemics.org",
      desc: locale === "es" ? "Señales globales tipo participativo. Integración real disponible bajo solicitud." : "Global participatory-style signals. Demo data — real EpiCore integration available on request.",
      cat: "Global signals" },
    { Icon: Map, name: "US Census TIGER GeoJSON", url: "https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html",
      desc: locale === "es" ? "Geometría simplificada de los 15 condados de Arizona." : "Simplified geometry for all 15 Arizona counties.",
      cat: "Geo" },
    { Icon: Database, name: "ADHS / CDC reference", url: "https://azdhs.gov",
      desc: locale === "es" ? "Prevalencia de fondo (Fiebre del Valle, VNO, ILI) usada para calibración." : "Background prevalence (Valley Fever, WNV, ILI) used for calibration.",
      cat: "Public health" },
    { Icon: Sparkles, name: "Lovable AI Gateway · Gemini 2.5 Flash", url: "https://lovable.dev",
      desc: locale === "es" ? "Genera narrativa de riesgo, resúmenes semanales y explicaciones del simulador (modo JSON estricto)." : "Generates risk narrative, weekly digest, and simulator explanations (strict JSON tool-call mode).",
      cat: "AI" },
    { Icon: Shield, name: locale === "es" ? "Reportes participativos (Spark AZ)" : "Participatory reports (Spark AZ)",
      url: "#", desc: locale === "es" ? "Reportes anónimos de los residentes. Sin PII; almacenamiento con RLS estricto." : "Anonymous resident reports. No PII; storage protected with strict Row-Level Security.",
      cat: "Internal" },
  ];

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
        <Database className="w-3.5 h-3.5" /> {t("nav.dataSources")}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{t("ds.title")}</h1>
      <p className="text-muted-foreground">
        {locale === "es"
          ? "Spark AZ se construye sobre datos abiertos. Esta página enumera todas las fuentes y cómo se utilizan."
          : "Spark AZ runs entirely on open data. This page lists every source and how it's used."}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {sources.map((s, i) => {
          const Icon = s.Icon;
          return (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              className="card-elevated p-5 hover:shadow-glow transition-shadow group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.cat}</div>
              </div>
              <div className="font-semibold group-hover:text-primary">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-1.5">{s.desc}</div>
            </a>
          );
        })}
      </div>

      <div className="card-elevated p-6 border-l-4 border-l-primary">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          {locale === "es" ? "Compromiso con datos abiertos y privacidad" : "Open-data & privacy commitment"}
        </h2>
        <ul className="space-y-2 mt-3 text-sm">
          {[
            locale === "es" ? "Cero APIs pagas. Cero claves de usuario." : "Zero paid APIs. Zero user-supplied keys.",
            locale === "es" ? "Sin PII. Identidad anónima generada por el sistema." : "No PII collected. System-generated anonymous identity.",
            locale === "es" ? "Cada lectura IA cita su contexto y enlaza con la Ficha del modelo." : "Every AI insight cites its context and links back to the Model Card.",
            locale === "es" ? "Las alertas requieren aprobación humana antes de su publicación." : "Alerts require human approval before publication.",
          ].map((t, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary">▸</span>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

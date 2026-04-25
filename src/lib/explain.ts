// Spark AZ — Explainability helper (XAI input)
import { RiskDriver } from "./riskScore";

export interface XAIBar {
  label: string;
  weight: number;
  pct: number; // |weight| / total absolute
  direction: "up" | "down";
  category: RiskDriver["category"];
  tooltip: string;
}

const TOOLTIPS: Record<RiskDriver["category"], { en: string; es: string }> = {
  human: { en: "Signals from your own symptoms, mood, exposure, or recent travel.", es: "Señales de tus síntomas, estado de ánimo, exposición o viaje." },
  animal: { en: "Signals from animal observations — sick livestock, dead birds, rodents, or unusual pet symptoms.", es: "Señales de observaciones animales — ganado enfermo, aves muertas, roedores o síntomas inusuales en mascotas." },
  vector: { en: "Signals about disease vectors — mosquito activity, standing water, active monsoon.", es: "Señales sobre vectores — actividad de mosquitos, agua estancada, monzón activo." },
  environmental: { en: "Signals from air quality, dust, smoke, or extreme heat.", es: "Señales de calidad del aire, polvo, humo o calor extremo." },
  community: { en: "Pressure from rising activity in your county or import-risk from travel.", es: "Presión de actividad creciente en tu condado o riesgo por importación." },
  persona: { en: "Adjustment based on your persona profile (e.g. rancher, outdoor worker, senior).", es: "Ajuste según tu perfil (ej. ranchero, trabajador al aire libre, adulto mayor)." },
  chronic: { en: "Adjustment based on a chronic condition you reported.", es: "Ajuste según una condición crónica reportada." },
  baseline: { en: "Background population risk before any of your specific signals.", es: "Riesgo poblacional de fondo antes de tus señales específicas." },
};

export function buildXAI(drivers: RiskDriver[], locale: "en" | "es" = "en"): XAIBar[] {
  const total = drivers.reduce((s, d) => s + Math.abs(d.weight), 0) || 1;
  return drivers.map((d) => ({
    label: d.label,
    weight: d.weight,
    pct: Math.round((Math.abs(d.weight) / total) * 100),
    direction: d.weight >= 0 ? "up" : "down",
    category: d.category,
    tooltip: TOOLTIPS[d.category][locale],
  }));
}

export const CATEGORY_COLOR: Record<RiskDriver["category"], string> = {
  human: "hsl(var(--primary))",
  animal: "hsl(var(--earth))",
  vector: "hsl(var(--vector))",
  environmental: "hsl(var(--spark))",
  community: "hsl(var(--risk-elevated))",
  persona: "hsl(var(--primary-glow))",
  chronic: "hsl(var(--risk-high))",
  baseline: "hsl(var(--muted-foreground))",
};

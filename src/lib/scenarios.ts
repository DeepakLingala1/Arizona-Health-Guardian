// Spark AZ — demo scenario presets driven by ?scenario= query param
import { PersonaId } from "./personas";

export type ScenarioId = "valley-fever" | "border-import" | "monsoon" | "ranch-zoonotic";

export interface Scenario {
  id: ScenarioId;
  persona: PersonaId;
  county: string;
  symptoms: string[];
  envSignals: string[];
  animalSigns: string[];
  knownExposure: boolean;
  recentTravel: boolean;
  travelDestination?: string;
  weatherTempF?: number;
  airQuality?: { aqi?: number; pm25?: number; dust?: number };
  badge: { en: string; es: string };
  hint: { en: string; es: string };
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  "valley-fever": {
    id: "valley-fever",
    persona: "outdoor",
    county: "Pinal",
    symptoms: ["cough", "fatigue", "shortness_of_breath"],
    envSignals: ["dust_storm"],
    animalSigns: [],
    knownExposure: false,
    recentTravel: false,
    weatherTempF: 104,
    airQuality: { aqi: 132, pm25: 45, dust: 78 },
    badge: { en: "Valley Fever scenario", es: "Escenario Fiebre del Valle" },
    hint: {
      en: "Outdoor worker in Pinal County after a dust storm. Watch how XAI flags Coccidioides exposure.",
      es: "Trabajador al aire libre en Pinal tras tormenta de polvo. La IA detecta exposición a Coccidioides.",
    },
  },
  "border-import": {
    id: "border-import",
    persona: "border",
    county: "Yuma",
    symptoms: ["fever", "headache", "body_aches"],
    envSignals: ["mosquito_high"],
    animalSigns: [],
    knownExposure: false,
    recentTravel: true,
    travelDestination: "Sonora, Mexico",
    weatherTempF: 99,
    airQuality: { aqi: 64, pm25: 12, dust: 20 },
    badge: { en: "Border-import scenario", es: "Escenario de importación fronteriza" },
    hint: {
      en: "Yuma resident with recent Sonora travel during regional dengue activity.",
      es: "Residente de Yuma con viaje reciente a Sonora durante brote de dengue.",
    },
  },
  monsoon: {
    id: "monsoon",
    persona: "urban",
    county: "Maricopa",
    symptoms: ["cough", "congestion"],
    envSignals: ["monsoon_active", "standing_water", "mosquito_high"],
    animalSigns: ["dead_bird_cluster"],
    knownExposure: false,
    recentTravel: false,
    weatherTempF: 96,
    airQuality: { aqi: 88, pm25: 26, dust: 35 },
    badge: { en: "Monsoon · West Nile scenario", es: "Escenario monzón · Virus del Nilo" },
    hint: {
      en: "Phoenix metro during active monsoon with dead-bird and mosquito signals.",
      es: "Phoenix durante monzón con señales de aves muertas y mosquitos.",
    },
  },
  "ranch-zoonotic": {
    id: "ranch-zoonotic",
    persona: "rancher",
    county: "Cochise",
    symptoms: ["fever", "fatigue"],
    envSignals: [],
    animalSigns: ["sick_livestock", "rodent_activity"],
    knownExposure: false,
    recentTravel: false,
    weatherTempF: 88,
    airQuality: { aqi: 45, pm25: 8, dust: 12 },
    badge: { en: "Ranch zoonotic scenario", es: "Escenario zoonótico ganadero" },
    hint: {
      en: "Cochise rancher with sick livestock and rodent activity — Hantavirus and Q-fever watch.",
      es: "Ranchero de Cochise con ganado enfermo y roedores — vigilancia Hantavirus / fiebre Q.",
    },
  },
};

export function getScenario(id: string | null): Scenario | null {
  if (!id) return null;
  return SCENARIOS[id as ScenarioId] ?? null;
}

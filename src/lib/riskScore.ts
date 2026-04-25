// Spark AZ — One Health composite risk algorithm v0.1
// Deterministic; produces score + sub-scores + driver list (XAI input)

import { getPersona, REMOTE_COUNTIES, PersonaId } from "./personas";

export type RiskBand = "Low" | "Moderate" | "Elevated" | "High";

export const SYMPTOM_WEIGHTS: Record<string, number> = {
  fever: 15,
  shortness_of_breath: 18,
  cough: 8,
  fatigue: 6,
  gi_symptoms: 7,
  body_aches: 5,
  headache: 3,
  congestion: 3,
  sore_throat: 3,
  loss_of_taste_smell: 10,
};

export const ANIMAL_SIGN_WEIGHTS: Record<string, number> = {
  sick_livestock: 8,
  dead_bird_cluster: 10,
  rodent_activity: 6,
  unusual_pet_symptoms: 5,
  mass_mortality: 12,
  dead_wildlife: 6,
};

export const ENV_SIGNAL_WEIGHTS: Record<string, number> = {
  mosquito_high: 8,
  standing_water: 4,
  monsoon_active: 3,
  dust_storm: 6,
  smoke: 6,
  monsoon_flood: 4,
  dead_birds_area: 4,
};

export const SYMPTOM_LABELS: Record<string, { en: string; es: string }> = {
  fever: { en: "Fever", es: "Fiebre" },
  shortness_of_breath: { en: "Shortness of breath", es: "Falta de aire" },
  cough: { en: "Cough", es: "Tos" },
  fatigue: { en: "Fatigue", es: "Fatiga" },
  gi_symptoms: { en: "Stomach / GI", es: "Síntomas digestivos" },
  body_aches: { en: "Body aches", es: "Dolor corporal" },
  headache: { en: "Headache", es: "Dolor de cabeza" },
  congestion: { en: "Congestion", es: "Congestión" },
  sore_throat: { en: "Sore throat", es: "Dolor de garganta" },
  loss_of_taste_smell: { en: "Loss of taste/smell", es: "Pérdida de gusto/olfato" },
};

export const ANIMAL_SIGN_LABELS: Record<string, { en: string; es: string }> = {
  sick_livestock: { en: "Sick livestock", es: "Ganado enfermo" },
  dead_bird_cluster: { en: "Dead birds (cluster)", es: "Aves muertas (grupo)" },
  rodent_activity: { en: "Rodent activity", es: "Actividad de roedores" },
  unusual_pet_symptoms: { en: "Unusual pet symptoms", es: "Síntomas inusuales en mascotas" },
  mass_mortality: { en: "Mass mortality event", es: "Evento de mortalidad masiva" },
  dead_wildlife: { en: "Dead wildlife", es: "Fauna silvestre muerta" },
};

export const ENV_SIGNAL_LABELS: Record<string, { en: string; es: string }> = {
  mosquito_high: { en: "High mosquito activity", es: "Alta actividad de mosquitos" },
  standing_water: { en: "Standing water", es: "Agua estancada" },
  monsoon_active: { en: "Active monsoon", es: "Monzón activo" },
  dust_storm: { en: "Dust storm", es: "Tormenta de polvo" },
  smoke: { en: "Wildfire smoke", es: "Humo de incendio" },
  monsoon_flood: { en: "Monsoon flooding", es: "Inundación por monzón" },
  dead_birds_area: { en: "Dead birds in area", es: "Aves muertas en el área" },
};

export interface RiskInput {
  symptoms: string[];
  mood: number;
  knownExposure: boolean;
  recentTravel: boolean;
  conditions?: string[];
  persona?: PersonaId;
  county: string;
  weather?: { temperatureF?: number };
  airQuality?: { aqi?: number; pm25?: number; dust?: number };
  vector?: { mosquitoIndex?: number; standingWater?: boolean; monsoonActive?: boolean };
  envSignals?: string[];
  animalSigns?: string[];
  countyComposite?: number; // 0..100
  ilinetHigh?: boolean;
  travelImport?: boolean;
  daysSinceLastSymptom?: number;
}

export interface RiskDriver {
  label: string;
  weight: number; // signed contribution to composite
  category: "human" | "animal" | "vector" | "environmental" | "community" | "persona" | "chronic" | "baseline";
}

export interface RiskResult {
  composite: number;
  band: RiskBand;
  subscores: {
    human: number;
    animal: number;
    vector: number;
    environmental: number;
  };
  drivers: RiskDriver[];
}

export function bandFor(score: number): RiskBand {
  if (score < 25) return "Low";
  if (score < 50) return "Moderate";
  if (score < 75) return "Elevated";
  return "High";
}

export function bandColor(band: RiskBand): string {
  switch (band) {
    case "Low": return "hsl(var(--risk-low))";
    case "Moderate": return "hsl(var(--risk-moderate))";
    case "Elevated": return "hsl(var(--risk-elevated))";
    case "High": return "hsl(var(--risk-high))";
  }
}

export function computeRisk(input: RiskInput): RiskResult {
  const drivers: RiskDriver[] = [];
  let composite = 20;
  drivers.push({ label: "Baseline", weight: 20, category: "baseline" });

  // -------- HUMAN sub-score --------
  let human = 0;
  for (const s of input.symptoms) human += SYMPTOM_WEIGHTS[s] ?? 3;
  human = Math.min(human, 40);
  if (human > 0) {
    composite += human;
    drivers.push({ label: `Reported symptoms (${input.symptoms.length})`, weight: human, category: "human" });
  }
  const moodPenalty = Math.round((10 - (input.mood ?? 7)) * 0.7);
  if (moodPenalty > 0) {
    composite += moodPenalty;
    human += moodPenalty;
    drivers.push({ label: "How you're feeling", weight: moodPenalty, category: "human" });
  }
  if (input.knownExposure) {
    composite += 12;
    human += 12;
    drivers.push({ label: "Known exposure to a sick contact", weight: 12, category: "human" });
  }
  if (input.recentTravel) {
    composite += 6;
    human += 6;
    drivers.push({ label: "Recent travel", weight: 6, category: "human" });
  }

  // -------- ANIMAL sub-score --------
  let animal = 0;
  for (const a of input.animalSigns ?? []) animal += ANIMAL_SIGN_WEIGHTS[a] ?? 0;
  animal = Math.min(animal, 18);
  if (animal > 0) {
    composite += animal;
    drivers.push({ label: `Animal observations (${(input.animalSigns ?? []).length})`, weight: animal, category: "animal" });
  }

  // -------- VECTOR sub-score --------
  let vector = 0;
  const env = input.envSignals ?? [];
  if (env.includes("mosquito_high") || (input.vector?.mosquitoIndex ?? 0) > 60) vector += 8;
  if (env.includes("standing_water") || input.vector?.standingWater) vector += 4;
  if (env.includes("monsoon_active") || input.vector?.monsoonActive) vector += 3;
  vector = Math.min(vector, 12);
  if (vector > 0) {
    composite += vector;
    drivers.push({ label: "Vector pressure (mosquito · water · monsoon)", weight: vector, category: "vector" });
  }

  // -------- ENVIRONMENTAL sub-score --------
  let environmental = 0;
  const aqi = input.airQuality?.aqi ?? 0;
  if (aqi > 100) environmental += 8;
  else if (aqi > 50) environmental += 4;
  if ((input.airQuality?.pm25 ?? 0) > 35) environmental += 6;
  if ((input.airQuality?.dust ?? 0) > 50) environmental += 6;
  if ((input.weather?.temperatureF ?? 0) >= 100) environmental += 5;
  if (env.includes("smoke")) environmental += 6;
  if (env.includes("dust_storm")) environmental += 4;
  environmental = Math.min(environmental, 18);
  if (environmental > 0) {
    composite += environmental;
    drivers.push({ label: "Environmental pressure (AQI · dust · heat · smoke)", weight: environmental, category: "environmental" });
  }

  // -------- COMMUNITY pressure --------
  if (typeof input.countyComposite === "number") {
    const community = Math.max(0, Math.min(15, input.countyComposite - 30));
    if (community > 0) {
      composite += community;
      drivers.push({ label: "Community pressure in your county", weight: community, category: "community" });
    }
  }

  // -------- TRAVEL IMPORT --------
  if (input.travelImport) {
    composite += 6;
    drivers.push({ label: "Inbound travel-import signal", weight: 6, category: "community" });
  }

  // -------- PERSONA modifiers --------
  if (input.persona) {
    const persona = getPersona(input.persona);
    const remote = REMOTE_COUNTIES.includes(input.county);
    const personaDrivers = persona.riskModifier({
      animalScore: animal,
      envScore: environmental,
      communityScore: input.countyComposite ?? 0,
      weatherTempF: input.weather?.temperatureF ?? 0,
      ilinetHigh: !!input.ilinetHigh,
      travelImport: !!input.travelImport,
      remoteCounty: remote,
    });
    for (const d of personaDrivers) {
      composite += d.weight;
      drivers.push({ label: d.label, weight: d.weight, category: "persona" });
    }
  }

  // -------- CHRONIC modifiers --------
  const conditions = input.conditions ?? [];
  if (conditions.includes("asthma") && aqi > 50) {
    composite += 6;
    drivers.push({ label: "Asthma + elevated AQI", weight: 6, category: "chronic" });
  }
  if (conditions.includes("diabetes") && (input.ilinetHigh || (input.countyComposite ?? 0) > 55)) {
    composite += 4;
    drivers.push({ label: "Diabetes + community spread", weight: 4, category: "chronic" });
  }

  // -------- RECOVERY decay --------
  if (input.symptoms.length === 0 && (input.daysSinceLastSymptom ?? 0) >= 3) {
    composite -= 10;
    drivers.push({ label: "Recovery streak (no symptoms 3+ days)", weight: -10, category: "human" });
  }

  composite = Math.max(0, Math.min(100, Math.round(composite)));
  return {
    composite,
    band: bandFor(composite),
    subscores: {
      human: Math.min(60, Math.round(human)),
      animal: Math.round(animal),
      vector: Math.round(vector),
      environmental: Math.round(environmental),
    },
    drivers: drivers.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
  };
}

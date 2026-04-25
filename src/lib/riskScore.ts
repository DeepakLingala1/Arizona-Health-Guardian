// Deterministic risk scoring backbone for AZ Health Pulse

export const SYMPTOM_WEIGHTS: Record<string, number> = {
  fever: 15,
  shortness_of_breath: 18,
  cough: 8,
  fatigue: 6,
  sore_throat: 5,
  congestion: 4,
  headache: 5,
  body_aches: 7,
  gi_symptoms: 6,
  loss_of_taste_smell: 12,
};

export const SYMPTOM_LABELS: Record<string, string> = {
  fever: "Fever",
  shortness_of_breath: "Shortness of breath",
  cough: "Cough",
  fatigue: "Fatigue",
  sore_throat: "Sore throat",
  congestion: "Congestion",
  headache: "Headache",
  body_aches: "Body aches",
  gi_symptoms: "GI symptoms",
  loss_of_taste_smell: "Loss of taste/smell",
};

export const ALL_SYMPTOMS = Object.keys(SYMPTOM_WEIGHTS);

export interface RiskInput {
  symptoms: string[];
  mood: number; // 1-10, lower = worse
  knownExposure: boolean;
  recentTravel: boolean;
  conditions?: string[];
  weather?: { temperatureF?: number };
  airQuality?: { aqi?: number; pm25?: number; dust?: number };
  countyAggregate?: number; // 0..100
  daysSinceLastSymptom?: number;
}

export interface RiskDriver {
  label: string;
  weight: number;
}

export interface RiskResult {
  score: number;
  band: "Low" | "Moderate" | "Elevated" | "High";
  drivers: RiskDriver[];
}

export function bandFor(score: number): RiskResult["band"] {
  if (score < 25) return "Low";
  if (score < 50) return "Moderate";
  if (score < 75) return "Elevated";
  return "High";
}

export function bandColor(band: RiskResult["band"]): string {
  switch (band) {
    case "Low": return "hsl(var(--risk-low))";
    case "Moderate": return "hsl(var(--risk-moderate))";
    case "Elevated": return "hsl(var(--risk-elevated))";
    case "High": return "hsl(var(--risk-high))";
  }
}

export function computeRisk(input: RiskInput): RiskResult {
  const drivers: RiskDriver[] = [];
  let score = 20;
  drivers.push({ label: "Baseline", weight: 20 });

  // Symptoms
  let symptomScore = 0;
  for (const s of input.symptoms) {
    symptomScore += SYMPTOM_WEIGHTS[s] ?? 3;
  }
  symptomScore = Math.min(symptomScore, 40);
  if (symptomScore > 0) {
    score += symptomScore;
    drivers.push({ label: `Reported symptoms (${input.symptoms.length})`, weight: symptomScore });
  }

  // Mood penalty (low mood → +0..6)
  const moodPenalty = Math.round((10 - (input.mood ?? 7)) * 0.7);
  if (moodPenalty > 0) {
    score += moodPenalty;
    drivers.push({ label: "How you're feeling", weight: moodPenalty });
  }

  // Exposure
  if (input.knownExposure) {
    score += 12;
    drivers.push({ label: "Known exposure", weight: 12 });
  }
  if (input.recentTravel) {
    score += 6;
    drivers.push({ label: "Recent travel", weight: 6 });
  }

  // Environmental
  let env = 0;
  const aqi = input.airQuality?.aqi ?? 0;
  if (aqi > 100) env += 8;
  else if (aqi > 50) env += 4;
  if ((input.airQuality?.pm25 ?? 0) > 35) env += 6;
  if ((input.airQuality?.dust ?? 0) > 50) env += 6;
  if ((input.weather?.temperatureF ?? 0) >= 100) env += 5;
  if (env > 0) {
    score += env;
    drivers.push({ label: "Environmental pressure (AQI · dust · heat)", weight: env });
  }

  // Community pressure
  if (typeof input.countyAggregate === "number") {
    const community = Math.max(0, Math.min(15, input.countyAggregate - 30));
    if (community > 0) {
      score += community;
      drivers.push({ label: "County community pressure", weight: community });
    }
  }

  // Chronic modifiers
  const conditions = input.conditions ?? [];
  if (conditions.includes("asthma") && aqi > 50) {
    score += 6;
    drivers.push({ label: "Asthma + elevated AQI", weight: 6 });
  }
  if (conditions.includes("diabetes") && (input.countyAggregate ?? 0) > 55) {
    score += 4;
    drivers.push({ label: "Diabetes + community spread", weight: 4 });
  }

  // Recovery decay
  if (input.symptoms.length === 0 && (input.daysSinceLastSymptom ?? 0) >= 3) {
    score -= 10;
    drivers.push({ label: "Recovery streak (no symptoms 3+ days)", weight: -10 });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, band: bandFor(score), drivers: drivers.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)) };
}

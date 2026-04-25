// Spark AZ — seed synthetic One Health data with 4 named storylines
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COUNTIES = [
  "Apache","Cochise","Coconino","Gila","Graham","Greenlee","La Paz",
  "Maricopa","Mohave","Navajo","Pima","Pinal","Santa Cruz","Yavapai","Yuma",
];
const COUNTY_WEIGHTS = [3,5,5,3,2,1,1,30,5,3,18,8,2,5,4];

const SYMPTOMS = ["fever","shortness_of_breath","cough","fatigue","sore_throat","congestion","headache","body_aches","gi_symptoms","loss_of_taste_smell"];
const ANIMAL_SIGNS = ["sick_livestock","dead_bird_cluster","rodent_activity","unusual_pet_symptoms","mass_mortality","dead_wildlife"];
const ENV_SIGNALS = ["mosquito_high","standing_water","monsoon_active","dust_storm","smoke","monsoon_flood","dead_birds_area"];

function pickCounty() {
  const total = COUNTY_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for (let i=0;i<COUNTIES.length;i++){ r-=COUNTY_WEIGHTS[i]; if(r<=0) return COUNTIES[i]; }
  return "Maricopa";
}

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)]; }

function selfCheckin(daysAgo: number, county: string) {
  // Pima respiratory cluster: last 4 days
  const pimaCluster = county === "Pima" && daysAgo <= 4;
  // Yuma border-import: occasional travel from Mexico
  const yumaImport = county === "Yuma" && daysAgo <= 3 && Math.random() < 0.25;

  const symptoms = new Set<string>();
  if (Math.random() < 0.35 && !pimaCluster) return null; // skipped report
  if (pimaCluster && Math.random() < 0.7) {
    symptoms.add("cough");
    if (Math.random() < 0.65) symptoms.add("fever");
    if (Math.random() < 0.55) symptoms.add("fatigue");
    if (Math.random() < 0.35) symptoms.add("shortness_of_breath");
  } else {
    const n = Math.floor(Math.random()*3);
    for (let i=0;i<n;i++) symptoms.add(rand(SYMPTOMS));
  }
  return {
    category: "self",
    county,
    mood: 4 + Math.floor(Math.random()*7),
    symptoms: [...symptoms],
    animal_signs: [],
    env_signals: [],
    known_exposure: Math.random() < (pimaCluster ? 0.3 : 0.08),
    recent_travel: yumaImport || Math.random() < 0.05,
    travel_destination: yumaImport ? "Sonora, Mexico" : null,
    created_at: new Date(Date.now() - daysAgo*86400000 - Math.random()*86400000).toISOString(),
  };
}

function animalCheckin(daysAgo: number, county: string) {
  // Cochise zoonotic cluster
  const cochiseZoo = county === "Cochise" && daysAgo <= 5;
  // Maricopa dead bird (West Nile precursor)
  const maricopaWN = county === "Maricopa" && daysAgo <= 4 && Math.random() < 0.4;

  const signs = new Set<string>();
  if (cochiseZoo) {
    if (Math.random() < 0.7) signs.add("sick_livestock");
    if (Math.random() < 0.5) signs.add("rodent_activity");
  } else if (maricopaWN) {
    signs.add("dead_bird_cluster");
    if (Math.random() < 0.3) signs.add("dead_wildlife");
  } else {
    if (Math.random() < 0.5) return null;
    signs.add(rand(ANIMAL_SIGNS));
  }
  if (signs.size === 0) return null;
  return {
    category: "animal",
    county,
    animal_type: cochiseZoo ? rand(["cattle","sheep","horse"]) : maricopaWN ? "wild bird" : rand(["pet","wild bird","cattle","horse"]),
    animal_signs: [...signs],
    env_signals: [],
    animal_count: 1 + Math.floor(Math.random()*5),
    symptoms: [],
    created_at: new Date(Date.now() - daysAgo*86400000 - Math.random()*86400000).toISOString(),
  };
}

function envCheckin(daysAgo: number, county: string) {
  // Maricopa West Nile environment: mosquito + standing water
  const maricopaWN = county === "Maricopa" && daysAgo <= 5;
  // Pinal/Maricopa dust storms
  const dust = (county === "Pinal" || county === "Maricopa") && daysAgo <= 7 && Math.random() < 0.3;

  const signals = new Set<string>();
  if (maricopaWN && Math.random() < 0.6) {
    signals.add("mosquito_high");
    if (Math.random() < 0.5) signals.add("standing_water");
    if (Math.random() < 0.4) signals.add("monsoon_active");
  } else if (dust) {
    signals.add("dust_storm");
  } else {
    if (Math.random() < 0.6) return null;
    signals.add(rand(ENV_SIGNALS));
  }
  return {
    category: "environment",
    county,
    env_signals: [...signals],
    animal_signs: [],
    symptoms: [],
    created_at: new Date(Date.now() - daysAgo*86400000 - Math.random()*86400000).toISOString(),
  };
}

const EPICORE_SEED = [
  { region: "Sonora, Mexico", hazard: "Dengue", summary: "Confirmed dengue outbreak in northern Sonora; 47 cases reported.", severity: 3, pathway: "travel" },
  { region: "California, USA", hazard: "West Nile virus", summary: "Mosquito pools positive in San Bernardino; first human case of season.", severity: 2, pathway: "vector" },
  { region: "New Mexico, USA", hazard: "Hantavirus", summary: "Two HPS cases reported in northern NM tied to rural rodent exposure.", severity: 3, pathway: "animal" },
  { region: "Texas, USA", hazard: "Measles", summary: "Cluster in West Texas county adjacent to NM border.", severity: 4, pathway: "travel" },
  { region: "Baja California, Mexico", hazard: "Influenza A H3N2", summary: "Sharp ILI uptick in Tijuana area.", severity: 2, pathway: "travel" },
  { region: "Arizona, USA", hazard: "Valley Fever", summary: "ADHS reports above-baseline coccidioidomycosis in Maricopa Q2.", severity: 2, pathway: "environment" },
  { region: "Utah, USA", hazard: "Plague", summary: "Plague-positive prairie dogs detected in southern Utah.", severity: 2, pathway: "animal" },
  { region: "Mexico City, Mexico", hazard: "Pertussis", summary: "Pertussis cases tripled vs. baseline; advisory issued.", severity: 3, pathway: "travel" },
];

const ALERT_SEED = [
  { county: "Pima", severity: "elevated", title: "Respiratory cluster forming in central Pima", body: "Self-reports of cough + fever rose 38% over the last 4 days, concentrated near central Tucson. AQI is moderate. Consider issuing an early-season respiratory advisory." },
  { county: "Maricopa", severity: "elevated", title: "West Nile precursor signals in Phoenix metro", body: "Dead-bird reports plus high mosquito index plus standing water in three south Phoenix ZIPs. Recommend Vector Control inspection." },
  { county: "Cochise", severity: "moderate", title: "Possible zoonotic event near Sierra Vista", body: "Sick-livestock and rodent-activity reports clustering in Cochise. Consider veterinary outreach and Hantavirus messaging." },
  { county: "Yuma", severity: "moderate", title: "Travel-import watch (Sonora dengue)", body: "Five recent self-reports include cross-border travel + EpiCore dengue signal in Sonora. Recommend clinician advisory." },
  { county: "Pinal", severity: "moderate", title: "Dust + heat exposure spike", body: "Dust-storm reports + extreme heat + asthma chronic load. Consider air-quality public messaging." },
  { county: "Coconino", severity: "low", title: "Wildfire smoke advisory candidate", body: "Smoke reports rising in Flagstaff vicinity. Below alert threshold but watch." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supa = createClient(url, key);

  // Idempotent: skip if already seeded
  const { count } = await supa.from("checkins").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 100) {
    return new Response(JSON.stringify({ skipped: true, count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const checkins: any[] = [];
  for (let day = 0; day < 14; day++) {
    const todayCount = 50 + Math.floor(Math.random()*30);
    for (let i = 0; i < todayCount; i++) {
      const county = pickCounty();
      const r = Math.random();
      let row;
      if (r < 0.65) row = selfCheckin(day, county);
      else if (r < 0.85) row = animalCheckin(day, county);
      else row = envCheckin(day, county);
      if (row) checkins.push(row);
    }
  }

  // Insert in chunks
  for (let i = 0; i < checkins.length; i += 200) {
    const chunk = checkins.slice(i, i+200);
    const { error } = await supa.from("checkins").insert(chunk);
    if (error) console.error("checkins insert", error);
  }

  // Seed EpiCore feed
  await supa.from("epicore_feed").delete().not("id", "is", null);
  await supa.from("epicore_feed").insert(EPICORE_SEED.map((e,i) => ({
    ...e,
    observed_at: new Date(Date.now() - (i+1)*86400000*0.7).toISOString(),
  })));

  // Seed pending alerts (HITL queue)
  await supa.from("alerts").delete().not("id", "is", null);
  await supa.from("alerts").insert(ALERT_SEED.map(a => ({ ...a, status: "pending", ai_generated: true })));

  return new Response(JSON.stringify({ inserted: checkins.length, alerts: ALERT_SEED.length, epicore: EPICORE_SEED.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

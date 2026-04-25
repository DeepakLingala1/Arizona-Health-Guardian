// Spark AZ — aggregate last 24h check-ins into county_daily with One Health sub-scores + k-means clusters
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COUNTIES = ["Apache","Cochise","Coconino","Gila","Graham","Greenlee","La Paz","Maricopa","Mohave","Navajo","Pima","Pinal","Santa Cruz","Yavapai","Yuma"];
const COUNTY_COORDS: Record<string,[number,number]> = {
  Apache:[35.39,-109.49], Cochise:[31.88,-109.75], Coconino:[35.84,-111.77],
  Gila:[33.80,-110.81], Graham:[32.93,-109.89], Greenlee:[33.21,-109.24],
  "La Paz":[33.73,-113.97], Maricopa:[33.45,-112.07], Mohave:[35.20,-114.05],
  Navajo:[35.40,-110.32], Pima:[32.22,-110.93], Pinal:[32.90,-111.32],
  "Santa Cruz":[31.52,-110.77], Yavapai:[34.60,-112.55], Yuma:[32.69,-114.63],
};

const SYMPTOM_VOCAB = ["fever","shortness_of_breath","cough","fatigue","sore_throat","congestion","headache","body_aches","gi_symptoms","loss_of_taste_smell"];
const SYMPTOM_WEIGHTS: Record<string, number> = { fever:15, shortness_of_breath:18, cough:8, fatigue:6, gi_symptoms:7, body_aches:5, headache:3, congestion:3, sore_throat:3, loss_of_taste_smell:10 };
const ANIMAL_WEIGHTS: Record<string, number> = { sick_livestock:8, dead_bird_cluster:10, rodent_activity:6, unusual_pet_symptoms:5, mass_mortality:12, dead_wildlife:6 };

function dist(a: number[], b: number[]) { let s=0; for (let i=0;i<a.length;i++) s+=(a[i]-b[i])**2; return Math.sqrt(s); }
function kmeans(points: number[][], k: number, maxIter=20) {
  if (points.length === 0) return { centroids: [], assignments: [] };
  k = Math.min(k, points.length);
  const dim = points[0].length;
  const centroids: number[][] = [points[Math.floor(Math.random()*points.length)].slice()];
  while (centroids.length < k) {
    const dists = points.map(p => Math.min(...centroids.map(c => dist(p,c))));
    const total = dists.reduce((a,b)=>a+b, 0) || 1;
    let r = Math.random()*total, pick = 0;
    for (let i=0;i<dists.length;i++) { r-=dists[i]; if (r<=0) { pick=i; break; } }
    centroids.push(points[pick].slice());
  }
  let assignments = new Array(points.length).fill(0);
  for (let it=0; it<maxIter; it++) {
    let changed = false;
    for (let i=0;i<points.length;i++){
      let best=0, bd=Infinity;
      for (let c=0;c<centroids.length;c++){ const d=dist(points[i], centroids[c]); if (d<bd){ bd=d; best=c; } }
      if (assignments[i] !== best) { assignments[i]=best; changed=true; }
    }
    const sums = Array.from({length:k}, ()=> new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i=0;i<points.length;i++){ counts[assignments[i]]++; for (let d=0;d<dim;d++) sums[assignments[i]][d]+=points[i][d]; }
    for (let c=0;c<k;c++) if (counts[c]>0) for (let d=0;d<dim;d++) centroids[c][d]=sums[c][d]/counts[c];
    if (!changed) break;
  }
  return { centroids, assignments };
}

function symptomLabel(centroid: number[]): string {
  const idxs = centroid.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v).slice(0,3).filter(x=>x.v>0.15);
  if (idxs.length === 0) return "Mixed";
  const names = idxs.map(x => SYMPTOM_VOCAB[x.i]);
  if (names.includes("cough") && names.includes("fever")) return "Respiratory (cough + fever)";
  if (names.includes("gi_symptoms")) return "Gastrointestinal";
  if (names.includes("loss_of_taste_smell")) return "COVID-like";
  return names.slice(0,2).join(" + ");
}

function topN<T>(items: T[], keyFn: (x:T)=>string, n=5) {
  const counts = new Map<string, number>();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,c])=>({ key: k, count: c }));
}

async function fetchEnv(county: string) {
  const [lat, lon] = COUNTY_COORDS[county];
  let weather: any = null, air: any = null;
  try {
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&temperature_unit=fahrenheit&timezone=America/Phoenix`);
    if (w.ok) weather = (await w.json()).current;
  } catch {}
  try {
    const a = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,ozone,dust&timezone=America/Phoenix`);
    if (a.ok) air = (await a.json()).current;
  } catch {}
  return { weather, air_quality: air };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supa = createClient(url, key);

  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 24*60*60*1000).toISOString();

  for (const county of COUNTIES) {
    const { data: rows } = await supa
      .from("checkins")
      .select("category, symptoms, animal_signs, env_signals, mood, known_exposure, recent_travel")
      .eq("county", county)
      .gte("created_at", since);

    const list = rows ?? [];
    const selfRows = list.filter(r => r.category === "self");
    const animalRows = list.filter(r => r.category === "animal");
    const envRows = list.filter(r => r.category === "environment");

    // Sub-scores (mean per category, scaled 0..100)
    let humanRaw = 0;
    for (const r of selfRows) {
      let s = 0;
      for (const sym of (r.symptoms ?? [])) s += SYMPTOM_WEIGHTS[sym] ?? 3;
      if (r.known_exposure) s += 12;
      if (r.recent_travel) s += 6;
      humanRaw += Math.min(s, 50);
    }
    const human = selfRows.length ? Math.min(100, Math.round((humanRaw / selfRows.length) * 1.5)) : 0;

    let animalRaw = 0;
    for (const r of animalRows) {
      let s = 0;
      for (const a of (r.animal_signs ?? [])) s += ANIMAL_WEIGHTS[a] ?? 3;
      animalRaw += Math.min(s, 30);
    }
    const animal = animalRows.length ? Math.min(100, Math.round((animalRaw / animalRows.length) * 2.2)) : 0;

    let vector = 0, env = 0;
    for (const r of envRows) {
      const sig = r.env_signals ?? [];
      if (sig.includes("mosquito_high")) vector += 8;
      if (sig.includes("standing_water")) vector += 4;
      if (sig.includes("monsoon_active")) vector += 3;
      if (sig.includes("dust_storm")) env += 6;
      if (sig.includes("smoke")) env += 6;
      if (sig.includes("monsoon_flood")) env += 4;
    }
    vector = envRows.length ? Math.min(100, Math.round(vector / envRows.length * 4)) : 0;
    env = envRows.length ? Math.min(100, Math.round(env / envRows.length * 4)) : 0;

    // Environmental boost from real weather/AQI
    const { weather, air_quality } = await fetchEnv(county);
    if (air_quality?.us_aqi > 100) env = Math.min(100, env + 12);
    else if (air_quality?.us_aqi > 50) env = Math.min(100, env + 6);
    if (air_quality?.dust > 50) env = Math.min(100, env + 8);
    if (weather?.temperature_2m >= 100) env = Math.min(100, env + 6);

    const composite = Math.round(human*0.45 + animal*0.20 + vector*0.15 + env*0.20);

    const top_human_symptoms = topN(selfRows.flatMap((r:any)=> r.symptoms ?? []), (s:string)=>s);
    const top_animal_signs = topN(animalRows.flatMap((r:any)=> r.animal_signs ?? []), (s:string)=>s);
    const top_env_signals = topN(envRows.flatMap((r:any)=> r.env_signals ?? []), (s:string)=>s);

    // K-means on symptom vectors
    const vectors = selfRows
      .map((r:any) => SYMPTOM_VOCAB.map(s => (r.symptoms ?? []).includes(s) ? 1 : 0))
      .filter(v => v.some(x => x === 1));
    let clusters: any[] = [];
    if (vectors.length >= 6) {
      const k = Math.min(3, Math.max(2, Math.floor(vectors.length / 5)));
      const km = kmeans(vectors, k);
      const groupCounts = new Array(km.centroids.length).fill(0);
      km.assignments.forEach((a:number) => groupCounts[a]++);
      clusters = km.centroids.map((c, i) => ({
        label: symptomLabel(c),
        size: groupCounts[i],
        centroid: c.map(v => Math.round(v*100)/100),
      })).filter(c => c.size >= 2).sort((a,b) => b.size - a.size);
    }

    await supa.from("county_daily").upsert({
      county, date: today,
      checkin_count: list.length,
      human_score: human, animal_score: animal, vector_score: vector, env_score: env,
      composite_risk: composite,
      top_human_symptoms, top_animal_signs, top_env_signals,
      weather, air_quality,
      clusters,
      updated_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ ok: true, counties: COUNTIES.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

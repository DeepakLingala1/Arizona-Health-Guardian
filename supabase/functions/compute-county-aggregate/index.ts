import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AZ_COUNTIES = [
  { name: "Apache", lat: 35.39, lon: -109.49 },
  { name: "Cochise", lat: 31.88, lon: -109.75 },
  { name: "Coconino", lat: 35.84, lon: -111.77 },
  { name: "Gila", lat: 33.80, lon: -110.81 },
  { name: "Graham", lat: 32.93, lon: -109.89 },
  { name: "Greenlee", lat: 33.21, lon: -109.24 },
  { name: "La Paz", lat: 33.73, lon: -113.97 },
  { name: "Maricopa", lat: 33.45, lon: -112.07 },
  { name: "Mohave", lat: 35.20, lon: -114.05 },
  { name: "Navajo", lat: 35.40, lon: -110.32 },
  { name: "Pima", lat: 32.22, lon: -110.93 },
  { name: "Pinal", lat: 32.90, lon: -111.32 },
  { name: "Santa Cruz", lat: 31.52, lon: -110.77 },
  { name: "Yavapai", lat: 34.60, lon: -112.55 },
  { name: "Yuma", lat: 32.69, lon: -114.63 },
];

const SYMPTOM_WEIGHTS: Record<string, number> = {
  fever: 15, shortness_of_breath: 18, cough: 8, fatigue: 6, sore_throat: 5,
  congestion: 4, headache: 5, body_aches: 7, gi_symptoms: 6, loss_of_taste_smell: 12,
};
const ALL_SYMPTOMS = Object.keys(SYMPTOM_WEIGHTS);

// Tiny k-means
function dist(a: number[], b: number[]) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i]-b[i])**2; return Math.sqrt(s); }
function kmeans(points: number[][], k: number, maxIter = 20) {
  if (!points.length) return { centroids: [], assignments: [] };
  const dim = points[0].length;
  k = Math.min(k, points.length);
  const centroids: number[][] = [points[Math.floor(Math.random()*points.length)].slice()];
  while (centroids.length < k) {
    const dists = points.map((p) => Math.min(...centroids.map((c) => dist(p, c))));
    const total = dists.reduce((a,b)=>a+b,0) || 1;
    let r = Math.random()*total; let pick = 0;
    for (let i=0;i<dists.length;i++){ r-=dists[i]; if(r<=0){pick=i;break;} }
    centroids.push(points[pick].slice());
  }
  const assignments = new Array(points.length).fill(0);
  for (let it=0; it<maxIter; it++) {
    let changed = false;
    for (let i=0;i<points.length;i++){
      let best=0,bd=Infinity;
      for(let c=0;c<k;c++){const d=dist(points[i],centroids[c]); if(d<bd){bd=d;best=c;}}
      if (assignments[i]!==best){assignments[i]=best;changed=true;}
    }
    const sums = Array.from({length:k},()=>new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i=0;i<points.length;i++){const a=assignments[i];counts[a]++;for(let d=0;d<dim;d++)sums[a][d]+=points[i][d];}
    for (let c=0;c<k;c++) if(counts[c]>0) for(let d=0;d<dim;d++) centroids[c][d]=sums[c][d]/counts[c];
    if (!changed) break;
  }
  return { centroids, assignments };
}

async function fetchEnv(lat: number, lon: number) {
  try {
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=America/Phoenix&temperature_unit=fahrenheit`).then(r => r.json());
    const aq = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,ozone,dust&timezone=America/Phoenix`).then(r => r.json());
    return {
      weather: {
        temperatureF: w.current?.temperature_2m,
        humidity: w.current?.relative_humidity_2m,
        precipitation: w.current?.precipitation,
        code: w.current?.weather_code,
      },
      air_quality: {
        aqi: aq.current?.us_aqi,
        pm10: aq.current?.pm10,
        pm25: aq.current?.pm2_5,
        ozone: aq.current?.ozone,
        dust: aq.current?.dust,
      },
    };
  } catch (e) {
    console.error("env fetch err", e);
    return { weather: null, air_quality: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const targets: string[] = body.county ? [body.county] : AZ_COUNTIES.map((c) => c.name);
    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const results = [];
    for (const countyName of targets) {
      const meta = AZ_COUNTIES.find((c) => c.name === countyName);
      if (!meta) continue;

      // Last 24h checkins for county
      const { data: checkins } = await supabase
        .from("checkins")
        .select("symptoms, mood, recent_travel, known_exposure, risk_score, created_at")
        .eq("county", countyName)
        .gte("created_at", since);

      const list = checkins ?? [];

      // Top symptoms
      const symptomCounts: Record<string, number> = {};
      for (const c of list) {
        for (const s of (c.symptoms ?? [])) symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
      }
      const topSymptoms = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([symptom, count]) => ({ symptom, count }));

      // Aggregate risk = avg of risk scores or computed proxy
      let aggregateRisk = 25;
      if (list.length > 0) {
        const validScores = list.map((c) => c.risk_score).filter((s): s is number => typeof s === "number");
        if (validScores.length) {
          aggregateRisk = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
        } else {
          // proxy: use symptom prevalence
          const avgSymp = list.reduce((a, c) => a + ((c.symptoms?.length) ?? 0), 0) / list.length;
          aggregateRisk = Math.min(90, Math.round(20 + avgSymp * 12));
        }
      }

      // Symptom vector clustering
      const vectors = list
        .filter((c) => (c.symptoms?.length ?? 0) > 0)
        .map((c) => ALL_SYMPTOMS.map((s) => (c.symptoms as string[]).includes(s) ? 1 : 0));

      let clusters: { name: string; size: number; topSymptoms: string[] }[] = [];
      if (vectors.length >= 6) {
        const { centroids, assignments } = kmeans(vectors, 3);
        const groups: Record<number, number[][]> = {};
        for (let i = 0; i < assignments.length; i++) {
          const a = assignments[i];
          (groups[a] ??= []).push(vectors[i]);
        }
        clusters = centroids.map((centroid, idx) => {
          const top = ALL_SYMPTOMS
            .map((s, i) => ({ s, v: centroid[i] }))
            .sort((a, b) => b.v - a.v)
            .slice(0, 3)
            .filter((x) => x.v > 0.25)
            .map((x) => x.s);
          const size = (groups[idx] ?? []).length;
          let name = "Mixed cluster";
          if (top.includes("cough") && (top.includes("fever") || top.includes("fatigue"))) name = "Respiratory cluster";
          else if (top.includes("gi_symptoms")) name = "GI cluster";
          else if (top.includes("headache") && top.includes("congestion")) name = "Allergy/sinus cluster";
          return { name, size, topSymptoms: top };
        }).filter((c) => c.size > 0);
      }

      const env = await fetchEnv(meta.lat, meta.lon);

      // Bump aggregate by environmental + community
      const aqi = env.air_quality?.aqi ?? 0;
      const dust = env.air_quality?.dust ?? 0;
      const heat = (env.weather?.temperatureF ?? 0) >= 100 ? 5 : 0;
      aggregateRisk = Math.min(100, aggregateRisk + (aqi > 100 ? 8 : aqi > 50 ? 4 : 0) + (dust > 50 ? 6 : 0) + heat);

      await supabase.from("county_daily").upsert({
        county: countyName,
        date: today,
        checkin_count: list.length,
        top_symptoms: topSymptoms,
        aggregate_risk: aggregateRisk,
        weather: env.weather,
        air_quality: env.air_quality,
        clusters,
        updated_at: new Date().toISOString(),
      });

      results.push({ county: countyName, aggregateRisk, checkin_count: list.length, clusters });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-county-aggregate error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

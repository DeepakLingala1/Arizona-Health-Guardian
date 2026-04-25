import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COUNTIES = [
  "Apache", "Cochise", "Coconino", "Gila", "Graham", "Greenlee", "La Paz",
  "Maricopa", "Mohave", "Navajo", "Pima", "Pinal", "Santa Cruz", "Yavapai", "Yuma",
];
const COUNTY_WEIGHTS = [3,5,5,3,2,1,1,30,5,3,18,8,2,5,4]; // population-ish weights

const ALL_SYMPTOMS = ["fever","shortness_of_breath","cough","fatigue","sore_throat","congestion","headache","body_aches","gi_symptoms","loss_of_taste_smell"];

function pickCounty(): string {
  const total = COUNTY_WEIGHTS.reduce((a,b)=>a+b,0);
  let r = Math.random()*total;
  for (let i=0;i<COUNTIES.length;i++){ r-=COUNTY_WEIGHTS[i]; if(r<=0) return COUNTIES[i]; }
  return "Maricopa";
}

function pickSymptoms(daysAgo: number, county: string): string[] {
  // Cluster injection: Pima + Maricopa get respiratory cluster starting 4 days ago
  const inCluster = (county === "Pima" || county === "Maricopa") && daysAgo <= 4;
  const out = new Set<string>();

  if (Math.random() < 0.35) return [];

  const baseCount = Math.floor(Math.random() * 4);
  if (inCluster && Math.random() < 0.7) {
    out.add("cough");
    if (Math.random() < 0.6) out.add("fever");
    if (Math.random() < 0.5) out.add("fatigue");
    if (Math.random() < 0.3) out.add("sore_throat");
  } else {
    for (let i=0;i<baseCount;i++) out.add(ALL_SYMPTOMS[Math.floor(Math.random()*ALL_SYMPTOMS.length)]);
  }
  return [...out];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const force: boolean = body.force === true;

    const { count: existing } = await supabase.from("checkins").select("id", { count: "exact", head: true });
    if ((existing ?? 0) > 100 && !force) {
      return new Response(JSON.stringify({ skipped: true, existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (force) {
      await supabase.from("checkins").delete().gte("created_at", "1970-01-01");
      await supabase.from("county_daily").delete().gte("date", "1970-01-01");
      await supabase.from("ai_insights").delete().neq("scope", "");
    }

    // Create a synthetic anonymous "demo author" id for seeded checkins.
    // We can't use auth.uid() server-side; we'll set user_id to null-allowed.
    // Schema requires user_id references profiles(id). Insert a synthetic profile.
    const demoId = "00000000-0000-0000-0000-000000000001";
    await supabase.from("profiles").upsert({
      id: demoId,
      home_county: "Pima",
      age_band: "35-54",
      conditions: ["asthma"],
      streak: 5,
    });

    // Generate ~800 checkins over 14 days
    const rows: any[] = [];
    const now = Date.now();
    for (let i = 0; i < 800; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const ts = new Date(now - daysAgo * 86400000 - Math.floor(Math.random() * 86400000));
      const county = pickCounty();
      const symptoms = pickSymptoms(daysAgo, county);
      rows.push({
        user_id: demoId,
        county,
        mood: Math.max(1, Math.min(10, Math.round(8 - symptoms.length * 0.7 - Math.random() * 1.5))),
        symptoms,
        recent_travel: Math.random() < 0.08,
        known_exposure: Math.random() < 0.05,
        risk_score: Math.min(95, 20 + symptoms.length * 9 + Math.floor(Math.random() * 12)),
        created_at: ts.toISOString(),
      });
    }

    // Batch insert
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("checkins").insert(chunk);
      if (error) console.error("seed insert err", error);
    }

    // Pre-seed Pima ai_insight so dashboard is instant
    await supabase.from("ai_insights").insert([
      {
        scope: "county",
        scope_id: "Pima",
        insight: "Pima County is showing an emerging respiratory cluster: cough, fever, and fatigue reports are up 47% over the last 7 days, concentrated in Tucson. Air quality is moderate (AQI 62) with elevated dust from a weekend wind event, and afternoon highs above 100°F continue to stress vulnerable residents. The combination warrants a heightened monitoring posture for vulnerable groups, especially those with asthma or cardiovascular conditions.",
        recommendations: [
          "Mask in crowded indoor settings if you live in Tucson and surrounding areas",
          "Asthma and COPD patients: keep rescue inhalers within reach and limit outdoor exertion 2-6pm",
          "Wash hands often and isolate at home if you develop a fever or productive cough",
        ],
        drivers: [
          { label: "Respiratory cluster (cough+fever+fatigue)", weight: 28 },
          { label: "Elevated dust + heat", weight: 11 },
          { label: "7-day check-in velocity +47%", weight: 14 },
        ],
      },
      {
        scope: "user",
        scope_id: demoId,
        insight: "Your personal risk is moderate today, driven mainly by mild congestion, the active respiratory cluster in Pima County, and elevated dust from yesterday's wind event. Your asthma history adds extra sensitivity to today's air quality. You haven't reported any high-severity symptoms, so simple precautions should keep you on track.",
        recommendations: [
          "Run an air purifier or close windows during the afternoon dust peak",
          "Pre-medicate with your asthma controller if going outdoors after 2pm",
          "Hydrate above your usual baseline — 8-10 glasses, especially before sunset",
        ],
        drivers: [
          { label: "Reported congestion", weight: 4 },
          { label: "Pima respiratory cluster", weight: 9 },
          { label: "Asthma + AQI", weight: 6 },
        ],
      },
    ]);

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-demo error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

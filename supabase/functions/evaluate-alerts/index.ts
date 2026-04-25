// Spark AZ — scan county_daily for threshold crossings, emit pending alerts for HITL review
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);

  const { data: rows } = await supa.from("county_daily").select("*").in("date", [today, yesterday]);
  const byCounty: Record<string, any[]> = {};
  (rows ?? []).forEach(r => { (byCounty[r.county] ??= []).push(r); });

  const created: string[] = [];
  for (const [county, list] of Object.entries(byCounty)) {
    const todayRow = list.find(r => r.date === today);
    const ydayRow = list.find(r => r.date === yesterday);
    if (!todayRow) continue;

    const breaches: string[] = [];
    if (todayRow.composite_risk >= 70) breaches.push(`composite_high:${todayRow.composite_risk}`);
    if (ydayRow) {
      const subs: ("human_score"|"animal_score"|"vector_score"|"env_score")[] = ["human_score","animal_score","vector_score","env_score"];
      for (const s of subs) {
        const t = todayRow[s] as number, y = ydayRow[s] as number;
        if (y > 0 && (t - y) / y > 0.4) breaches.push(`velocity:${s}:${Math.round((t-y)/y*100)}%`);
      }
    }
    if (breaches.length === 0) continue;

    // Check we don't already have a pending alert for this county today
    const { data: existing } = await supa.from("alerts").select("id").eq("county", county).gte("created_at", today).limit(1);
    if (existing && existing.length > 0) continue;

    const severity = todayRow.composite_risk >= 80 ? "high" : todayRow.composite_risk >= 65 ? "elevated" : todayRow.composite_risk >= 45 ? "moderate" : "low";
    const title = `${county}: ${breaches[0].includes("composite") ? "Composite risk crossed alert threshold" : "Sub-score velocity spike"}`;
    const body = `Spark AZ detected: ${breaches.join(", ")}. Top human symptoms: ${JSON.stringify(todayRow.top_human_symptoms ?? [])}. Top animal signs: ${JSON.stringify(todayRow.top_animal_signs ?? [])}. Top env signals: ${JSON.stringify(todayRow.top_env_signals ?? [])}.`;

    await supa.from("alerts").insert({ county, severity, title, body, ai_generated: true, status: "pending" });
    created.push(county);
  }

  return new Response(JSON.stringify({ created }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

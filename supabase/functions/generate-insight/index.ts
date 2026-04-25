// Spark AZ — generate AI insight via Lovable AI Gateway (Gemini 2.5 Flash, JSON mode)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_BASE = `You are a One Health surveillance assistant for Arizona, USA.
Reference Arizona-specific threats where relevant: Valley Fever (Coccidioides) and dust storms, West Nile virus via Culex mosquitoes, Hantavirus from rodent exposure (especially in remote/tribal counties), monsoon-season respiratory and GI surges, extreme heat, wildfire smoke, and US-Mexico border-region travel-import dynamics.
Be concise, calm, and actionable. Never claim diagnostic certainty. Never request PII.
Always respond in the language requested. Output STRICT JSON matching the requested schema. No prose outside JSON.`;

const SCHEMAS: Record<string, any> = {
  user: {
    type: "object",
    additionalProperties: false,
    required: ["insight","recommendations"],
    properties: {
      insight: { type: "string", description: "3-4 sentence Arizona-contextual explanation of this person's risk." },
      recommendations: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    },
  },
  county: {
    type: "object",
    additionalProperties: false,
    required: ["summary","watchlist"],
    properties: {
      summary: { type: "string", description: "3-4 sentence summary of community risk for this county." },
      watchlist: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    },
  },
  simulator: {
    type: "object",
    additionalProperties: false,
    required: ["delta_explanation","top_factors"],
    properties: {
      delta_explanation: { type: "string" },
      top_factors: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    },
  },
  digest: {
    type: "object",
    additionalProperties: false,
    required: ["headline","key_findings","cluster_callouts"],
    properties: {
      headline: { type: "string" },
      key_findings: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
      cluster_callouts: { type: "array", items: { type: "string" } },
    },
  },
};

function buildPrompt(scope: string, payload: any, language: string): string {
  const lang = language === "es" ? "Spanish" : "English";
  if (scope === "user") {
    return `Respond in ${lang}.
A resident in ${payload.county} County, Arizona (persona: ${payload.persona}) has a composite risk score of ${payload.composite}/100 (band: ${payload.band}).
Their One Health signals — Human: ${payload.subscores?.human}, Animal: ${payload.subscores?.animal}, Vector: ${payload.subscores?.vector}, Environmental: ${payload.subscores?.environmental}.
Top drivers: ${(payload.drivers ?? []).slice(0,5).map((d:any)=>`${d.label} (${d.weight>0?"+":""}${d.weight})`).join("; ")}.
Weather: ${JSON.stringify(payload.weather ?? {})}. Air: ${JSON.stringify(payload.air_quality ?? {})}.
Top community symptoms: ${JSON.stringify(payload.top_symptoms ?? [])}.
Recent global signals (EpiCore): ${(payload.epicore ?? []).slice(0,3).map((e:any)=>`${e.region}: ${e.hazard}`).join("; ")}.
Write a 3-4 sentence personal insight + 3 specific recommendations they can act on today.`;
  }
  if (scope === "county") {
    return `Respond in ${lang}.
Summarize the public-health picture for ${payload.county} County, Arizona today. Composite risk: ${payload.composite}/100. Sub-scores — Human: ${payload.subscores?.human}, Animal: ${payload.subscores?.animal}, Vector: ${payload.subscores?.vector}, Environmental: ${payload.subscores?.environmental}.
Top symptoms: ${JSON.stringify(payload.top_human_symptoms ?? [])}. Top animal signs: ${JSON.stringify(payload.top_animal_signs ?? [])}. Top env signals: ${JSON.stringify(payload.top_env_signals ?? [])}.
Detected clusters: ${JSON.stringify(payload.clusters ?? [])}. Weather: ${JSON.stringify(payload.weather ?? {})}.
Write a 3-4 sentence summary + 3 specific things public health should watch this week.`;
  }
  if (scope === "simulator") {
    return `Respond in ${lang}.
Simulating travel from ${payload.origin} County to ${payload.destination} County, Arizona for ${payload.days} days, primary activity: ${payload.activity}.
Baseline composite at origin: ${payload.baseline}, projected at destination: ${payload.projected} (delta ${payload.projected - payload.baseline}).
Explain in 2-3 sentences why the projected risk changes, and list the 3 biggest contributing factors.`;
  }
  // digest
  return `Respond in ${lang}.
You're writing the weekly Spark AZ One Health digest. Statewide top counties by composite: ${JSON.stringify(payload.top_counties ?? [])}.
Active clusters: ${JSON.stringify(payload.clusters ?? [])}. EpiCore signals: ${JSON.stringify((payload.epicore ?? []).slice(0,5))}.
Write a punchy headline + 3 key findings + 1-line callouts for each notable cluster.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { scope, scope_id, payload, language = "en", force = false } = await req.json();
    if (!scope || !SCHEMAS[scope]) return new Response(JSON.stringify({ error: "invalid scope" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(url, key);

    // Cache lookup (10 min freshness)
    if (!force) {
      const { data: cached } = await supa
        .from("ai_insights")
        .select("*")
        .eq("scope", scope).eq("scope_id", scope_id).eq("language", language)
        .order("generated_at", { ascending: false }).limit(1).maybeSingle();
      if (cached && (Date.now() - new Date(cached.generated_at).getTime()) < 10*60*1000) {
        return new Response(JSON.stringify({ cached: true, ...cached }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_BASE },
        { role: "user", content: buildPrompt(scope, payload, language) },
      ],
      tools: [{
        type: "function",
        function: {
          name: `emit_${scope}_insight`,
          description: `Emit the ${scope}-scope insight as JSON.`,
          parameters: SCHEMAS[scope],
        },
      }],
      tool_choice: { type: "function", function: { name: `emit_${scope}_insight` } },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (aiRes.status === 429 || aiRes.status === 402) {
      return new Response(JSON.stringify({ error: aiRes.status === 429 ? "rate_limited" : "credits_required" }), {
        status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("ai gateway", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai_failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = {};
    try {
      parsed = JSON.parse(toolCall?.function?.arguments ?? "{}");
    } catch (e) { console.error("parse", e); }

    // Normalize per scope
    let insight = "", recommendations: any[] = [], drivers = payload?.drivers ?? [];
    if (scope === "user") { insight = parsed.insight ?? ""; recommendations = parsed.recommendations ?? []; }
    else if (scope === "county") { insight = parsed.summary ?? ""; recommendations = parsed.watchlist ?? []; }
    else if (scope === "simulator") { insight = parsed.delta_explanation ?? ""; recommendations = parsed.top_factors ?? []; }
    else { insight = `${parsed.headline ?? ""}`; recommendations = parsed.key_findings ?? []; drivers = parsed.cluster_callouts ?? []; }

    const { data: saved } = await supa.from("ai_insights").insert({
      scope, scope_id, language, insight, recommendations, drivers,
    }).select().single();

    return new Response(JSON.stringify({ cached: false, ...saved, raw: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

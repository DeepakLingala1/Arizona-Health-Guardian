import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightPayload {
  scope: "user" | "county" | "simulator" | "weekly";
  scope_id: string;
  context: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are AZ Health Pulse — an AI assistant for an Arizona community health risk platform.
You provide concise, plain-English risk insights tailored to Arizona context (extreme heat, dust storms, monsoon season, Valley Fever, wildfire smoke, ozone in Maricopa/Pima).
You are warm, never alarmist, and always actionable. You are NOT a doctor — when scores are high, suggest contacting a healthcare provider.
Keep insights to 3–4 sentences. Recommendations must be specific (e.g., "wear an N95 outdoors today" not "be careful").`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { scope, scope_id, context }: InsightPayload = await req.json();

    // Cache: return existing insight if <2h old
    const { data: cached } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("scope", scope)
      .eq("scope_id", scope_id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cacheAgeMs = cached ? Date.now() - new Date(cached.generated_at as string).getTime() : Infinity;
    if (cached && cacheAgeMs < 2 * 60 * 60 * 1000 && !context?.force) {
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = buildPrompt(scope, context);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_insight",
              description: "Submit a structured risk insight",
              parameters: {
                type: "object",
                properties: {
                  insight: { type: "string", description: "3-4 sentence plain English risk insight" },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                    description: "Exactly 3 specific actionable recommendations",
                  },
                  drivers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        weight: { type: "number" },
                      },
                      required: ["label", "weight"],
                    },
                    description: "Top 3 risk drivers with weights",
                  },
                },
                required: ["insight", "recommendations", "drivers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_insight" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResp.text();
      console.error("AI gateway", aiResp.status, t);
      // Fallback to cached if available
      if (cached) {
        return new Response(JSON.stringify({ ...cached, fallback: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: { insight: string; recommendations: string[]; drivers: { label: string; weight: number }[] };
    try {
      parsed = JSON.parse(toolCall?.function?.arguments ?? "{}");
    } catch {
      parsed = { insight: data.choices?.[0]?.message?.content ?? "Unable to parse insight.", recommendations: [], drivers: [] };
    }

    const { data: inserted } = await supabase
      .from("ai_insights")
      .insert({
        scope,
        scope_id,
        insight: parsed.insight,
        recommendations: parsed.recommendations,
        drivers: parsed.drivers,
      })
      .select()
      .single();

    return new Response(JSON.stringify(inserted ?? parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insight error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildPrompt(scope: string, ctx: Record<string, unknown>): string {
  if (scope === "user") {
    return `Generate a personal risk insight for an Arizona resident.
Score: ${ctx.score}/100 (band: ${ctx.band})
County: ${ctx.county}
Reported symptoms: ${JSON.stringify(ctx.symptoms ?? [])}
Recent travel: ${ctx.recent_travel}, Known exposure: ${ctx.known_exposure}
Conditions: ${JSON.stringify(ctx.conditions ?? [])}
Local weather: ${JSON.stringify(ctx.weather ?? {})}
Local air quality: ${JSON.stringify(ctx.air_quality ?? {})}
County aggregate risk: ${ctx.county_aggregate}
Top risk drivers: ${JSON.stringify(ctx.drivers ?? [])}

Write a 3-4 sentence insight in plain English explaining WHY their risk is at this level today. Then 3 specific Arizona-aware recommendations.`;
  }
  if (scope === "county") {
    return `Generate a county-level health summary for ${ctx.county} County, Arizona.
Aggregate risk: ${ctx.aggregate_risk}/100
Recent check-ins (24h): ${ctx.checkin_count}
Top symptoms: ${JSON.stringify(ctx.top_symptoms ?? [])}
Detected clusters: ${JSON.stringify(ctx.clusters ?? [])}
Weather: ${JSON.stringify(ctx.weather ?? {})}
Air quality: ${JSON.stringify(ctx.air_quality ?? {})}

Write 3-4 sentences summarizing what's happening in this county today and 3 community-level recommendations.`;
  }
  if (scope === "simulator") {
    return `An Arizona resident is considering travel from ${ctx.from} County to ${ctx.to} County for ${ctx.days} days.
Origin risk: ${ctx.from_risk}, Destination risk: ${ctx.to_risk}, Projected personal score: ${ctx.projected}.
Key delta drivers: ${JSON.stringify(ctx.delta_drivers ?? [])}.

Explain in 3 sentences how this trip changes their risk and give 3 trip-specific precautions.`;
  }
  // weekly
  return `Generate a weekly Arizona public health digest.
Top counties by risk: ${JSON.stringify(ctx.top_counties ?? [])}
Detected clusters this week: ${JSON.stringify(ctx.clusters ?? [])}
State-level trend: ${ctx.trend ?? "stable"}.

Write 3-4 sentences and 3 statewide recommendations.`;
}

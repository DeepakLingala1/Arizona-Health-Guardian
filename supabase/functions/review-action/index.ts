// Spark AZ — analyst HITL action endpoint (approve / edit / reject) with audit log
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supaUrl, supaAnon, { global: { headers: { Authorization: authHeader } } });
  const { data: ud } = await userClient.auth.getUser();
  if (!ud?.user) return new Response(JSON.stringify({ error: "no_user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const admin = createClient(supaUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: profile } = await admin.from("profiles").select("role").eq("id", ud.user.id).maybeSingle();
  if (profile?.role !== "analyst") return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { alert_id, action, title, body: alertBody, notes } = await req.json();
  if (!alert_id || !["approve","edit","reject"].includes(action)) {
    return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: before } = await admin.from("alerts").select("*").eq("id", alert_id).maybeSingle();
  if (!before) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let update: any = { reviewed_by: ud.user.id, reviewed_at: new Date().toISOString(), review_notes: notes ?? null };
  if (action === "approve") update.status = "approved";
  if (action === "reject") update.status = "rejected";
  if (action === "edit") {
    update.status = "edited";
    if (title) update.title = title;
    if (alertBody) update.body = alertBody;
  }

  const { data: after } = await admin.from("alerts").update(update).eq("id", alert_id).select().single();
  await admin.from("review_log").insert({ alert_id, actor: ud.user.id, action, before, after });

  return new Response(JSON.stringify({ ok: true, alert: after }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

// Spark AZ — fetch travel arrivals (OpenSky, no key) and join with EpiCore travel-pathway signals
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_ARRIVALS = [
  { airport: "KPHX", origin: "MMHO", origin_label: "Hermosillo, MX", time: new Date(Date.now()-2*3600000).toISOString() },
  { airport: "KPHX", origin: "KSAN", origin_label: "San Diego, CA", time: new Date(Date.now()-5*3600000).toISOString() },
  { airport: "KPHX", origin: "MMMX", origin_label: "Mexico City, MX", time: new Date(Date.now()-8*3600000).toISOString() },
  { airport: "KTUS", origin: "MMHO", origin_label: "Hermosillo, MX", time: new Date(Date.now()-12*3600000).toISOString() },
  { airport: "KPHX", origin: "KLAX", origin_label: "Los Angeles, CA", time: new Date(Date.now()-14*3600000).toISOString() },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Try OpenSky for KPHX last 24h. Falls back gracefully.
  let arrivals: any[] = [];
  const end = Math.floor(Date.now()/1000);
  const begin = end - 86400;
  try {
    const r = await fetch(`https://opensky-network.org/api/flights/arrival?airport=KPHX&begin=${begin}&end=${end}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const data = await r.json();
      arrivals = (data ?? []).slice(0, 12).map((f: any) => ({
        airport: "KPHX",
        origin: f.estDepartureAirport ?? "?",
        origin_label: f.estDepartureAirport ?? "Unknown",
        time: new Date((f.lastSeen ?? end) * 1000).toISOString(),
      }));
    }
  } catch (e) { console.error("opensky", e); }
  if (arrivals.length === 0) arrivals = FALLBACK_ARRIVALS;

  // EpiCore travel-pathway items in last 14 days
  const since = new Date(Date.now() - 14*86400000).toISOString();
  const { data: epicore } = await supa.from("epicore_feed")
    .select("*").eq("pathway", "travel").gte("observed_at", since)
    .order("observed_at", { ascending: false });

  // Heuristic match: if any arrival's origin label contains a region keyword from epicore.region
  const matches = (epicore ?? []).map((e:any) => {
    const keys = e.region.toLowerCase().split(/[, ]+/).filter(Boolean);
    const matched = arrivals.filter(a => keys.some((k: string) => a.origin_label.toLowerCase().includes(k)));
    return { ...e, matched_arrivals: matched };
  });

  return new Response(JSON.stringify({ arrivals, watch: matches }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

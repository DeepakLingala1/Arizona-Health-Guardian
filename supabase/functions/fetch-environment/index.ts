// Spark AZ — fetch weather + air quality for a county (Open-Meteo, no key)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COUNTIES: Record<string, [number, number]> = {
  Apache: [35.39,-109.49], Cochise: [31.88,-109.75], Coconino: [35.84,-111.77],
  Gila: [33.80,-110.81], Graham: [32.93,-109.89], Greenlee: [33.21,-109.24],
  "La Paz": [33.73,-113.97], Maricopa: [33.45,-112.07], Mohave: [35.20,-114.05],
  Navajo: [35.40,-110.32], Pima: [32.22,-110.93], Pinal: [32.90,-111.32],
  "Santa Cruz": [31.52,-110.77], Yavapai: [34.60,-112.55], Yuma: [32.69,-114.63],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const { county } = await req.json().catch(() => ({ county: "Pima" }));
  const coords = COUNTIES[county] ?? COUNTIES.Pima;
  const [lat, lon] = coords;

  let weather: any = null, air: any = null;
  try {
    const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&temperature_unit=fahrenheit&timezone=America/Phoenix`);
    if (wRes.ok) weather = (await wRes.json()).current;
  } catch (e) { console.error("weather", e); }
  try {
    const aRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,ozone,dust&timezone=America/Phoenix`);
    if (aRes.ok) air = (await aRes.json()).current;
  } catch (e) { console.error("air", e); }

  return new Response(JSON.stringify({ county, weather, air_quality: air }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

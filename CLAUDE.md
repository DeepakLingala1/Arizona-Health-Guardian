# Spark AZ — Claude Code Handoff

> **One-Health early-warning prototype for Arizona.** Built for the *Ending Pandemics Academy "Spot the Spark" Challenge* (May 2026, University of Arizona). Originally scaffolded in [Lovable](https://lovable.dev) — this repo is the source of truth going forward.

---

## Quick start

```bash
git clone <this-repo>
cd <repo>
bun install            # or: npm install
cp .env.example .env   # see "Environment" below — fill in Supabase keys
bun run dev            # http://localhost:8080
bun run test           # vitest
bun run build          # production build
bun run lint
```

The app boots into a synthetic-data demo on first load (`SeedBootstrap` in `src/App.tsx` invokes the `seed-demo` and `compute-county-aggregate` edge functions if `checkins < 50`).

---

## What this app is

A One-Health risk dashboard that fuses **human symptom check-ins**, **animal observations**, and **environmental signals** (weather, air quality, vector pressure) into a per-county composite risk score for Arizona's 15 counties. Designed to be **EpiCore integration-ready** and to demonstrate **explainable AI (XAI)** + **human-in-the-loop (HITL) review** for public-health alerts.

### Core user journeys
1. **Daily check-in** (`/checkin`) — symptoms, animal signs, env signals, travel → writes to `checkins`, recomputes county risk.
2. **Dashboard** (`/`) — personalized risk ring, sub-scores, AI insight card, top drivers, recent alerts.
3. **Map** (`/map`) — Leaflet choropleth of Arizona counties using `public/arizona-counties.geojson`, colored by composite risk.
4. **Insights** (`/insights`) — AI-generated narrative summaries per county (Lovable AI Gateway → Gemini/GPT).
5. **Simulator** (`/simulator`) — what-if scenarios on the risk model.
6. **Review queue** (`/review`) — public-health reviewer approves/edits/rejects AI-generated alerts (HITL); every action audit-logged in `review_log`.
7. **Model card** (`/model-card`) and **Data sources** (`/data-sources`) — transparency pages.

### Personas
Defined in `src/lib/personas.ts`: `farmer`, `parent`, `traveler`, `clinician`, `wildlife_observer`, `general`. Each weights sub-scores differently and surfaces tailored recommendations.

---

## Tech stack

- **Frontend**: React 18 + Vite 5 + TypeScript 5, Tailwind 3, shadcn/ui (Radix), framer-motion, lucide-react
- **Routing**: react-router-dom v6 (lazy-loaded routes)
- **State/data**: @tanstack/react-query (60s staleTime, no refetchOnWindowFocus)
- **Maps**: react-leaflet + Leaflet
- **Charts**: recharts
- **Forms**: react-hook-form + zod
- **i18n**: custom hook in `src/lib/i18n.tsx` — English + Spanish
- **Theming**: dark/light via `src/contexts/ThemeContext.tsx`; **all colors are HSL semantic tokens** in `src/index.css` + `tailwind.config.ts` — never hardcode hex/`text-white` etc.
- **Backend**: Supabase (managed by Lovable Cloud originally, but this is a normal Supabase project — see Environment)
- **AI**: Lovable AI Gateway (`google/gemini-2.5-flash` and friends) called from edge functions. **No client-side API keys.**
- **Tests**: vitest + @testing-library/react + jsdom

---

## Repository layout

```
src/
  App.tsx                    # Providers + lazy routes + SeedBootstrap
  main.tsx
  index.css                  # HSL design tokens (light + dark)
  components/
    AppLayout.tsx            # Header, mobile bottom-nav, theme/locale toggles
    AnimatedRiskRing.tsx     # Hero risk visualization
    SubScoreGrid.tsx         # Human / Animal / Env / Vector sub-scores
    XAIPanel.tsx             # Driver explanations
    AIInsightCard.tsx        # AI narrative card
    AlertBanner.tsx
    DataSourceTile.tsx
    ArchitectureDiagram.tsx
    PersonaSwitcher.tsx
    NavLink.tsx
    ui/                      # shadcn primitives — do NOT edit ad-hoc; use variants
  contexts/
    AuthContext.tsx          # Supabase session + profile
    ThemeContext.tsx
  lib/
    riskScore.ts             # Composite scoring algorithm v0.1 (deterministic)
    personas.ts              # Persona definitions + weights
    explain.ts               # XAI driver extraction
    scenarios.ts             # Simulator presets
    simple-kmeans.ts         # Lightweight clustering for hotspots
    azCounties.ts            # AZ county metadata
    i18n.tsx
  pages/
    Dashboard, Checkin, MapPage, Insights, Simulator,
    ReviewQueue, ModelCard, DataSources, Profile, NotFound
  integrations/supabase/     # AUTO-GENERATED — never edit
    client.ts
    types.ts
  test/
    setup.ts
    example.test.ts

supabase/
  config.toml
  migrations/                # Schema — apply via `supabase db push`
  functions/
    seed-demo/               # Populates demo check-ins + county_daily
    compute-county-aggregate # Recomputes county_daily from checkins
    fetch-environment        # Open-Meteo + air quality
    fetch-travel-imports     # OpenSky travel pathway signals
    evaluate-alerts          # Threshold + AI-assisted alert generation
    generate-insight         # Lovable AI narrative per county
    review-action            # HITL approve/edit/reject

public/
  arizona-counties.geojson   # Choropleth source
```

---

## Database schema (key tables)

All in `public` schema, RLS enabled. See `src/integrations/supabase/types.ts` for full types.

- **`profiles`** — `id` (= auth.users.id), `persona`, `home_county`, `language`, `streak`, `role`, `conditions[]`, `age_band`, `onboarded`
- **`checkins`** — symptoms[], animal_signs[], env_signals[], category, county, mood, travel info, computed `risk_score`
- **`county_daily`** — per-county daily aggregate: `composite_risk`, `human_score`, `animal_score`, `env_score`, `vector_score`, top drivers, weather/air quality JSON, kmeans `clusters`
- **`alerts`** — `severity`, `status` (pending/approved/rejected), `ai_generated`, reviewer fields
- **`review_log`** — audit trail (action, actor, before/after JSON) — **never delete from this table**
- **`ai_insights`** — cached LLM narratives per scope (county/state) per language
- **`epicore_feed`** — external hazard feed (region, hazard, severity, pathway)

Roles via `has_role(_uid, _role)` SQL function (security definer pattern). **Never store roles on `profiles`** — use the `has_role` function in RLS policies.

---

## Risk score (the heart of the app)

`src/lib/riskScore.ts` — **deterministic**, no ML. Composite score = persona-weighted blend of:
- **Human score**: weighted symptom severity (fever 15, shortness_of_breath 18, etc.)
- **Animal score**: weighted animal signs (mass_mortality 12, dead_bird_cluster 10, etc.)
- **Env score**: vector/dust/smoke signals
- **Vector score**: mosquito + standing water + monsoon
- Modifiers: known exposure, recent travel, remote-county multiplier

Output: `{ score: 0–100, band: Low|Moderate|Elevated|High, drivers: [{key, contribution, label}] }`. The driver list feeds `XAIPanel` directly — keep it in sync if you change weights.

---

## Edge functions

All deploy automatically with `supabase functions deploy <name>` (or via `supabase db push` for migrations). They use:
- `Deno.env.get("LOVABLE_API_KEY")` for AI Gateway — **set this secret in Supabase project settings** if pulling away from Lovable
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

If migrating off Lovable AI Gateway, swap `generate-insight` and `evaluate-alerts` to call OpenAI / Gemini directly with your own keys.

---

## Environment

`.env` (NEVER commit real values; `.env` is gitignored — create `.env.example` for the team):

```
VITE_SUPABASE_PROJECT_ID=nxlebtzeuwhjpygjueyh
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key — safe to expose>
VITE_SUPABASE_URL=https://nxlebtzeuwhjpygjueyh.supabase.co
```

The `publishable/anon` key is safe in the client. **Service role key stays in edge functions only.**

---

## Conventions & guardrails (read before coding)

1. **Design tokens only** — every color must be an HSL semantic token from `src/index.css`. No `text-white`, `bg-[#abc]`, etc. Add new tokens to both `index.css` (light + dark) and `tailwind.config.ts`.
2. **Don't touch** `src/integrations/supabase/{client,types}.ts` — auto-generated.
3. **Don't touch** files in `src/components/ui/` ad-hoc — extend via `cva` variants.
4. **RLS on every table.** New tables → add policies in the same migration.
5. **Roles** live in a separate table; check via `has_role()` SECURITY DEFINER function. Never trust client-side role claims.
6. **HITL is non-negotiable** — any AI-generated alert must pass through `review-action` and write to `review_log` before going live. Don't add a code path that bypasses review.
7. **Synthetic data only** in this prototype. Don't wire up real PHI without IRB + redesigned auth.
8. **i18n** — every user-facing string goes through `t("key")` in `src/lib/i18n.tsx`. Add EN + ES.
9. **Mobile-first** — bottom nav at `<md`, test at 375px. Header collapses, tap targets ≥ 44px.
10. **Lazy-load heavy routes** (already done in `App.tsx`) — keep `/` (Dashboard) light.

---

## Suggested next features (from the challenge brief)

- [ ] Real-time alert subscriptions via Supabase Realtime on `alerts` table
- [ ] Push/email notifications for approved high-severity alerts
- [ ] EpiCore webhook ingestion → `epicore_feed`
- [ ] Per-persona onboarding wizard (currently `profiles.onboarded` exists but flow is minimal)
- [ ] CSV export from Review queue for public-health teams
- [ ] Model card page: live calibration plot from `checkins` vs. confirmed cases
- [ ] Accessibility pass (focus rings, aria labels, prefers-reduced-motion)
- [ ] Playwright E2E for the check-in → alert → review flow

---

## Prompt to paste into Claude Code on first run

> I'm continuing work on **Spark AZ**, a One-Health early-warning prototype for Arizona built for the Ending Pandemics "Spot the Spark" Challenge. The full project context lives in `CLAUDE.md` at the repo root — read it first.
>
> Stack: Vite + React 18 + TypeScript + Tailwind (HSL semantic tokens only, never hardcoded colors), shadcn/ui, framer-motion, react-router v6 (lazy routes), @tanstack/react-query, react-leaflet, recharts, Supabase (managed Postgres + edge functions, AI via Lovable AI Gateway).
>
> Hard rules:
> 1. Never edit `src/integrations/supabase/client.ts` or `types.ts` — auto-generated.
> 2. Every color must be an HSL semantic token from `src/index.css` + `tailwind.config.ts`. No raw hex, no `text-white`.
> 3. RLS on every new table; roles via `has_role()` SECURITY DEFINER function — never on `profiles`.
> 4. AI-generated alerts MUST pass through the HITL review queue (`review-action` edge function + `review_log` audit table). No bypasses.
> 5. All user-facing strings go through `t()` in `src/lib/i18n.tsx` with EN + ES.
> 6. Mobile-first; test at 375px width.
> 7. Synthetic data only — no real PHI.
>
> Boot the dev server with `bun run dev` (port 8080). Run tests with `bun run test`. Apply DB changes with `supabase db push`.
>
> My next task is: **<describe what you want to build>**.
>
> Before writing code, (a) read the relevant files, (b) confirm your plan in 3–5 bullets, (c) flag anything in `CLAUDE.md` that this task would conflict with.

---

## Credits

Built on Lovable. Open data sources: Open-Meteo, CDC, OpenStreetMap, OpenSky. EpiCore integration-ready.

# Arizona Health Guardian

## Spark AZ: One Health Early Warning for Arizona

Arizona Health Guardian, also called Spark AZ in the app, is a One Health surveillance prototype for Arizona. It combines human symptom check-ins, animal observations, environmental signals, weather, air quality, vector pressure, and travel-import context into an explainable 0-100 county risk score.

The name Spark AZ means spotting the first "spark" of a health threat in Arizona before it grows into a wider public-health event. The project is built for the Ending Pandemics Academy "Spot the Spark" Challenge as a practical early-warning system for residents, clinicians, and public-health teams.

## Project Snapshot

**Problem:** Arizona's outbreak signals are fragmented across people, animals, climate, travel, and local observations. By the time a signal becomes an official case count, the window for low-cost action may already be closing.

**Solution:** Spark AZ gives residents a fast anonymous check-in, turns those reports into county-level One Health risk scores, explains the top drivers, and routes AI-drafted alerts through a protected admin console before anything goes public.

**Why now:** Climate volatility, cross-border travel, vector pressure, wildfire smoke, Valley Fever, West Nile, Hantavirus, and respiratory clusters increasingly overlap in Arizona. Open data, Supabase edge functions, and low-cost AI now make a real-time participatory early-warning layer feasible.

**Who uses it:** Residents, clinicians, ranchers, wildlife observers, travelers, county health departments, tribal health partners, and public-health analysts. The main app is shared for residents and analysts, while analyst-only review actions live in the Admin Console.

**What makes it different:** It is not a generic symptom tracker. It fuses human, animal, vector, environmental, travel, and community pressure into one explainable score, with bilingual EN/ES UX and human-in-the-loop alert governance.

## Why This Project Scores Strongly

- **Clear public-health need:** earlier detection for Arizona-specific threats across urban, rural, border, and tribal contexts
- **Full working product:** resident check-in, dashboard, map, insights, protected admin console, analyst review queue, data sources, and Arizona playbook
- **Explainable scoring:** transparent 0-100 risk score with human, animal, vector, environmental, community, and persona-driven inputs
- **Responsible AI workflow:** AI can draft insights and alerts, but public-facing alerts require human analyst review
- **Real deployment path:** Supabase backend, edge functions, audit logs, seed data, and a partner-facing roadmap/model-card brief toward county pilots and live integrations
- **Equity by design:** bilingual EN/ES interface, anonymous reporting, mobile-first UX, and coverage for all 15 Arizona counties

## The Risk Score

Spark AZ produces a deterministic 0-100 composite score:

- **Low:** 0-24
- **Moderate:** 25-49
- **Elevated:** 50-74
- **High:** 75-100

The score starts from a baseline and adds weighted signals from:

- **Human:** fever, shortness of breath, cough, fatigue, GI symptoms, known exposure, recent travel, mood
- **Animal:** sick livestock, dead-bird clusters, rodent activity, unusual pet symptoms, mass mortality, dead wildlife
- **Vector:** mosquito activity, standing water, monsoon conditions
- **Environmental:** AQI, PM2.5, dust, extreme heat, smoke, dust storms
- **Community:** county composite pressure and travel-import signals
- **Persona modifiers:** farmer, parent, traveler, clinician, wildlife observer, and general profiles
- **Chronic-condition modifiers:** examples include asthma plus elevated AQI, or diabetes plus community spread

Every score exposes driver bars so the user can see why the number moved.

## What Is Built

- Anonymous One Health check-in flow
- Personalized dashboard with animated risk ring and 7-day trend chart
- Arizona county choropleth map using county-level risk layers
- AI insight cards backed by Supabase edge functions
- Explainability panel with weighted risk drivers
- Protected Admin Console for analyst-only alert review
- Human-in-the-loop review queue for AI-generated alerts
- Review audit log for approve, edit, and reject actions
- CSV export for alert and review activity
- Data sources page and Arizona playbook inside the app
- Model card, system architecture, rubric coverage, and roadmap moved into a short partner/judge brief
- Bilingual English and Spanish interface
- Synthetic seed demo covering all 15 Arizona counties
- Scenario coverage for West Nile, Hantavirus, dengue travel import, dust/heat, and respiratory clusters

## Live Demo And Presentation Materials

- **Live app:** https://arizona-health-guardian.vercel.app
- **Admin console route:** `/admin`
- **Roadmap + Model Card Canva deck:** https://www.canva.com/d/GEhyQJ4bYtgEW-U
- **Editable Canva deck:** https://www.canva.com/d/nBrqLoZsxre19kU

The Roadmap and Model Card were intentionally removed from top-level app navigation. In a production-style product, residents and analysts see workflow features first; model transparency, rubric alignment, system architecture, limitations, and future roadmap are packaged as partner/judge materials instead.

## Arizona Use Cases

**Maricopa County:** dead birds, mosquito pressure, and standing water raise vector risk before West Nile lab confirmations arrive.

**Apache / Navajo Counties:** rodent activity and livestock signals from remote tribal areas are weighted so low-volume reports are not ignored.

**Yuma / Santa Cruz Counties:** dengue signals from Sonora plus cross-border travel reports create a clinician-ready travel-import advisory.

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- shadcn/ui and Radix primitives
- Framer Motion
- React Router
- TanStack Query
- Recharts
- Leaflet / React Leaflet
- Supabase database, auth, migrations, and edge functions
- Lovable AI Gateway / Gemini 2.5 Flash for narrative insights
- Vitest and Testing Library

## Project Structure

```text
src/
  App.tsx                         App providers, routes, onboarding gate, seed bootstrap
  components/                     Dashboard, layout, risk, chart, XAI, and UI components
  contexts/                       Auth and theme providers
  lib/                            Risk score, personas, i18n, explainability, scenarios
  pages/                          Dashboard, check-in, map, insights, admin, data sources, playbook, profile
  integrations/supabase/          Generated Supabase client and types
  test/                           Vitest setup and examples

supabase/
  migrations/                     Database schema and policies
  functions/
    seed-demo/                    Synthetic Arizona check-ins, alerts, and EpiCore-style feed
    compute-county-aggregate/     County risk aggregation and clustering
    evaluate-alerts/              Threshold scanner for pending alerts
    generate-insight/             AI narrative generation
    review-action/                Human review workflow and audit logging
    fetch-environment/            Open-Meteo weather and air quality
    fetch-travel-imports/         OpenSky travel-import signal join

```

## Run Locally

```bash
npm install
npm run dev
```

The app runs on the Vite dev server. If Supabase is configured, the app seeds synthetic demo data on first load when the `checkins` table has fewer than 50 rows.

Useful commands:

```bash
npm run build
npm run test
npm run lint
```

## Environment

Create a local `.env` file with:

```bash
VITE_SUPABASE_PROJECT_ID=<project id>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_URL=<supabase url>
```

Do not commit service-role keys or real health data. This prototype is designed for synthetic data unless a real deployment has appropriate public-health, privacy, and IRB review.

## Governance

Spark AZ does not publish AI-generated alerts directly. Alerts are created in a pending state and must be approved, edited, or rejected by a public-health analyst. Each action is written to `review_log` with before/after context.

## Status

Built for the University of Arizona Ending Pandemics Academy "Spot the Spark" Challenge, May 2026.

## Rubric Fulfillment

This section maps the challenge's weighted judging rubric to the project evidence.

| Rubric scoring point | Weight | How Arizona Health Guardian fulfills it |
| --- | ---: | --- |
| **Impact and relevance to the problem** | **30%** | Directly addresses the challenge goal: turning self-reported human, animal, and environmental signals into individual and county-level risk profiles for emerging infectious disease threats. The app is Arizona-specific, covers all 15 counties, and includes concrete scenarios for West Nile, Hantavirus, dengue travel import, dust/heat, and respiratory clusters. |
| **Feasibility and clarity of approach** | **20%** | Uses a clear architecture: anonymous check-ins flow into Supabase, edge functions aggregate county signals, a deterministic 0-100 model generates risk bands, and AI-generated alerts enter a human analyst review queue. The data sources page plus the external Roadmap + Model Card brief make the approach understandable and deployable. |
| **Technical execution and innovation** | **25%** | Implements a working React/Vite application with Supabase database schema, migrations, edge functions, seeded demo data, county map, risk dashboard, AI insight generation, k-means-style cluster detection, travel-import context, trend charts, CSV export, and audit logging. Innovation comes from fusing One Health signals with explainable AI and human-in-the-loop alert governance. |
| **Usability and user experience** | **15%** | Provides a mobile-first, bilingual EN/ES experience with a fast check-in flow, persona-aware onboarding, dashboard risk ring, map drill-downs, command palette, clear risk bands, and analyst review tools. The design supports both regular public reporting and public-health analyst workflows. |
| **Presentation and demo quality** | **10%** | Includes seeded synthetic data for a live demo, named Arizona scenarios, data source documentation, an Arizona playbook, a combined Roadmap + Model Card brief, and this README as a technical and product overview. The prototype can be demonstrated end-to-end from resident report to risk score to analyst-reviewed alert. |

## Challenge Requirement Coverage

| Challenge requirement | Project coverage |
| --- | --- |
| **Interfaces and engagement strategies for Arizona users** | Persona-aware onboarding, resident check-in flow, bilingual UI, mobile-first layout, dashboard feedback, map views, and tailored risk explanations are designed to attract and retain regular reporting. |
| **AI/ML incorporation** | Gemini-powered insight generation supports risk narratives and alert drafting. The system also uses clustering to surface county-level signal patterns from self-reported symptoms and concerns. |
| **How the tool would be used in Arizona** | The Arizona playbook describes real use cases for Maricopa, Apache/Navajo, Yuma/Santa Cruz, Pinal, and Pima contexts, including county, tribal, border, vector, and respiratory workflows. |
| **Model card for performance and explainability** | The combined Roadmap + Model Card brief explains model purpose, inputs, scoring logic, system architecture, limitations, governance, planned metrics, and rubric alignment. It is kept outside the daily app workflow so the product UI stays focused on reporting and analyst response. |
| **No private health data required** | The prototype is anonymous, no-PII by design, and intended for synthetic data unless deployed under appropriate public-health and privacy review. |
| **Preferred open/public data sources** | Uses or is prepared for Open-Meteo, OpenSky, county GeoJSON, CDC/ADHS-style reference context, EpiCore-style signals, and future EpiCore API integration. |
| **Required deliverables** | Supports a live demo, short solution summary, technical architecture, model card, human-in-the-loop workflow, future roadmap, and presentation materials. |

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Checkin from "@/pages/Checkin";
import { CommunityGauge } from "@/components/CommunityGauge";
import { RiskRing } from "@/components/RiskRing";
import { XAIPanel } from "@/components/XAIPanel";
import { buildXAI, CATEGORY_COLOR } from "@/lib/explain";
import { computeRisk } from "@/lib/riskScore";

interface MockSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: (() => {
    const user = { id: "mock-user" };
    const profile = {
      id: "mock-user",
      age_band: null,
      conditions: [],
      home_county: "Pima",
      streak: 0,
      last_checkin_date: null,
      persona: "urban",
      language: "en",
      role: "resident",
      onboarded: true,
    };
    const refreshProfile = vi.fn();
    const signOut = vi.fn();
    return () => ({
      user,
      profile,
      loading: false,
      refreshProfile,
      signOut,
    });
  })(),
}));

const dictionary: Record<string, string> = {
  "home.drivers": "What's driving this score",
  "home.contribution": "Your county's contribution",
  "home.contribReports": "reports today",
  "home.contribTarget": "target for signal detection",
  "home.contribAddOne": "Add yours ->",
  "home.signal.human": "Human",
  "home.signal.animal": "Animal",
  "home.signal.vector": "Vector",
  "home.signal.environment": "Environment",
  "checkin.title": "One Health check-in",
  "checkin.subtitle": "Report what you're seeing in yourself, your animals, and your environment.",
  "checkin.tab.self": "Self",
  "checkin.tab.animal": "Animals",
  "checkin.tab.environment": "Environment",
  "checkin.fineToday": "I'm fine today",
  "checkin.mood": "How are you feeling?",
  "checkin.symptoms": "Any symptoms?",
  "checkin.exposure": "Known exposure to someone sick",
  "checkin.travel": "Recent travel (last 7 days)",
  "checkin.travelTo": "Where to?",
  "checkin.animalType": "Type of animal",
  "checkin.animalSigns": "Signs you observed",
  "checkin.animalCount": "How many animals?",
  "checkin.envSignals": "What did you notice in your environment?",
  "checkin.notes": "Notes (optional)",
  "common.county": "County",
  "common.submit": "Submit",
  "band.Low": "Low",
  "band.Moderate": "Moderate",
  "band.Elevated": "Elevated",
  "band.High": "High",
};

vi.mock("@/lib/i18n", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => dictionary[key] ?? key,
  }),
}));

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, min = 1, max = 10 }: MockSliderProps) => (
    <input
      aria-label="mock-slider"
      type="range"
      min={min}
      max={max}
      value={value[0]}
      onChange={(event) => onValueChange([Number(event.currentTarget.value)])}
    />
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("mock check-in flow and app output", () => {
  it("turns a mock symptom/travel input into the expected 71 Elevated score", () => {
    const result = computeRisk({
      symptoms: ["fever", "shortness_of_breath", "cough"],
      mood: 3,
      knownExposure: false,
      recentTravel: true,
      county: "Pima",
      persona: "urban",
    });

    expect(result.composite).toBe(71);
    expect(result.band).toBe("Elevated");
    expect(result.subscores.human).toBe(51);
    expect(result.drivers).toEqual([
      { label: "Reported symptoms (3)", weight: 40, category: "human" },
      { label: "Baseline", weight: 20, category: "baseline" },
      { label: "Recent travel", weight: 6, category: "human" },
      { label: "How you're feeling", weight: 5, category: "human" },
    ]);
  });

  it("shows category colors separately from score direction in explainability", () => {
    const risk = computeRisk({
      symptoms: ["fever", "shortness_of_breath", "cough"],
      mood: 3,
      knownExposure: false,
      recentTravel: true,
      county: "Pima",
      persona: "urban",
    });

    const bars = buildXAI(risk.drivers);
    const symptoms = bars.find((bar) => bar.label === "Reported symptoms (3)");

    expect(symptoms).toMatchObject({
      weight: 40,
      direction: "up",
      category: "human",
    });
    expect(CATEGORY_COLOR.human).toBe("hsl(var(--primary))");

    const recovery = buildXAI([{ label: "Recovery streak", weight: -10, category: "human" }])[0];
    expect(recovery.direction).toBe("down");
  });

  it("renders the corrected tooltip text and driver values", () => {
    const risk = computeRisk({
      symptoms: ["fever", "shortness_of_breath", "cough"],
      mood: 3,
      knownExposure: false,
      recentTravel: true,
      county: "Pima",
      persona: "urban",
    });

    render(<XAIPanel drivers={risk.drivers} />);

    expect(screen.getByText("Reported symptoms (3)")).toBeInTheDocument();
    expect(screen.getByText("+40")).toBeInTheDocument();
    expect(screen.getByText("Baseline")).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument();
    expect(screen.getByText(/Up arrows and positive values increase the score/)).toBeInTheDocument();
    expect(screen.queryByText(/Green pushes down, red pushes up/)).not.toBeInTheDocument();
  });

  it("updates the live check-in preview after mock user input", async () => {
    render(
      <MemoryRouter>
        <Checkin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("mock-slider"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Fever" }));
    fireEvent.click(screen.getByRole("button", { name: "Shortness of breath" }));
    fireEvent.click(screen.getByRole("button", { name: "Cough" }));
    fireEvent.click(screen.getByRole("button", { name: "Recent travel (last 7 days)" }));

    await waitFor(() => expect(screen.getByText("71")).toBeInTheDocument());
    expect(screen.getByText("Elevated")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit/ })).toBeEnabled();
  });

  it("switches check-in feature tabs and exposes their expected inputs", async () => {
    render(
      <MemoryRouter>
        <Checkin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Any symptoms?")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: "Animals" }));
    await waitFor(() => expect(screen.getByText("Sick livestock")).toBeInTheDocument());
    expect(screen.getByText("Dead birds (cluster)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Environment" }));
    await waitFor(() => expect(screen.getByText("High mosquito activity")).toBeInTheDocument());
    expect(screen.getByText("Wildfire smoke")).toBeInTheDocument();
  });

  it("renders supporting feature widgets with correct output states", () => {
    render(
      <MemoryRouter>
        <CommunityGauge county="Pima" reportsToday={125} target={100} />
        <RiskRing score={71} band="Elevated" bandLabel="Elevated" />
      </MemoryRouter>
    );

    expect(screen.getByText("125")).toBeInTheDocument();
    expect(screen.getByText("Signal detection unlocked")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Elevated: 71 of 100" })).toBeInTheDocument();
  });
});

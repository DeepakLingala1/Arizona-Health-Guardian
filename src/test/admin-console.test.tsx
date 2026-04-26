import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminConsole from "@/pages/AdminConsole";

const authState = vi.hoisted(() => ({
  role: "public",
  profileMissing: false,
  loading: false,
  refreshProfile: vi.fn(),
}));

vi.mock("@/pages/ReviewQueue", () => ({
  default: () => <div>mock review queue</div>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "mock-user" },
    profile: authState.profileMissing ? null : {
      id: "mock-user",
      role: authState.role,
      home_county: "Pima",
      age_band: null,
      conditions: [],
      streak: 0,
      last_checkin_date: null,
      persona: "urban",
      language: "en",
      onboarded: true,
    },
    loading: authState.loading,
    refreshProfile: authState.refreshProfile,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

const dictionary: Record<string, string> = {
  "nav.admin": "Admin console",
  "admin.title": "Admin console",
  "admin.subtitle": "Protected analyst workspace for alert review, publishing decisions, and audit history.",
  "admin.lockedTitle": "Admin console requires analyst access",
  "admin.lockedBody": "Resident and shared pages stay open, but approving, editing, rejecting, and auditing public alerts is restricted to the analyst role.",
  "admin.currentRole": "Current role",
  "admin.requiredRole": "Required role",
  "admin.demoAccess": "Enable demo analyst access",
  "admin.demoHint": "For production, this role should be assigned through an organization admin or identity provider.",
  "admin.roleVerified": "Role verified",
  "admin.reviewMetric": "Approve, edit, or reject pending alerts.",
  "admin.rlsProtected": "Role policies active",
  "admin.rlsMetric": "Pending alerts and logs require analyst access.",
  "admin.auditReady": "Audit log enabled",
  "admin.auditMetric": "Every review action keeps before and after context.",
  "review.title": "Alert review queue",
};

vi.mock("@/lib/i18n", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => dictionary[key] ?? key,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("AdminConsole", () => {
  beforeEach(() => {
    authState.role = "public";
    authState.profileMissing = false;
    authState.loading = false;
    authState.refreshProfile.mockClear();
  });

  it("keeps residents in a protected admin access gate", () => {
    render(<AdminConsole />);

    expect(screen.getByText("Admin console requires analyst access")).toBeInTheDocument();
    expect(screen.getByText("public")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable demo analyst access" })).toBeInTheDocument();
    expect(screen.queryByText("mock review queue")).not.toBeInTheDocument();
  });

  it("does not render blank while the profile is still missing", () => {
    authState.profileMissing = true;

    render(<AdminConsole />);

    expect(screen.getByText("Admin console requires analyst access")).toBeInTheDocument();
    expect(screen.getByText("public")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable demo analyst access" })).toBeInTheDocument();
  });

  it("shows the review queue for analyst users", () => {
    authState.role = "analyst";

    render(<AdminConsole />);

    expect(screen.getByRole("heading", { name: "Admin console" })).toBeInTheDocument();
    expect(screen.getByText("Role verified")).toBeInTheDocument();
    expect(screen.getByText("mock review queue")).toBeInTheDocument();
  });
});

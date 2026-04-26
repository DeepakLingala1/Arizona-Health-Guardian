import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Suspense, lazy, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandPalette, useCommandPaletteHotkey } from "@/components/CommandPalette";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy-loaded heavier routes — keeps first paint fast on /
const Checkin = lazy(() => import("./pages/Checkin"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Insights = lazy(() => import("./pages/Insights"));
const Simulator = lazy(() => import("./pages/Simulator"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminConsole = lazy(() => import("./pages/AdminConsole"));
const DataSources = lazy(() => import("./pages/DataSources"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Playbook = lazy(() => import("./pages/Playbook"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

function SeedBootstrap() {
  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("checkins").select("id", { count: "exact", head: true });
      if ((count ?? 0) < 50) {
        await supabase.functions.invoke("seed-demo");
        await supabase.functions.invoke("compute-county-aggregate", { body: {} });
        // Fire the threshold scanner so the analyst-facing pending alerts exist on first load.
        await supabase.functions.invoke("evaluate-alerts", { body: {} });
      }
    })().catch(console.error);
  }, []);
  return null;
}

// Routes a user can visit even before completing onboarding (public marketing pages + the wizard itself).
const PRE_ONBOARD_ALLOWED = new Set([
  "/onboarding", "/data-sources", "/playbook",
]);

function OnboardingGate({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading || !profile) return <>{children}</>;
  if (profile.onboarded) return <>{children}</>;
  if (location.pathname === "/review" || location.pathname === "/admin" || location.pathname.startsWith("/admin/")) return <>{children}</>;
  if (PRE_ONBOARD_ALLOWED.has(location.pathname)) return <>{children}</>;
  return <Navigate to="/onboarding" replace />;
}

function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  useCommandPaletteHotkey(setOpen);
  return <CommandPalette open={open} onOpenChange={setOpen} />;
}

function RouteFallback() {
  return (
    <div className="container max-w-[1200px] py-10">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-44 animate-pulse" />
            <div className="h-3 bg-muted rounded w-72 max-w-full animate-pulse" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-6">
          <div className="h-28 bg-muted rounded-xl animate-pulse" />
          <div className="h-28 bg-muted rounded-xl animate-pulse" />
          <div className="h-28 bg-muted rounded-xl animate-pulse" />
        </div>
        <div className="h-48 bg-muted rounded-xl mt-3 animate-pulse" />
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LocaleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <SeedBootstrap />
              <GlobalCommandPalette />
              <AppLayout>
                <OnboardingGate>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/checkin" element={<Checkin />} />
                      <Route path="/map" element={<MapPage />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/simulator" element={<Simulator />} />
                      <Route path="/admin" element={<AdminConsole />} />
                      <Route path="/admin/review" element={<Navigate to="/admin" replace />} />
                      <Route path="/review" element={<Navigate to="/admin" replace />} />
                      <Route path="/playbook" element={<Playbook />} />
                      <Route path="/data-sources" element={<DataSources />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </OnboardingGate>
              </AppLayout>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

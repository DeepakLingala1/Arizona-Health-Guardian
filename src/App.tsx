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
const ReviewQueue = lazy(() => import("./pages/ReviewQueue"));
const ModelCard = lazy(() => import("./pages/ModelCard"));
const DataSources = lazy(() => import("./pages/DataSources"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
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
  "/onboarding", "/model-card", "/data-sources", "/playbook", "/roadmap",
]);

function OnboardingGate({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading || !profile) return <>{children}</>;
  if (profile.onboarded) return <>{children}</>;
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
    <div className="container max-w-[1200px] py-12 space-y-4 animate-pulse">
      <div className="h-7 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-64 bg-muted rounded-2xl" />
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
                      <Route path="/review" element={<ReviewQueue />} />
                      <Route path="/playbook" element={<Playbook />} />
                      <Route path="/roadmap" element={<Roadmap />} />
                      <Route path="/model-card" element={<ModelCard />} />
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

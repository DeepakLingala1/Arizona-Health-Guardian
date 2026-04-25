import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Suspense, lazy, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      }
    })().catch(console.error);
  }, []);
  return null;
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
              <AppLayout>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/checkin" element={<Checkin />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/simulator" element={<Simulator />} />
                    <Route path="/review" element={<ReviewQueue />} />
                    <Route path="/model-card" element={<ModelCard />} />
                    <Route path="/data-sources" element={<DataSources />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

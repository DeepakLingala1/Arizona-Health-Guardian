import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./pages/Dashboard";
import Checkin from "./pages/Checkin";
import MapPage from "./pages/MapPage";
import Insights from "./pages/Insights";
import Simulator from "./pages/Simulator";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

function SeedBootstrap() {
  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("checkins").select("id", { count: "exact", head: true });
      if ((count ?? 0) < 50) {
        await supabase.functions.invoke("seed-demo");
        // Then compute aggregates
        await supabase.functions.invoke("compute-county-aggregate", { body: {} });
      }
    })().catch(console.error);
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SeedBootstrap />
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/checkin" element={<Checkin />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

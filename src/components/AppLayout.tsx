import { NavLink, useLocation } from "react-router-dom";
import { Activity, Home, ClipboardCheck, Map, Sparkles, MoreHorizontal, Moon, Sun, Flame, FileText, Database, ShieldCheck, Beaker, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { profile } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const NAV = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/checkin", label: t("nav.checkin"), icon: ClipboardCheck },
    { to: "/map", label: t("nav.map"), icon: Map },
    { to: "/insights", label: t("nav.insights"), icon: Sparkles },
  ];
  const MORE = [
    { to: "/simulator", label: t("nav.simulator"), icon: Beaker },
    { to: "/review", label: t("nav.review"), icon: ShieldCheck },
    { to: "/model-card", label: t("nav.modelCard"), icon: FileText },
    { to: "/data-sources", label: t("nav.dataSources"), icon: Database },
    { to: "/profile", label: t("nav.profile"), icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16 max-w-[1200px]">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-spark animate-spark-pulse" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base tracking-tight">{t("app.name")}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.subtitle")}</div>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  "relative px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && (
                      <motion.span layoutId="active-nav" className="absolute inset-0 bg-secondary rounded-xl -z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-2">
                <MoreHorizontal className="w-4 h-4" />{t("nav.more")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {MORE.map(({ to, label, icon: Icon }) => (
                  <DropdownMenuItem key={to} asChild>
                    <NavLink to={to} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4 text-primary" />{label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === "en" ? "es" : "en")}
              className="hidden sm:inline-flex h-9 px-3 rounded-xl border border-border hover:bg-secondary text-xs font-medium uppercase tracking-wider"
              aria-label="Toggle language">{locale}</button>
            {profile && profile.streak > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark/10 text-spark text-sm font-semibold tabular-nums">
                <Flame className="w-4 h-4" />{profile.streak}
              </div>
            )}
            <button onClick={toggle}
              className="w-9 h-9 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center justify-center"
              aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="hidden md:block border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for the Ending Pandemics Academy "Spot the Spark" Challenge — May 2026, University of Arizona. Synthetic data prototype. Open data: Open-Meteo, CDC, OpenStreetMap, OpenSky. EpiCore integration-ready.
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 px-2 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

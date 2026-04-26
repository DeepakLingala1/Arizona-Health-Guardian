import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, Home, ClipboardCheck, Map, Sparkles, MoreHorizontal, Moon, Sun, Flame,
  Database, ShieldCheck, Beaker, User, Search, MapPin, LogOut,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { profile, user, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const reduceMotion = useReducedMotion();
  const isAnalyst = profile?.role === "analyst";

  async function handleSignOut() {
    if (typeof window !== "undefined" && !window.confirm(t("auth.signOutConfirm"))) return;
    await signOut();
  }

  // First two characters of the anon UUID make a friendly avatar mark; falls back to user icon.
  const avatarMark = user?.id ? user.id.slice(0, 2).toUpperCase() : null;

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  const NAV = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/checkin", label: t("nav.checkin"), icon: ClipboardCheck },
    { to: "/map", label: t("nav.map"), icon: Map },
    { to: "/insights", label: t("nav.insights"), icon: Sparkles },
  ];
  const MORE = [
    { to: "/simulator", label: t("nav.simulator"), icon: Beaker },
    { to: "/admin", label: t("nav.admin"), icon: ShieldCheck },
    { to: "/playbook", label: t("nav.playbook"), icon: MapPin },
    { to: "/data-sources", label: t("nav.dataSources"), icon: Database },
    { to: "/profile", label: t("nav.profile"), icon: User },
  ];

  const isOnboarding = location.pathname === "/onboarding";
  const isMoreActive = MORE.some((m) => m.to === location.pathname) || location.pathname.startsWith("/admin");

  function openCommandPalette() {
    // Synthesize a ⌘K event so the global hotkey listener (in App.tsx) opens the palette.
    const evt = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
    });
    window.dispatchEvent(evt);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16 max-w-[1200px] gap-3">
          <NavLink to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-spark animate-spark-pulse" aria-hidden="true" />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="font-bold text-base tracking-tight">{t("app.name")}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.subtitle")}</div>
            </div>
          </NavLink>

          {!isOnboarding && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => cn(
                    "relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors xl:px-4",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {({ isActive }) => (
                    <>
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="whitespace-nowrap leading-none">{label}</span>
                      {isActive && (
                        <motion.span layoutId="active-nav" className="absolute inset-0 bg-secondary rounded-xl -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground xl:px-4">
                  <MoreHorizontal className="w-4 h-4" aria-hidden="true" />{t("nav.more")}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {MORE.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} asChild>
                      <NavLink to={to} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />{label}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}

          <div className="flex items-center gap-2">
            {!isOnboarding && (
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label={t("nav.search")}
                className="hidden lg:inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-medium text-muted-foreground transition-colors"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="opacity-70">
                  {locale === "es" ? "Buscar…" : "Search…"}
                </span>
                <kbd className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">
                  {isMac ? "⌘K" : "Ctrl K"}
                </kbd>
              </button>
            )}
            <button
              onClick={() => setLocale(locale === "en" ? "es" : "en")}
              className="hidden sm:inline-flex h-9 min-w-14 items-center justify-center rounded-xl border border-border px-0 text-xs font-semibold uppercase tracking-normal leading-none transition-colors hover:bg-secondary"
              aria-label="Toggle language"
            >
              {locale}
            </button>
            {profile && profile.streak > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark/10 text-spark text-sm font-semibold tabular-nums">
                <Flame className="w-4 h-4" aria-hidden="true" />{profile.streak}
              </div>
            )}
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            </button>

            {!isOnboarding && user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={t("auth.account")}
                  className="w-9 h-9 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center justify-center font-mono text-[11px] font-bold tracking-wider uppercase text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {avatarMark ?? <User className="w-4 h-4" aria-hidden="true" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-mono text-xs font-bold tracking-wider shrink-0">
                        {avatarMark}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold leading-tight truncate">
                          {profile?.persona ? (
                            <>
                              {(locale === "es" ? "Anónimo · " : "Anonymous · ")}
                              <span className="capitalize">{profile.persona}</span>
                            </>
                          ) : (
                            t("auth.account")
                          )}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                          {t("auth.anonId")}: <span className="font-mono">{user.id.slice(0, 8)}…</span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAnalyst && (
                    <DropdownMenuItem onSelect={() => navigate("/admin")} className="cursor-pointer">
                      <ShieldCheck className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                      {t("nav.admin")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => navigate("/profile")} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                    {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/data-sources")} className="cursor-pointer">
                    <Database className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                    {t("nav.dataSources")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{t("auth.signOut")}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {t("auth.signOutHint")}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-12 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="min-h-[calc(100vh-8rem)] will-change-transform"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.992, filter: "blur(6px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.998, filter: "blur(3px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="hidden md:block border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for the Ending Pandemics Academy "Spot the Spark" Challenge — May 2026, University of Arizona. Synthetic data prototype. Open data: Open-Meteo, CDC, OpenStreetMap, OpenSky. EpiCore integration-ready.
      </footer>

      {!isOnboarding && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="grid grid-cols-5 px-2 py-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                <Icon className="w-5 h-5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors text-[10px] font-medium",
                    isMoreActive ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-label={t("nav.more")}
                >
                  <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                  {t("nav.more")}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl border-t border-border">
                <SheetHeader>
                  <SheetTitle className="text-left">{t("nav.more")}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {MORE.map(({ to, label, icon: Icon }) => (
                    <SheetClose asChild key={to}>
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 p-4 rounded-xl border border-border transition-colors",
                            isActive
                              ? "bg-secondary border-primary/30 text-primary"
                              : "hover:bg-secondary text-foreground"
                          )
                        }
                      >
                        <Icon className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium">{label}</span>
                      </NavLink>
                    </SheetClose>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => setLocale(locale === "en" ? "es" : "en")}
                    className="px-3 py-2 rounded-lg border border-border text-xs font-medium uppercase tracking-wider"
                  >
                    {locale === "en" ? "Español" : "English"}
                  </button>
                  {user && (
                    <SheetClose asChild>
                      <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        aria-label={t("auth.signOut")}
                      >
                        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                        {t("auth.signOut")}
                      </button>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      )}
    </div>
  );
}

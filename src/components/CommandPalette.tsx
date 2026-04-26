// Spark AZ — ⌘K command palette: jump to county, page, or scenario; toggle theme/locale.
import { useEffect, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, ClipboardCheck, Map as MapIcon, Sparkles, Beaker, ShieldCheck, Database,
  User, MapPin, Sun, Moon, Languages, Flame, Activity, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import { COUNTY_NAMES } from "@/lib/azCounties";

interface PageEntry {
  to: string;
  labelKey: string;
  Icon: typeof Home;
  shortcut?: string;
}

const PAGES: PageEntry[] = [
  { to: "/", labelKey: "nav.home", Icon: Home, shortcut: "G H" },
  { to: "/checkin", labelKey: "nav.checkin", Icon: ClipboardCheck, shortcut: "G C" },
  { to: "/map", labelKey: "nav.map", Icon: MapIcon, shortcut: "G M" },
  { to: "/insights", labelKey: "nav.insights", Icon: Sparkles, shortcut: "G I" },
  { to: "/simulator", labelKey: "nav.simulator", Icon: Beaker },
  { to: "/admin", labelKey: "nav.admin", Icon: ShieldCheck },
  { to: "/playbook", labelKey: "nav.playbook", Icon: MapPin },
  { to: "/data-sources", labelKey: "nav.dataSources", Icon: Database },
  { to: "/profile", labelKey: "nav.profile", Icon: User },
];

const SCENARIOS: { id: string; en: string; es: string; Icon: typeof Flame }[] = [
  { id: "valley-fever",  en: "Valley Fever (Pinal)",            es: "Fiebre del Valle (Pinal)",         Icon: Flame },
  { id: "border-import", en: "Border-import (Yuma)",            es: "Importación fronteriza (Yuma)",    Icon: Activity },
  { id: "monsoon",       en: "Monsoon · West Nile (Maricopa)",  es: "Monzón · Virus del Nilo (Maricopa)", Icon: Sparkles },
  { id: "ranch-zoonotic",en: "Ranch zoonotic (Cochise)",        es: "Zoonótico ganadero (Cochise)",     Icon: Activity },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useLocale();
  const { theme, toggle } = useTheme();
  const { signOut, user } = useAuth();

  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      // Defer to next tick so the dialog close animation doesn't fight the navigation
      setTimeout(fn, 0);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("cmd.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("cmd.empty")}</CommandEmpty>

        <CommandGroup heading={t("cmd.section.pages")}>
          {PAGES.map((p) => {
            const Icon = p.Icon;
            return (
              <CommandItem
                key={p.to}
                value={`${t(p.labelKey)} ${p.to}`}
                onSelect={() => run(() => navigate(p.to))}
              >
                <Icon className="text-primary" aria-hidden="true" />
                <span className="ml-2">{t(p.labelKey)}</span>
                {p.shortcut && <CommandShortcut>{p.shortcut}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("cmd.section.counties")}>
          {COUNTY_NAMES.map((c) => (
            <CommandItem
              key={c}
              value={`${c} county map`}
              onSelect={() => run(() => navigate(`/map?county=${encodeURIComponent(c)}`))}
            >
              <MapPin className="text-primary" aria-hidden="true" />
              <span className="ml-2">{c}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("cmd.section.scenarios")}>
          {SCENARIOS.map((s) => {
            const Icon = s.Icon;
            return (
              <CommandItem
                key={s.id}
                value={`scenario ${s.en}`}
                onSelect={() => run(() => navigate(`/?scenario=${s.id}`))}
              >
                <Icon className="text-spark" aria-hidden="true" />
                <span className="ml-2">{locale === "es" ? s.es : s.en}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("cmd.section.actions")}>
          <CommandItem
            value="run check-in"
            onSelect={() => run(() => navigate("/checkin"))}
          >
            <ClipboardCheck className="text-primary" aria-hidden="true" />
            <span className="ml-2">{t("cmd.runCheckin")}</span>
          </CommandItem>
          <CommandItem
            value="toggle theme dark light"
            onSelect={() => run(() => toggle())}
          >
            {theme === "dark"
              ? <Sun aria-hidden="true" className="text-spark" />
              : <Moon aria-hidden="true" className="text-primary" />}
            <span className="ml-2">{t("cmd.toggleTheme")}</span>
          </CommandItem>
          <CommandItem
            value="toggle language locale"
            onSelect={() => run(() => setLocale(locale === "en" ? "es" : "en"))}
          >
            <Languages aria-hidden="true" className="text-primary" />
            <span className="ml-2">{t("cmd.toggleLocale")}</span>
            <CommandShortcut>{locale.toUpperCase()}</CommandShortcut>
          </CommandItem>
          {user && (
            <CommandItem
              value="sign out reset session logout"
              onSelect={() =>
                run(() => {
                  if (typeof window !== "undefined" && !window.confirm(t("auth.signOutConfirm"))) return;
                  signOut();
                })
              }
            >
              <LogOut aria-hidden="true" className="text-destructive" />
              <span className="ml-2 text-destructive">{t("auth.signOut")}</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Hook: install the global ⌘K / Ctrl-K hotkey. */
export function useCommandPaletteHotkey(setOpen: (b: boolean) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

/** Tiny inline label so callers can render a keyboard hint. */
export function KbdHint({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
      {children}
    </kbd>
  );
}

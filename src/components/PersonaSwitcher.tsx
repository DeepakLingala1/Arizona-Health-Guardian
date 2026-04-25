// Spark AZ — quick persona switcher (also used in scenario chip)
import { PERSONAS, PersonaId } from "@/lib/personas";
import { useLocale } from "@/lib/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  value: PersonaId;
  onChange: (p: PersonaId) => void;
  compact?: boolean;
}

export function PersonaSwitcher({ value, onChange, compact }: Props) {
  const { locale } = useLocale();
  const current = PERSONAS.find((p) => p.id === value) ?? PERSONAS[5];
  const Icon = current.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary transition-colors ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          } font-medium`}
        >
          <Icon className="w-4 h-4 text-primary" />
          <span className="truncate max-w-[140px]">{current.label[locale]}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">
          {locale === "es" ? "Cambiar perfil" : "Switch persona"}
        </div>
        <div className="space-y-0.5 max-h-80 overflow-y-auto">
          {PERSONAS.map((p) => {
            const PIcon = p.icon;
            const active = p.id === value;
            return (
              <button
                key={p.id}
                onClick={() => onChange(p.id)}
                className={`w-full flex items-start gap-2 px-2 py-2 rounded-lg text-left text-sm hover:bg-secondary transition-colors ${
                  active ? "bg-secondary" : ""
                }`}
              >
                <PIcon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-1">
                    {p.label[locale]}
                    {active && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{p.description[locale]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
export default function Profile() {
  const { profile } = useAuth();
  const { t, locale, setLocale } = useLocale();
  return (
    <div className="container max-w-2xl py-12 space-y-6">
      <h1 className="text-3xl font-bold">{t("nav.profile")}</h1>
      <div className="card-elevated p-6 space-y-3 text-sm">
        <div><span className="text-muted-foreground">Persona:</span> {(profile as any)?.persona ?? "urban"}</div>
        <div><span className="text-muted-foreground">{t("common.county")}:</span> {profile?.home_county}</div>
        <div className="pt-2">
          <div className="text-muted-foreground mb-2">{t("nav.language")}</div>
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setLocale("en")} className={`px-4 py-2 text-sm ${locale === "en" ? "bg-primary text-primary-foreground" : ""}`}>English</button>
            <button onClick={() => setLocale("es")} className={`px-4 py-2 text-sm ${locale === "es" ? "bg-primary text-primary-foreground" : ""}`}>Español</button>
          </div>
        </div>
      </div>
    </div>
  );
}

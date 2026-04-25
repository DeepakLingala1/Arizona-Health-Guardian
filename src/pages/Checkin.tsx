import { useLocale } from "@/lib/i18n";
export default function Checkin() {
  const { t } = useLocale();
  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">{t("checkin.title")}</h1>
      <p className="text-muted-foreground mt-2">{t("checkin.subtitle")}</p>
      <div className="card-elevated p-6 mt-6 text-sm text-muted-foreground">
        Three-tab One Health check-in (Self / Animals / Environment) is being built next.
      </div>
    </div>
  );
}

import { useLocale } from "@/lib/i18n";
export default function Simulator() {
  const { t } = useLocale();
  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">{t("sim.title")}</h1>
      <div className="card-elevated p-6 mt-6 text-sm text-muted-foreground">
        Travel & activity simulator coming next.
      </div>
    </div>
  );
}

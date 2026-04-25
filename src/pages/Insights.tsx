import { useLocale } from "@/lib/i18n";
export default function Insights() {
  const { t } = useLocale();
  return (
    <div className="container max-w-[1200px] py-12">
      <h1 className="text-3xl font-bold">{t("insights.title")}</h1>
      <div className="card-elevated p-6 mt-6 text-sm text-muted-foreground">
        Weekly digest, clusters, EpiCore feed, and travel import watch coming next.
      </div>
    </div>
  );
}

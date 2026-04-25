import { useLocale } from "@/lib/i18n";
export default function MapPage() {
  const { t } = useLocale();
  return (
    <div className="container max-w-[1200px] py-12">
      <h1 className="text-3xl font-bold">{t("map.title")}</h1>
      <div className="card-elevated p-6 mt-6 text-sm text-muted-foreground">
        Leaflet choropleth with One Health layer toggle (Composite / Human / Animal / Vector / Env) coming next.
      </div>
    </div>
  );
}

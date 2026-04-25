// Spark AZ — One Health 4-up sub-score tiles
import { motion } from "framer-motion";
import { User, PawPrint, Bug, CloudFog } from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface Subs { human: number; animal: number; vector: number; environmental: number }

export function SubScoreGrid({ subs }: { subs: Subs }) {
  const { t } = useLocale();
  const tiles = [
    { key: "human", label: t("home.signal.human"), value: subs.human, color: "primary", Icon: User },
    { key: "animal", label: t("home.signal.animal"), value: subs.animal, color: "earth", Icon: PawPrint },
    { key: "vector", label: t("home.signal.vector"), value: subs.vector, color: "vector", Icon: Bug },
    { key: "env", label: t("home.signal.environment"), value: subs.environmental, color: "spark", Icon: CloudFog },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((t, i) => (
        <motion.div
          key={t.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card-elevated p-4"
        >
          <div className="flex items-center justify-between">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${t.color}/10 text-${t.color}`}>
              <t.Icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-2xl font-bold tabular-nums">{t.value}</div>
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3 font-semibold">{t.label}</div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${t.value}%` }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.05 }}
              className={`h-full rounded-full bg-${t.color}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

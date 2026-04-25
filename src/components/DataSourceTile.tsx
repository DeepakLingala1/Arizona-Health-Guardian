import { motion } from "framer-motion";

export function DataSourceTile({ name, desc }: { name: string; desc: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-4">
      <div className="font-semibold">{name}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </motion.div>
  );
}

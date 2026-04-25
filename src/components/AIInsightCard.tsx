import { motion } from "framer-motion";

export function AIInsightCard({ text }: { text: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="card-elevated p-5 border border-primary/20 bg-gradient-to-br from-card to-secondary/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-spark animate-pulse" />
        <div className="text-xs font-bold uppercase tracking-widest text-spark">
          Spark AI Insight
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">
        {text}
      </p>
    </motion.div>
  );
}

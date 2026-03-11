import { Metrics } from "@/types/simulator";
import { motion } from "framer-motion";
import { Activity, Clock, Gauge, Users, Zap, Scale } from "lucide-react";

interface MetricsPanelProps {
  metrics: Metrics | null;
}

const metricDefs = [
  { key: "cpuUtilization" as const, label: "CPU Utilization", icon: Gauge, unit: "%", decimals: 1 },
  { key: "throughput" as const, label: "Throughput", icon: Activity, unit: " p/ut", decimals: 3 },
  { key: "avgWaitingTime" as const, label: "Avg Waiting Time", icon: Clock, unit: "", decimals: 2 },
  { key: "avgTurnaroundTime" as const, label: "Avg Turnaround", icon: Zap, unit: "", decimals: 2 },
  { key: "avgResponseTime" as const, label: "Avg Response Time", icon: Users, unit: "", decimals: 2 },
  { key: "fairnessIndex" as const, label: "Fairness Index", icon: Scale, unit: "", decimals: 3 },
];

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        Ejecute una simulación para ver métricas
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-mono text-primary uppercase tracking-wider font-semibold">Métricas</h3>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-primary/20 text-primary rounded-full">{metrics.algorithm}</span>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {metricDefs.map((def, i) => {
          const Icon = def.icon;
          const value = metrics[def.key];
          return (
            <motion.div
              key={def.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-1 p-3 bg-secondary rounded-lg border border-border"
            >
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-lg font-mono font-bold text-foreground">{value.toFixed(def.decimals)}{def.unit}</span>
              <span className="text-[10px] font-mono text-muted-foreground text-center leading-tight">{def.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

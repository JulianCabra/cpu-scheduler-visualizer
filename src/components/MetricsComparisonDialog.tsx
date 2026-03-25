import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Algorithm, Metrics } from "@/types/simulator";
import { BarChart3, Activity, Clock, Gauge, Users, Zap, Scale } from "lucide-react";
import { motion } from "framer-motion";

interface MetricsComparisonDialogProps {
  metrics: Record<Algorithm, Metrics | null>;
}

const metricDefs = [
  { key: "cpuUtilization" as const, label: "CPU Utilization", icon: Gauge, unit: "%", decimals: 1, higherBetter: true },
  { key: "throughput" as const, label: "Throughput", icon: Activity, unit: " p/ut", decimals: 3, higherBetter: true },
  { key: "avgWaitingTime" as const, label: "Avg Waiting Time", icon: Clock, unit: "", decimals: 2, higherBetter: false },
  { key: "avgTurnaroundTime" as const, label: "Avg Turnaround", icon: Zap, unit: "", decimals: 2, higherBetter: false },
  { key: "avgResponseTime" as const, label: "Avg Response Time", icon: Users, unit: "", decimals: 2, higherBetter: false },
  { key: "fairnessIndex" as const, label: "Fairness Index", icon: Scale, unit: "", decimals: 3, higherBetter: true },
];

const algoColors: Record<Algorithm, string> = {
  SRTF: "hsl(200, 80%, 55%)",
  MLFQ: "hsl(340, 75%, 55%)",
  VRR: "hsl(45, 85%, 55%)",
};

const algorithms: Algorithm[] = ["SRTF", "MLFQ", "VRR"];

export default function MetricsComparisonDialog({ metrics }: MetricsComparisonDialogProps) {
  const [selectedMetric, setSelectedMetric] = useState(0);
  const hasData = algorithms.some(a => metrics[a] !== null);

  if (!hasData) return null;

  const def = metricDefs[selectedMetric];
  const values = algorithms.map(a => metrics[a]?.[def.key] ?? 0);
  const maxVal = Math.max(...values, 0.001);

  const bestIdx = def.higherBetter
    ? values.indexOf(Math.max(...values))
    : values.indexOf(Math.min(...values.filter(v => v > 0)));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
          <BarChart3 className="w-3.5 h-3.5" />
          Comparar Métricas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary text-sm tracking-wider">
            Comparación de Métricas
          </DialogTitle>
        </DialogHeader>

        {/* Metric selector buttons */}
        <div className="flex flex-wrap gap-1.5">
          {metricDefs.map((d, i) => {
            const Icon = d.icon;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedMetric(i)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-mono transition-all border ${
                  selectedMetric === i
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Bar chart */}
        <div className="flex flex-col gap-3 mt-2">
          {algorithms.map((algo, i) => {
            const value = values[i];
            const barWidth = maxVal > 0 ? (value / maxVal) * 100 : 0;
            const isBest = i === bestIdx && value > 0;

            return (
              <div key={algo} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-semibold ${isBest ? "text-primary" : "text-foreground"}`}>
                    {algo} {isBest && "★"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {value.toFixed(def.decimals)}{def.unit}
                  </span>
                </div>
                <div className="h-6 bg-secondary rounded-md overflow-hidden border border-border">
                  <motion.div
                    key={`${selectedMetric}-${algo}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-md ${isBest ? "ring-1 ring-primary" : ""}`}
                    style={{ backgroundColor: algoColors[algo] }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          ★ = Mejor valor ({def.higherBetter ? "mayor es mejor" : "menor es mejor"})
        </p>
      </DialogContent>
    </Dialog>
  );
}

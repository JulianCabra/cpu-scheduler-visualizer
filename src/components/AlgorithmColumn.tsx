import { Algorithm, SimulationResult } from "@/types/simulator";
import { motion } from "framer-motion";
import { Cpu, Activity, Clock, Gauge, Users, Zap, Scale } from "lucide-react";

interface AlgorithmColumnProps {
  algorithm: Algorithm;
  result: SimulationResult | null;
}

const queueLabels = ["Cola 0 (Alta)", "Cola 1 (Media)", "Cola 2 (Baja)"];

const metricDefs = [
  { key: "cpuUtilization" as const, label: "CPU Util.", icon: Gauge, unit: "%", decimals: 1 },
  { key: "throughput" as const, label: "Throughput", icon: Activity, unit: "", decimals: 3 },
  { key: "avgWaitingTime" as const, label: "Avg Wait", icon: Clock, unit: "", decimals: 2 },
  { key: "avgTurnaroundTime" as const, label: "Avg Turn.", icon: Zap, unit: "", decimals: 2 },
  { key: "avgResponseTime" as const, label: "Avg Resp.", icon: Users, unit: "", decimals: 2 },
  { key: "fairnessIndex" as const, label: "Fairness", icon: Scale, unit: "", decimals: 3 },
];

function getProcessHSL(pid: number): string {
  const colors = [
    "200 80% 55%", "340 75% 55%", "45 85% 55%",
    "270 65% 60%", "160 70% 45%", "15 80% 55%",
  ];
  if (pid < 0) return "220 10% 30%";
  return colors[(pid - 1) % colors.length];
}

export default function AlgorithmColumn({ algorithm, result }: AlgorithmColumnProps) {
  const lastGantt = result?.gantt[result.gantt.length - 1];
  const activePid = lastGantt?.type === "cpu" ? lastGantt.pid : null;

  return (
    <div className="flex flex-col border-r border-border last:border-r-0 overflow-hidden">
      {/* Algorithm Header */}
      <div className="px-3 py-2 border-b border-border bg-card flex items-center justify-center">
        <span className="text-sm font-mono font-bold text-primary tracking-wider">{algorithm}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {!result ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground font-mono text-xs gap-2">
            <Cpu className="w-8 h-8 opacity-30" />
            <p>Sin datos</p>
          </div>
        ) : (
          <>
            {/* CPU Status */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase w-8">CPU</span>
              <motion.div
                animate={{ scale: activePid ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: activePid ? Infinity : 0, duration: 1.5 }}
                className={`flex items-center justify-center min-w-[48px] h-8 rounded-md font-mono font-bold text-xs border ${
                  activePid
                    ? "border-primary bg-primary/20 text-primary glow-primary"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {activePid ? `P${activePid}` : "Idle"}
              </motion.div>
            </div>

            {/* Queues */}
            {algorithm === "MLFQ" && result.queues.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {result.queues.map((queue, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground w-8 leading-tight">Q{i}</span>
                    <div className="flex gap-1 flex-wrap min-h-[28px] flex-1 p-1.5 bg-secondary/50 rounded-md border border-border">
                      {queue.processes.length === 0 ? (
                        <span className="text-[9px] text-muted-foreground/50 font-mono">vacía</span>
                      ) : (
                        queue.processes.map((p, j) => (
                          <motion.div
                            key={`${p.pid}-${j}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-border"
                            style={{ backgroundColor: `hsl(${getProcessHSL(p.pid)})`, color: "hsl(220 20% 10%)" }}
                          >
                            P{p.pid}({p.remainingBurst})
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {algorithm !== "MLFQ" && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground w-8">Ready</span>
                <div className="flex gap-1 flex-wrap min-h-[28px] flex-1 p-1.5 bg-secondary/50 rounded-md border border-border">
                  {result.queues.flatMap(q => q.processes).length === 0 ? (
                    <span className="text-[9px] text-muted-foreground/50 font-mono">vacía</span>
                  ) : (
                    result.queues.flatMap(q => q.processes).map((p, j) => (
                      <motion.div
                        key={`${p.pid}-${j}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-border"
                        style={{ backgroundColor: `hsl(${getProcessHSL(p.pid)})`, color: "hsl(220 20% 10%)" }}
                      >
                        P{p.pid}({p.remainingBurst})
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Gantt Chart */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider font-semibold">Gantt</span>
              <div className="overflow-x-auto gantt-scroll pb-1">
                <div className="flex" style={{ minWidth: `${result.gantt.length * 36}px` }}>
                  {result.gantt.map((event, i) => {
                    const width = (event.end - event.start) * 36;
                    const isIdle = event.pid < 0;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        style={{
                          width: `${width}px`,
                          backgroundColor: isIdle ? "hsl(220 10% 20%)" : `hsl(${getProcessHSL(event.pid)})`,
                          originX: 0,
                        }}
                        className={`h-7 flex items-center justify-center text-[10px] font-mono font-bold rounded-sm border-r border-background ${
                          isIdle ? "text-muted-foreground" : "text-primary-foreground"
                        }`}
                      >
                        {isIdle ? "idle" : `P${event.pid}`}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex">
                  {result.gantt.map((event, i) => {
                    const width = (event.end - event.start) * 36;
                    return (
                      <div key={i} className="flex justify-between text-[8px] font-mono text-muted-foreground" style={{ width: `${width}px` }}>
                        <span>{event.start}</span>
                        {i === result.gantt.length - 1 && <span>{event.end}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider font-semibold">Métricas</span>
              <div className="grid grid-cols-2 gap-1.5">
                {metricDefs.map((def, i) => {
                  const Icon = def.icon;
                  const value = result.metrics[def.key];
                  return (
                    <motion.div
                      key={def.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-1.5 p-2 bg-secondary rounded-md border border-border"
                    >
                      <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-mono font-bold text-foreground truncate">
                          {value.toFixed(def.decimals)}{def.unit}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground truncate">{def.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

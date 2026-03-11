import { SimulationResult, Algorithm } from "@/types/simulator";
import { motion } from "framer-motion";
import { getProcessColorClass } from "@/lib/simulator";
import { Cpu } from "lucide-react";

interface QueueVisualizationProps {
  result: SimulationResult | null;
  algorithm: Algorithm;
}

const queueLabels = ["Cola 0 (Alta)", "Cola 1 (Media)", "Cola 2 (Baja)"];

export default function QueueVisualization({ result, algorithm }: QueueVisualizationProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono text-sm gap-2">
        <Cpu className="w-10 h-10 opacity-30" />
        <p>Ejecute una simulación para ver las colas</p>
      </div>
    );
  }

  const lastGantt = result.gantt[result.gantt.length - 1];
  const activePid = lastGantt?.type === "cpu" ? lastGantt.pid : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* CPU */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider w-12">CPU</span>
        <motion.div
          animate={{ scale: activePid ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: activePid ? Infinity : 0, duration: 1.5 }}
          className={`flex items-center justify-center min-w-[64px] h-10 rounded-lg font-mono font-bold text-sm border ${
            activePid
              ? "border-primary bg-primary/20 text-primary glow-primary"
              : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          {activePid ? `P${activePid}` : "Idle"}
        </motion.div>
      </div>

      {/* Queues for MLFQ */}
      {algorithm === "MLFQ" && result.queues.length > 0 && (
        <div className="flex flex-col gap-3">
          {result.queues.map((queue, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xs font-mono text-muted-foreground w-12 pt-2 leading-tight">{queueLabels[i]?.split("(")[0]}<br/><span className="text-[10px] opacity-60">{queueLabels[i]?.match(/\(.*\)/)?.[0]}</span></span>
              <div className="flex gap-1.5 flex-wrap min-h-[36px] flex-1 p-2 bg-secondary/50 rounded-lg border border-border">
                {queue.processes.length === 0 ? (
                  <span className="text-xs text-muted-foreground/50 font-mono">vacía</span>
                ) : (
                  queue.processes.map((p, j) => (
                    <motion.div
                      key={`${p.pid}-${j}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-semibold bg-${getProcessColorClass(p.pid)} border border-border`}
                      style={{ backgroundColor: `hsl(${getProcessHSL(p.pid)})`, color: "hsl(220 20% 10%)" }}
                    >
                      P{p.pid} <span className="opacity-70">({p.remainingBurst})</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple ready queue for SRTF/VRR */}
      {algorithm !== "MLFQ" && (
        <div className="flex items-start gap-3">
          <span className="text-xs font-mono text-muted-foreground w-12 pt-2">Ready</span>
          <div className="flex gap-1.5 flex-wrap min-h-[36px] flex-1 p-2 bg-secondary/50 rounded-lg border border-border">
            {result.queues.flatMap(q => q.processes).length === 0 ? (
              <span className="text-xs text-muted-foreground/50 font-mono">vacía</span>
            ) : (
              result.queues.flatMap(q => q.processes).map((p, j) => (
                <motion.div
                  key={`${p.pid}-${j}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 rounded-md text-xs font-mono font-semibold border border-border"
                  style={{ backgroundColor: `hsl(${getProcessHSL(p.pid)})`, color: "hsl(220 20% 10%)" }}
                >
                  P{p.pid} <span className="opacity-70">({p.remainingBurst})</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getProcessHSL(pid: number): string {
  const colors = [
    "200 80% 55%", "340 75% 55%", "45 85% 55%",
    "270 65% 60%", "160 70% 45%", "15 80% 55%",
  ];
  return colors[(pid - 1) % colors.length];
}

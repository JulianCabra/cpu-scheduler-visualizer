import { GanttEvent } from "@/types/simulator";
import { motion } from "framer-motion";

interface GanttChartProps {
  gantt: GanttEvent[];
}

function getProcessHSL(pid: number): string {
  const colors = [
    "200 80% 55%", "340 75% 55%", "45 85% 55%",
    "270 65% 60%", "160 70% 45%", "15 80% 55%",
  ];
  if (pid < 0) return "220 10% 30%";
  return colors[(pid - 1) % colors.length];
}

export default function GanttChart({ gantt }: GanttChartProps) {
  if (gantt.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        Sin datos de Gantt
      </div>
    );
  }

  const totalTime = gantt[gantt.length - 1].end;
  const minBlockWidth = 48;

  return (
    <div className="flex flex-col gap-2 h-full">
      <h3 className="text-xs font-mono text-primary uppercase tracking-wider font-semibold">Diagrama de Gantt</h3>
      <div className="flex-1 overflow-x-auto gantt-scroll pb-2">
        <div className="flex flex-col gap-1" style={{ minWidth: `${gantt.length * minBlockWidth}px` }}>
          {/* Blocks */}
          <div className="flex">
            {gantt.map((event, i) => {
              const width = (event.end - event.start) * minBlockWidth;
              const isIdle = event.pid < 0;
              return (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{
                    width: `${width}px`,
                    backgroundColor: isIdle ? "hsl(220 10% 20%)" : `hsl(${getProcessHSL(event.pid)})`,
                    originX: 0,
                  }}
                  className={`h-10 flex items-center justify-center text-xs font-mono font-bold rounded-sm border-r border-background ${
                    isIdle ? "text-muted-foreground" : "text-primary-foreground"
                  }`}
                >
                  {isIdle ? "idle" : `P${event.pid}`}
                </motion.div>
              );
            })}
          </div>

          {/* Time markers */}
          <div className="flex">
            {gantt.map((event, i) => {
              const width = (event.end - event.start) * minBlockWidth;
              return (
                <div key={i} className="flex justify-between text-[10px] font-mono text-muted-foreground" style={{ width: `${width}px` }}>
                  <span>{event.start}</span>
                  {i === gantt.length - 1 && <span>{event.end}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

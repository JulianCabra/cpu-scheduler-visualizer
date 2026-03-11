import { Algorithm } from "@/types/simulator";
import { Cpu, Play } from "lucide-react";
import { motion } from "framer-motion";

interface TopBarProps {
  algorithm: Algorithm;
  onAlgorithmChange: (a: Algorithm) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

const algorithms: Algorithm[] = ["SRTF", "MLFQ", "VRR"];

export default function TopBar({ algorithm, onAlgorithmChange, onSimulate, isSimulating }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Cpu className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-semibold font-mono tracking-tight text-foreground">
          Simulador de Planificación de CPU
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-secondary rounded-lg p-1 gap-1">
          {algorithms.map((a) => (
            <button
              key={a}
              onClick={() => onAlgorithmChange(a)}
              className={`relative px-4 py-1.5 text-sm font-mono font-medium rounded-md transition-colors ${
                algorithm === a ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {algorithm === a && (
                <motion.div
                  layoutId="algo-tab"
                  className="absolute inset-0 bg-primary rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{a}</span>
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSimulate}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg glow-primary disabled:opacity-50 transition-all"
        >
          <Play className="w-4 h-4" />
          Simular
        </motion.button>
      </div>
    </header>
  );
}

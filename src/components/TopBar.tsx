import { Cpu, Play } from "lucide-react";
import { motion } from "framer-motion";

interface TopBarProps {
  onSimulate: () => void;
  isSimulating: boolean;
}

export default function TopBar({ onSimulate, isSimulating }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Cpu className="w-6 h-6 text-primary" />
        <h1 className="text-lg font-semibold font-mono tracking-tight text-foreground">
          Simulador de Planificación de CPU
        </h1>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSimulate}
        disabled={isSimulating}
        className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg glow-primary disabled:opacity-50 transition-all"
      >
        <Play className="w-4 h-4" />
        Simular Todos
      </motion.button>
    </header>
  );
}

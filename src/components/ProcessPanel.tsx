import { useState } from "react";
import { Process, RandomConfig } from "@/types/simulator";
import { Plus, Trash2, Shuffle, X } from "lucide-react";
import { generateRandomProcesses } from "@/lib/simulator";
import { motion, AnimatePresence } from "framer-motion";

interface ProcessPanelProps {
  processes: Process[];
  setProcesses: (p: Process[]) => void;
}

export default function ProcessPanel({ processes, setProcesses }: ProcessPanelProps) {
  const [form, setForm] = useState<Process>({ id: 1, arrival: 0, burst: 5, io_duration: 0, io_at: 0 });
  const [randomConfig, setRandomConfig] = useState<RandomConfig>({ count: 5, burstMin: 2, burstMax: 10, arrivalMax: 8 });
  const [showRandom, setShowRandom] = useState(false);

  const addProcess = () => {
    const nextId = processes.length > 0 ? Math.max(...processes.map(p => p.id)) + 1 : 1;
    setProcesses([...processes, { ...form, id: nextId }]);
    setForm(f => ({ ...f, id: nextId + 1 }));
  };

  const removeProcess = (id: number) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const generateRandom = () => {
    const generated = generateRandomProcesses(randomConfig.count, randomConfig.burstMin, randomConfig.burstMax, randomConfig.arrivalMax);
    setProcesses(generated);
    setForm(f => ({ ...f, id: generated.length + 1 }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-border h-full overflow-y-auto">
      <h2 className="text-sm font-semibold font-mono text-primary uppercase tracking-wider">Procesos</h2>

      {/* Input fields */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Arrival", key: "arrival" as const },
          { label: "Burst", key: "burst" as const },
          { label: "I/O Dur.", key: "io_duration" as const },
          { label: "I/O At", key: "io_at" as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground font-mono">{label}</label>
            <input
              type="number"
              min={0}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
              className="w-full mt-1 px-2 py-1.5 text-sm font-mono bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={addProcess} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition">
          <Plus className="w-3 h-3" /> Agregar
        </button>
        <button onClick={() => setProcesses([])} className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition">
          <Trash2 className="w-3 h-3" /> Limpiar
        </button>
      </div>

      {/* Random generation */}
      <button
        onClick={() => setShowRandom(!showRandom)}
        className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-md hover:opacity-90 transition"
      >
        <Shuffle className="w-3 h-3" /> Aleatorio
      </button>

      <AnimatePresence>
        {showRandom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 p-3 bg-secondary rounded-lg">
              {[
                { label: "Cantidad", key: "count" as const },
                { label: "Burst Mín", key: "burstMin" as const },
                { label: "Burst Máx", key: "burstMax" as const },
                { label: "Arrival Máx", key: "arrivalMax" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground font-mono">{label}</label>
                  <input
                    type="number"
                    min={1}
                    value={randomConfig[key]}
                    onChange={e => setRandomConfig(c => ({ ...c, [key]: parseInt(e.target.value) || 1 }))}
                    className="w-full mt-1 px-2 py-1.5 text-sm font-mono bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
              <button onClick={generateRandom} className="col-span-2 mt-1 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition">
                Generar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process table */}
      {processes.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-secondary text-muted-foreground">
                <th className="px-2 py-1.5 text-left">PID</th>
                <th className="px-2 py-1.5 text-left">Arr</th>
                <th className="px-2 py-1.5 text-left">Burst</th>
                <th className="px-2 py-1.5 text-left">I/O</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {processes.map(p => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-t border-border text-foreground"
                  >
                    <td className="px-2 py-1.5 text-primary font-semibold">P{p.id}</td>
                    <td className="px-2 py-1.5">{p.arrival}</td>
                    <td className="px-2 py-1.5">{p.burst}</td>
                    <td className="px-2 py-1.5">{p.io_duration > 0 ? `${p.io_duration}@${p.io_at}` : "-"}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeProcess(p.id)} className="text-destructive hover:text-destructive/80">
                        <X className="w-3 h-3" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

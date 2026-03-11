import { useState } from "react";
import { Process, Algorithm, SimulationResult } from "@/types/simulator";
import { runSimulation } from "@/lib/simulator";
import TopBar from "@/components/TopBar";
import ProcessPanel from "@/components/ProcessPanel";
import AlgorithmColumn from "@/components/AlgorithmColumn";

const algorithms: Algorithm[] = ["SRTF", "MLFQ", "VRR"];

const Index = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [results, setResults] = useState<Record<Algorithm, SimulationResult | null>>({
    SRTF: null,
    MLFQ: null,
    VRR: null,
  });
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    if (processes.length === 0) return;
    setIsSimulating(true);
    setTimeout(() => {
      const newResults: Record<Algorithm, SimulationResult | null> = {
        SRTF: runSimulation(processes, "SRTF"),
        MLFQ: runSimulation(processes, "MLFQ"),
        VRR: runSimulation(processes, "VRR"),
      };
      setResults(newResults);
      setIsSimulating(false);
    }, 300);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onSimulate={handleSimulate} isSimulating={isSimulating} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Process Panel */}
        <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
          <ProcessPanel processes={processes} setProcesses={setProcesses} />
        </div>

        {/* Right: 3 algorithm columns */}
        <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
          {algorithms.map((algo) => (
            <AlgorithmColumn
              key={algo}
              algorithm={algo}
              result={results[algo]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;

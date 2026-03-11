import { useState } from "react";
import { Process, Algorithm, SimulationResult } from "@/types/simulator";
import { runSimulation } from "@/lib/simulator";
import TopBar from "@/components/TopBar";
import ProcessPanel from "@/components/ProcessPanel";
import QueueVisualization from "@/components/QueueVisualization";
import GanttChart from "@/components/GanttChart";
import MetricsPanel from "@/components/MetricsPanel";

const Index = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<Algorithm>("SRTF");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    if (processes.length === 0) return;
    setIsSimulating(true);
    setTimeout(() => {
      const res = runSimulation(processes, algorithm);
      setResult(res);
      setIsSimulating(false);
    }, 300);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar
        algorithm={algorithm}
        onAlgorithmChange={setAlgorithm}
        onSimulate={handleSimulate}
        isSimulating={isSimulating}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Process Panel */}
        <div className="w-72 border-r border-border overflow-y-auto">
          <ProcessPanel processes={processes} setProcesses={setProcesses} />
        </div>

        {/* Center + Right */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Queue Visualization */}
          <div className="p-4 border-b border-border min-h-[180px]">
            <QueueVisualization result={result} algorithm={algorithm} />
          </div>

          {/* Gantt Chart */}
          <div className="flex-1 p-4 border-b border-border overflow-hidden">
            <GanttChart gantt={result?.gantt ?? []} />
          </div>

          {/* Metrics */}
          <div className="p-4">
            <MetricsPanel metrics={result?.metrics ?? null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

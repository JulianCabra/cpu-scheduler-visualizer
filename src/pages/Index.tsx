import { useState, useRef, useCallback, useEffect } from "react";
import { Process, Algorithm, SimulationResult, StepSimulationResult, SimulationSnapshot } from "@/types/simulator";
import { runStepSimulation } from "@/lib/simulator";
import TopBar from "@/components/TopBar";
import ProcessPanel from "@/components/ProcessPanel";
import AlgorithmColumn from "@/components/AlgorithmColumn";
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import MetricsComparisonDialog from "@/components/MetricsComparisonDialog";
import { Metrics } from "@/types/simulator";

const algorithms: Algorithm[] = ["SRTF", "MLFQ", "VRR"];

const Index = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [stepResults, setStepResults] = useState<Record<Algorithm, StepSimulationResult | null>>({
    SRTF: null, MLFQ: null, VRR: null,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per step
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxSteps = Math.max(
    ...algorithms.map(a => stepResults[a]?.snapshots.length ?? 0),
    0
  );

  const getCurrentSnapshot = useCallback((algo: Algorithm): SimulationResult | null => {
    const sr = stepResults[algo];
    if (!sr || sr.snapshots.length === 0) return null;
    const stepIdx = Math.min(currentStep, sr.snapshots.length - 1);
    const snap = sr.snapshots[stepIdx];
    return {
      algorithm: algo,
      gantt: snap.gantt,
      queues: snap.queues,
      metrics: { ...snap.metrics, algorithm: algo },
      cpuProcess: snap.cpuProcess,
    };
  }, [stepResults, currentStep]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && maxSteps > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxSteps, speed]);

  const handleSimulate = () => {
    if (processes.length === 0) return;
    setIsSimulating(true);
    setIsPlaying(false);
    setCurrentStep(0);
    setTimeout(() => {
      const newResults: Record<Algorithm, StepSimulationResult | null> = {
        SRTF: runStepSimulation(processes, "SRTF"),
        MLFQ: runStepSimulation(processes, "MLFQ"),
        VRR: runStepSimulation(processes, "VRR"),
      };
      setStepResults(newResults);
      setIsSimulating(false);
      setCurrentStep(0);
      setIsPlaying(true);
    }, 100);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(maxSteps - 1, prev + 1));
  };

  const togglePlay = () => {
    if (currentStep >= maxSteps - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onSimulate={handleSimulate} isSimulating={isSimulating} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Process Panel */}
        <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
          <ProcessPanel processes={processes} setProcesses={setProcesses} />
        </div>

        {/* Right: columns + playback */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Playback controls */}
          {maxSteps > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card"
            >
              <button onClick={handleReset} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={handleStepBack} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" disabled={currentStep <= 0}>
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={togglePlay} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={handleStepForward} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition" disabled={currentStep >= maxSteps - 1}>
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Progress bar */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  t={currentStep}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, maxSteps - 1)}
                  value={currentStep}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentStep(parseInt(e.target.value));
                  }}
                  className="flex-1 h-1.5 accent-primary cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {maxSteps - 1}
                </span>
              </div>

              {/* Speed control */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground">Vel:</span>
                {[1000, 500, 200, 50].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition ${
                      speed === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s >= 1000 ? "1x" : s >= 500 ? "2x" : s >= 200 ? "5x" : "10x"}
                  </button>
                ))}
              </div>

              {/* Compare metrics */}
              <MetricsComparisonDialog
                metrics={{
                  SRTF: getCurrentSnapshot("SRTF")?.metrics ?? null,
                  MLFQ: getCurrentSnapshot("MLFQ")?.metrics ?? null,
                  VRR: getCurrentSnapshot("VRR")?.metrics ?? null,
                }}
              />
            </motion.div>
          )}

          {/* Algorithm columns */}
          <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
            {algorithms.map((algo) => (
              <AlgorithmColumn
                key={algo}
                algorithm={algo}
                result={getCurrentSnapshot(algo)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

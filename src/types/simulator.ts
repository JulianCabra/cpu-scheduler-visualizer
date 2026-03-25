export interface Process {
  id: number;
  arrival: number;
  burst: number;
  io_duration: number;
  io_at: number;
}

export type Algorithm = "SRTF" | "MLFQ" | "VRR";

export interface GanttEvent {
  pid: number;
  start: number;
  end: number;
  type: "cpu" | "io" | "idle";
}

export interface QueueState {
  queueIndex: number;
  processes: { pid: number; remainingBurst: number }[];
}

export interface Metrics {
  algorithm: string;
  cpuUtilization: number;
  throughput: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  fairnessIndex: number;
}

export interface SimulationResult {
  algorithm: Algorithm;
  gantt: GanttEvent[];
  queues: QueueState[];
  metrics: Metrics;
  cpuProcess: number | null;
}

export interface RandomConfig {
  count: number;
  burstMin: number;
  burstMax: number;
  arrivalMax: number;
}

export interface SimulationSnapshot {
  time: number;
  gantt: GanttEvent[];
  queues: QueueState[];
  cpuProcess: number | null;
  metrics: Metrics;
}

export interface StepSimulationResult {
  algorithm: Algorithm;
  snapshots: SimulationSnapshot[];
  finalResult: SimulationResult;
}

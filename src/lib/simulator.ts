import { Process, SimulationResult, GanttEvent, Metrics, QueueState, Algorithm, SimulationSnapshot, StepSimulationResult } from "@/types/simulator";

const PROCESS_COLORS = [
  "var(--process-1)", "var(--process-2)", "var(--process-3)",
  "var(--process-4)", "var(--process-5)", "var(--process-6)",
];

export function getProcessColor(pid: number): string {
  return PROCESS_COLORS[(pid - 1) % PROCESS_COLORS.length];
}

export function getProcessColorClass(pid: number): string {
  return `process-${((pid - 1) % 6) + 1}`;
}

function simulateSRTF(processes: Process[]): SimulationResult {
  const n = processes.length;
  const remaining = processes.map(p => p.burst);
  const completed = new Array(n).fill(false);
  const waitTime = new Array(n).fill(0);
  const turnaround = new Array(n).fill(0);
  const responseTime = new Array(n).fill(-1);
  const gantt: GanttEvent[] = [];

  let time = 0;
  let done = 0;
  const maxTime = processes.reduce((s, p) => s + p.arrival + p.burst + p.io_duration, 0) + 10;

  while (done < n && time < maxTime) {
    const available = processes
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => p.arrival <= time && !completed[p.idx] && remaining[p.idx] > 0);

    if (available.length === 0) {
      gantt.push({ pid: -1, start: time, end: time + 1, type: "idle" });
      time++;
      continue;
    }

    available.sort((a, b) => remaining[a.idx] - remaining[b.idx]);
    const chosen = available[0];
    const idx = chosen.idx;

    if (responseTime[idx] === -1) responseTime[idx] = time - chosen.arrival;

    gantt.push({ pid: chosen.id, start: time, end: time + 1, type: "cpu" });
    remaining[idx]--;
    time++;

    if (remaining[idx] === 0) {
      completed[idx] = true;
      done++;
      turnaround[idx] = time - chosen.arrival;
      waitTime[idx] = turnaround[idx] - chosen.burst;
    }
  }

  const totalTime = time;
  const cpuTime = gantt.filter(g => g.type === "cpu").length;

  const metrics: Metrics = {
    algorithm: "SRTF",
    cpuUtilization: totalTime > 0 ? (cpuTime / totalTime) * 100 : 0,
    throughput: totalTime > 0 ? n / totalTime : 0,
    avgWaitingTime: waitTime.reduce((a, b) => a + b, 0) / n,
    avgTurnaroundTime: turnaround.reduce((a, b) => a + b, 0) / n,
    avgResponseTime: responseTime.filter(r => r >= 0).reduce((a, b) => a + b, 0) / n,
    fairnessIndex: computeFairness(waitTime),
  };

  return {
    algorithm: "SRTF",
    gantt: mergeGantt(gantt),
    queues: [{ queueIndex: 0, processes: processes.filter((_, i) => !completed[i]).map(p => ({ pid: p.id, remainingBurst: remaining[processes.indexOf(p)] })) }],
    metrics,
    cpuProcess: gantt.length > 0 ? gantt[gantt.length - 1].pid : null,
  };
}

function simulateMLFQ(processes: Process[]): SimulationResult {
  const n = processes.length;
  const quantums = [4, 8, 16];
  const remaining = processes.map(p => p.burst);
  const queueLevel = new Array(n).fill(0);
  const completed = new Array(n).fill(false);
  const waitTime = new Array(n).fill(0);
  const turnaround = new Array(n).fill(0);
  const responseTime = new Array(n).fill(-1);
  const gantt: GanttEvent[] = [];

  let time = 0;
  let done = 0;
  const maxTime = processes.reduce((s, p) => s + p.arrival + p.burst, 0) + 20;

  while (done < n && time < maxTime) {
    let chosen = -1;
    for (let q = 0; q < 3; q++) {
      const available = processes
        .map((p, i) => ({ ...p, idx: i }))
        .filter(p => p.arrival <= time && !completed[p.idx] && remaining[p.idx] > 0 && queueLevel[p.idx] === q);
      if (available.length > 0) {
        chosen = available[0].idx;
        break;
      }
    }

    if (chosen === -1) {
      gantt.push({ pid: -1, start: time, end: time + 1, type: "idle" });
      time++;
      continue;
    }

    if (responseTime[chosen] === -1) responseTime[chosen] = time - processes[chosen].arrival;

    const q = queueLevel[chosen];
    const quantum = quantums[q];
    const execTime = Math.min(remaining[chosen], quantum);

    for (let t = 0; t < execTime; t++) {
      gantt.push({ pid: processes[chosen].id, start: time, end: time + 1, type: "cpu" });
      remaining[chosen]--;
      time++;

      if (remaining[chosen] === 0) {
        completed[chosen] = true;
        done++;
        turnaround[chosen] = time - processes[chosen].arrival;
        waitTime[chosen] = turnaround[chosen] - processes[chosen].burst;
        break;
      }
    }

    if (!completed[chosen] && q < 2) {
      queueLevel[chosen]++;
    }
  }

  const totalTime = time;
  const cpuTime = gantt.filter(g => g.type === "cpu").length;

  const queues: QueueState[] = [0, 1, 2].map(q => ({
    queueIndex: q,
    processes: processes
      .map((p, i) => ({ pid: p.id, remainingBurst: remaining[i], idx: i }))
      .filter(item => !completed[item.idx] && queueLevel[item.idx] === q)
      .map(({ pid, remainingBurst }) => ({ pid, remainingBurst })),
  }));

  const metrics: Metrics = {
    algorithm: "MLFQ",
    cpuUtilization: totalTime > 0 ? (cpuTime / totalTime) * 100 : 0,
    throughput: totalTime > 0 ? n / totalTime : 0,
    avgWaitingTime: waitTime.reduce((a, b) => a + b, 0) / n,
    avgTurnaroundTime: turnaround.reduce((a, b) => a + b, 0) / n,
    avgResponseTime: responseTime.filter(r => r >= 0).reduce((a, b) => a + b, 0) / n,
    fairnessIndex: computeFairness(waitTime),
  };

  return { algorithm: "MLFQ", gantt: mergeGantt(gantt), queues, metrics, cpuProcess: null };
}

function simulateVRR(processes: Process[]): SimulationResult {
  const n = processes.length;
  const quantum = 4;
  const remaining = processes.map(p => p.burst);
  const completed = new Array(n).fill(false);
  const waitTime = new Array(n).fill(0);
  const turnaround = new Array(n).fill(0);
  const responseTime = new Array(n).fill(-1);
  const gantt: GanttEvent[] = [];

  const readyQueue: number[] = [];
  const auxQueue: number[] = [];
  const creditMap = new Map<number, number>();

  let time = 0;
  let done = 0;
  const sorted = processes.map((p, i) => ({ ...p, idx: i })).sort((a, b) => a.arrival - b.arrival);
  let nextArrival = 0;
  const maxTime = processes.reduce((s, p) => s + p.arrival + p.burst + p.io_duration, 0) + 20;

  while (done < n && time < maxTime) {
    while (nextArrival < sorted.length && sorted[nextArrival].arrival <= time) {
      readyQueue.push(sorted[nextArrival].idx);
      nextArrival++;
    }

    let chosen = -1;
    let credit = quantum;

    if (auxQueue.length > 0) {
      chosen = auxQueue.shift()!;
      credit = creditMap.get(chosen) || quantum;
    } else if (readyQueue.length > 0) {
      chosen = readyQueue.shift()!;
    }

    if (chosen === -1) {
      gantt.push({ pid: -1, start: time, end: time + 1, type: "idle" });
      time++;
      continue;
    }

    if (responseTime[chosen] === -1) responseTime[chosen] = time - processes[chosen].arrival;

    const execTime = Math.min(remaining[chosen], credit);
    for (let t = 0; t < execTime; t++) {
      gantt.push({ pid: processes[chosen].id, start: time, end: time + 1, type: "cpu" });
      remaining[chosen]--;
      time++;

      while (nextArrival < sorted.length && sorted[nextArrival].arrival <= time) {
        readyQueue.push(sorted[nextArrival].idx);
        nextArrival++;
      }

      if (remaining[chosen] === 0) {
        completed[chosen] = true;
        done++;
        turnaround[chosen] = time - processes[chosen].arrival;
        waitTime[chosen] = turnaround[chosen] - processes[chosen].burst;
        break;
      }
    }

    if (!completed[chosen] && remaining[chosen] > 0) {
      const usedTime = credit - (credit - Math.min(remaining[chosen] + (credit - execTime), credit));
      const leftover = quantum - execTime;
      if (leftover > 0) {
        creditMap.set(chosen, leftover);
        auxQueue.push(chosen);
      } else {
        readyQueue.push(chosen);
      }
    }
  }

  const totalTime = time;
  const cpuTime = gantt.filter(g => g.type === "cpu").length;

  const metrics: Metrics = {
    algorithm: "VRR",
    cpuUtilization: totalTime > 0 ? (cpuTime / totalTime) * 100 : 0,
    throughput: totalTime > 0 ? n / totalTime : 0,
    avgWaitingTime: waitTime.reduce((a, b) => a + b, 0) / n,
    avgTurnaroundTime: turnaround.reduce((a, b) => a + b, 0) / n,
    avgResponseTime: responseTime.filter(r => r >= 0).reduce((a, b) => a + b, 0) / n,
    fairnessIndex: computeFairness(waitTime),
  };

  return { algorithm: "VRR", gantt: mergeGantt(gantt), queues: [], metrics, cpuProcess: null };
}

function computeFairness(waitTimes: number[]): number {
  const n = waitTimes.length;
  if (n === 0) return 0;
  const sum = waitTimes.reduce((a, b) => a + b, 0);
  const sumSq = waitTimes.reduce((a, b) => a + b * b, 0);
  if (sumSq === 0) return 1;
  return (sum * sum) / (n * sumSq);
}

function mergeGantt(gantt: GanttEvent[]): GanttEvent[] {
  if (gantt.length === 0) return [];
  const merged: GanttEvent[] = [{ ...gantt[0] }];
  for (let i = 1; i < gantt.length; i++) {
    const last = merged[merged.length - 1];
    if (gantt[i].pid === last.pid && gantt[i].type === last.type) {
      last.end = gantt[i].end;
    } else {
      merged.push({ ...gantt[i] });
    }
  }
  return merged;
}

export function runSimulation(processes: Process[], algorithm: Algorithm): SimulationResult {
  switch (algorithm) {
    case "SRTF": return simulateSRTF(processes);
    case "MLFQ": return simulateMLFQ(processes);
    case "VRR": return simulateVRR(processes);
  }
}

export function generateRandomProcesses(count: number, burstMin: number, burstMax: number, arrivalMax: number): Process[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    arrival: Math.floor(Math.random() * (arrivalMax + 1)),
    burst: burstMin + Math.floor(Math.random() * (burstMax - burstMin + 1)),
    io_duration: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0,
    io_at: 0,
  })).map(p => ({ ...p, io_at: p.io_duration > 0 ? Math.floor(Math.random() * Math.max(1, p.burst - 1)) + 1 : 0 }));
}

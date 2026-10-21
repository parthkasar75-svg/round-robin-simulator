/**
 * Automated test suite for Round Robin Scheduling Algorithm logic
 */

function runRoundRobinAlgorithm(processes, quantum) {
  const n = processes.length;
  const procMap = new Map();

  processes.forEach((p, idx) => {
    procMap.set(p.id, {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      remainingTime: p.burstTime,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: -1,
      inputIndex: idx
    });
  });

  const sortedArrivals = Array.from(procMap.values())
    .sort((a, b) => a.arrivalTime - b.arrivalTime || a.inputIndex - b.inputIndex);

  let currentTime = 0;
  let completed = 0;
  const readyQueue = [];
  const gantt = [];
  let arrivalIndex = 0;
  let stepNumber = 1;
  const queueSnapshots = [];

  function enqueueNewArrivals(targetTime) {
    while (arrivalIndex < sortedArrivals.length && sortedArrivals[arrivalIndex].arrivalTime <= targetTime) {
      readyQueue.push(sortedArrivals[arrivalIndex]);
      arrivalIndex++;
    }
  }

  if (sortedArrivals.length > 0 && sortedArrivals[0].arrivalTime > currentTime) {
    gantt.push({
      id: "IDLE",
      startTime: currentTime,
      endTime: sortedArrivals[0].arrivalTime,
      isIdle: true
    });
    currentTime = sortedArrivals[0].arrivalTime;
  }
  enqueueNewArrivals(currentTime);

  queueSnapshots.push({
    step: 0,
    time: currentTime,
    runningProcess: null,
    execDuration: 0,
    readyQueue: readyQueue.map(p => ({ id: p.id, remainingTime: p.remainingTime })),
    event: `Initial queue state at t = ${currentTime}`
  });

  while (completed < n) {
    if (readyQueue.length === 0) {
      const nextProc = sortedArrivals[arrivalIndex];
      if (nextProc && nextProc.arrivalTime > currentTime) {
        const idleDuration = nextProc.arrivalTime - currentTime;
        gantt.push({
          id: "IDLE",
          startTime: currentTime,
          endTime: nextProc.arrivalTime,
          isIdle: true
        });
        currentTime = nextProc.arrivalTime;
        const arrivalsBefore = arrivalIndex;
        enqueueNewArrivals(currentTime);
        const newlyArrived = sortedArrivals.slice(arrivalsBefore, arrivalIndex).map(p => p.id);

        queueSnapshots.push({
          step: stepNumber++,
          time: currentTime,
          runningProcess: "IDLE",
          execDuration: idleDuration,
          readyQueue: readyQueue.map(p => ({ id: p.id, remainingTime: p.remainingTime })),
          event: `CPU idle for ${idleDuration} units. ${newlyArrived.join(", ")} arrived.`
        });
      } else {
        enqueueNewArrivals(currentTime);
      }
      continue;
    }

    const currentProc = readyQueue.shift();

    if (currentProc.responseTime === -1) {
      currentProc.responseTime = currentTime - currentProc.arrivalTime;
    }

    const execDuration = Math.min(quantum, currentProc.remainingTime);
    const startTime = currentTime;
    currentTime += execDuration;
    currentProc.remainingTime -= execDuration;

    gantt.push({
      id: currentProc.id,
      startTime: startTime,
      endTime: currentTime,
      isIdle: false
    });

    const prevArrivalIndex = arrivalIndex;
    enqueueNewArrivals(currentTime);
    const newArrivals = sortedArrivals.slice(prevArrivalIndex, arrivalIndex).map(p => p.id);

    let eventDesc = "";
    if (currentProc.remainingTime > 0) {
      readyQueue.push(currentProc);
      eventDesc = `${currentProc.id} executed for ${execDuration}u (rem: ${currentProc.remainingTime}). Preempted to queue tail.`;
    } else {
      currentProc.completionTime = currentTime;
      currentProc.turnaroundTime = currentProc.completionTime - currentProc.arrivalTime;
      currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
      completed++;
      eventDesc = `${currentProc.id} executed for ${execDuration}u and completed at t = ${currentTime}.`;
    }

    queueSnapshots.push({
      step: stepNumber++,
      time: currentTime,
      runningProcess: currentProc.id,
      execDuration: execDuration,
      readyQueue: readyQueue.map(p => ({ id: p.id, remainingTime: p.remainingTime })),
      event: eventDesc
    });
  }

  const results = processes.map(p => procMap.get(p.id));
  const totalTat = results.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalWt = results.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalRt = results.reduce((sum, p) => sum + p.responseTime, 0);

  return {
    results,
    gantt,
    queueSnapshots,
    avgTurnaround: totalTat / n,
    avgWaiting: totalWt / n,
    avgResponse: totalRt / n,
    totalTime: currentTime
  };
}

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
  }
}

console.log("=== TEST SUITE 1: Standard Lab Example (P1, P2, P3, Q=2) ===");
const sim1 = runRoundRobinAlgorithm([
  { id: "P1", arrivalTime: 0, burstTime: 5 },
  { id: "P2", arrivalTime: 1, burstTime: 4 },
  { id: "P3", arrivalTime: 2, burstTime: 2 }
], 2);

const p1 = sim1.results.find(p => p.id === "P1");
const p2 = sim1.results.find(p => p.id === "P2");
const p3 = sim1.results.find(p => p.id === "P3");

assert(p1.completionTime === 11, "P1 Completion Time should be 11");
assert(p1.turnaroundTime === 11, "P1 Turnaround Time should be 11");
assert(p1.waitingTime === 6, "P1 Waiting Time should be 6");
assert(p1.responseTime === 0, "P1 Response Time should be 0");

assert(p2.completionTime === 10, "P2 Completion Time should be 10");
assert(p2.turnaroundTime === 9, "P2 Turnaround Time should be 9");
assert(p2.waitingTime === 5, "P2 Waiting Time should be 5");
assert(p2.responseTime === 1, "P2 Response Time should be 1 (2 - 1)");

assert(p3.completionTime === 6, "P3 Completion Time should be 6");
assert(p3.turnaroundTime === 4, "P3 Turnaround Time should be 4");
assert(p3.waitingTime === 2, "P3 Waiting Time should be 2");
assert(p3.responseTime === 2, "P3 Response Time should be 2 (4 - 2)");

assert(Math.abs(sim1.avgTurnaround - 8.00) < 0.001, "Average Turnaround Time should be 8.00");
assert(Math.abs(sim1.avgWaiting - (13/3)) < 0.001, "Average Waiting Time should be 4.33");
assert(Math.abs(sim1.avgResponse - 1.00) < 0.001, "Average Response Time should be 1.00");

// Verify Gantt sequence
const gantt1Seq = sim1.gantt.map(g => `${g.id}[${g.startTime}-${g.endTime}]`).join(", ");
console.log("  Gantt Order:", gantt1Seq);
assert(gantt1Seq === "P1[0-2], P2[2-4], P3[4-6], P1[6-8], P2[8-10], P1[10-11]", "Gantt chart order matches textbook");

// Verify Ready Queue after each quantum
console.log("\n  Checking Ready Queue Transitions:");
const snaps1 = sim1.queueSnapshots;
assert(snaps1.length === 7, `7 Ready queue snapshots recorded (got ${snaps1.length})`);

const qAt0 = snaps1[0].readyQueue.map(p => p.id).join(",");
assert(qAt0 === "P1", "Initial queue at t=0 has [P1]");

const qAt2 = snaps1[1].readyQueue.map(p => p.id).join(",");
console.log("    t=2 queue:", qAt2);
assert(qAt2 === "P2,P3,P1", "Queue after Quantum 1 (t=2) is [P2, P3, P1]");

const qAt4 = snaps1[2].readyQueue.map(p => p.id).join(",");
console.log("    t=4 queue:", qAt4);
assert(qAt4 === "P3,P1,P2", "Queue after Quantum 2 (t=4) is [P3, P1, P2]");

const qAt6 = snaps1[3].readyQueue.map(p => p.id).join(",");
console.log("    t=6 queue:", qAt6);
assert(qAt6 === "P1,P2", "Queue after Quantum 3 (t=6) is [P1, P2] (P3 finished)");

const qAt8 = snaps1[4].readyQueue.map(p => p.id).join(",");
console.log("    t=8 queue:", qAt8);
assert(qAt8 === "P2,P1", "Queue after Quantum 4 (t=8) is [P2, P1]");

const qAt10 = snaps1[5].readyQueue.map(p => p.id).join(",");
console.log("    t=10 queue:", qAt10);
assert(qAt10 === "P1", "Queue after Quantum 5 (t=10) is [P1] (P2 finished)");

const qAt11 = snaps1[6].readyQueue.map(p => p.id).join(",");
console.log("    t=11 queue:", qAt11 || "(Empty)");
assert(qAt11 === "", "Queue after final Quantum 6 (t=11) is empty");


console.log("\n=== TEST SUITE 2: CPU Idle Period ===");
const sim2 = runRoundRobinAlgorithm([
  { id: "P1", arrivalTime: 2, burstTime: 3 },
  { id: "P2", arrivalTime: 8, burstTime: 2 }
], 2);

const gantt2Seq = sim2.gantt.map(g => `${g.id}[${g.startTime}-${g.endTime}]`).join(", ");
console.log("  Gantt Order with Idle:", gantt2Seq);
assert(sim2.gantt[0].id === "IDLE" && sim2.gantt[0].startTime === 0 && sim2.gantt[0].endTime === 2, "Initial idle 0-2");
assert(sim2.gantt[1].id === "P1" && sim2.gantt[1].startTime === 2 && sim2.gantt[1].endTime === 4, "P1 slice 2-4");
assert(sim2.gantt[2].id === "P1" && sim2.gantt[2].startTime === 4 && sim2.gantt[2].endTime === 5, "P1 finish 4-5");
assert(sim2.gantt[3].id === "IDLE" && sim2.gantt[3].startTime === 5 && sim2.gantt[3].endTime === 8, "Idle between 5-8");
assert(sim2.gantt[4].id === "P2" && sim2.gantt[4].startTime === 8 && sim2.gantt[4].endTime === 10, "P2 slice 8-10");

console.log(`\nTests Completed: ${passed}/${total} passed.`);
if (passed === total) {
  console.log("ALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("SOME TESTS FAILED!");
  process.exit(1);
}

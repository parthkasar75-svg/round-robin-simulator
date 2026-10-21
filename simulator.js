/**
 * Round Robin CPU Scheduling Simulator
 * Operating Systems Algorithm Simulation Logic
 */

// Distinct, academic-friendly color palette for processes
const PROCESS_COLORS = [
  "#2563eb", // Royal Blue
  "#059669", // Emerald Green
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#0891b2", // Cyan
  "#ea580c", // Orange
  "#4f46e5", // Indigo
  "#16a34a", // Green
  "#9333ea"  // Purple
];

// Helper to assign a consistent color to a process based on its index
function getProcessColor(index) {
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

// Global state
let processCount = 0;

// DOM Elements
const processTableBody = document.getElementById("process-table-body");
const timeQuantumInput = document.getElementById("time-quantum");
const errorMessageDiv = document.getElementById("error-message");
const resultsSection = document.getElementById("results-section");
const resultsTableBody = document.getElementById("results-table-body");
const ganttBar = document.getElementById("gantt-bar");
const ganttTimeline = document.getElementById("gantt-timeline");
const ganttLegend = document.getElementById("gantt-legend");
const avgTatSpan = document.getElementById("avg-tat");
const avgWtSpan = document.getElementById("avg-wt");
const avgRtSpan = document.getElementById("avg-rt");

// Buttons
const btnAddProcess = document.getElementById("btn-add-process");
const btnRun = document.getElementById("btn-run");
const btnLoadExample = document.getElementById("btn-load-example");
const btnReset = document.getElementById("btn-reset");

/**
 * Show a simple error message to the user
 */
function showError(msg) {
  errorMessageDiv.textContent = msg;
  errorMessageDiv.style.display = "block";
  if (typeof errorMessageDiv.scrollIntoView === "function") {
    errorMessageDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/**
 * Hide the error message banner
 */
function hideError() {
  errorMessageDiv.textContent = "";
  errorMessageDiv.style.display = "none";
}

/**
 * Add a new process row to the input table using safe DOM node creation
 */
function addProcessRow(pid = "", arrival = "", burst = "") {
  processCount++;
  const row = document.createElement("tr");
  row.className = "process-row";

  const defaultId = pid || `P${processCount}`;

  // Column 1: Process ID
  const tdId = document.createElement("td");
  const inputId = document.createElement("input");
  inputId.type = "text";
  inputId.className = "input-field proc-id";
  inputId.value = defaultId;
  inputId.placeholder = "e.g. P1";
  tdId.appendChild(inputId);

  // Column 2: Arrival Time
  const tdArrival = document.createElement("td");
  const inputArrival = document.createElement("input");
  inputArrival.type = "number";
  inputArrival.className = "input-field proc-arrival";
  inputArrival.value = arrival !== "" ? arrival : "";
  inputArrival.min = "0";
  inputArrival.step = "1";
  inputArrival.placeholder = "0";
  tdArrival.appendChild(inputArrival);

  // Column 3: Burst Time
  const tdBurst = document.createElement("td");
  const inputBurst = document.createElement("input");
  inputBurst.type = "number";
  inputBurst.className = "input-field proc-burst";
  inputBurst.value = burst !== "" ? burst : "";
  inputBurst.min = "1";
  inputBurst.step = "1";
  inputBurst.placeholder = "1";
  tdBurst.appendChild(inputBurst);

  // Column 4: Action (Remove)
  const tdAction = document.createElement("td");
  tdAction.style.textAlign = "center";
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-danger-outline btn-remove-row";
  removeBtn.textContent = "Remove";
  removeBtn.title = "Remove process";
  removeBtn.addEventListener("click", () => {
    row.remove();
    hideError();
  });
  tdAction.appendChild(removeBtn);

  row.appendChild(tdId);
  row.appendChild(tdArrival);
  row.appendChild(tdBurst);
  row.appendChild(tdAction);

  processTableBody.appendChild(row);
}

/**
 * Load the standard lab example:
 * P1: Arrival = 0, Burst = 5
 * P2: Arrival = 1, Burst = 4
 * P3: Arrival = 2, Burst = 2
 * Quantum = 2
 */
function loadExampleData() {
  hideError();
  processTableBody.innerHTML = "";
  processCount = 0;

  timeQuantumInput.value = "2";

  addProcessRow("P1", 0, 5);
  addProcessRow("P2", 1, 4);
  addProcessRow("P3", 2, 2);

  resultsSection.style.display = "none";
}

/**
 * Reset all simulator inputs to a clean default state
 */
function resetSimulator() {
  hideError();
  processTableBody.innerHTML = "";
  processCount = 0;
  timeQuantumInput.value = "2";
  resultsSection.style.display = "none";

  // Provide one empty process row for immediate input
  addProcessRow("P1", "", "");
}

/**
 * Read and validate user inputs from the table and quantum field
 */
function getValidatedInputs() {
  const quantum = parseFloat(timeQuantumInput.value);
  if (isNaN(quantum) || quantum <= 0) {
    showError("Time Quantum must be a valid positive number greater than zero.");
    return null;
  }

  const rows = processTableBody.querySelectorAll(".process-row");
  if (rows.length === 0) {
    showError("Please add at least one process to simulate.");
    return null;
  }

  const processes = [];
  const seenIds = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const idInput = row.querySelector(".proc-id");
    const arrivalInput = row.querySelector(".proc-arrival");
    const burstInput = row.querySelector(".proc-burst");

    const id = idInput ? idInput.value.trim() : "";
    const arrival = arrivalInput ? parseFloat(arrivalInput.value) : NaN;
    const burst = burstInput ? parseFloat(burstInput.value) : NaN;

    if (!id) {
      showError(`Row ${i + 1}: Process ID cannot be empty.`);
      return null;
    }

    if (seenIds.has(id)) {
      showError(`Process ID "${id}" is duplicated. Each process must have a unique ID.`);
      return null;
    }
    seenIds.add(id);

    if (isNaN(arrival) || arrival < 0) {
      showError(`Process ${id}: Arrival Time must be a non-negative number (0 or greater).`);
      return null;
    }

    if (isNaN(burst) || burst <= 0) {
      showError(`Process ${id}: Burst Time must be a positive number greater than zero.`);
      return null;
    }

    processes.push({
      id: id,
      arrivalTime: arrival,
      burstTime: burst,
      inputIndex: i
    });
  }

  return { processes, quantum };
}

/**
 * Preemptive Round Robin CPU Scheduling Algorithm
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

  // Sort by arrival time primarily, original order secondarily
  const sortedArrivals = Array.from(procMap.values())
    .sort((a, b) => a.arrivalTime - b.arrivalTime || a.inputIndex - b.inputIndex);

  let currentTime = 0;
  let completed = 0;
  const readyQueue = [];
  const gantt = [];
  let arrivalIndex = 0;

  // Helper to push all processes that have arrived by targetTime into the ready queue
  function enqueueNewArrivals(targetTime) {
    while (arrivalIndex < sortedArrivals.length && sortedArrivals[arrivalIndex].arrivalTime <= targetTime) {
      readyQueue.push(sortedArrivals[arrivalIndex]);
      arrivalIndex++;
    }
  }

  // Handle initial CPU idle time before the very first process arrives
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

  // Main execution loop
  while (completed < n) {
    if (readyQueue.length === 0) {
      // CPU is idle; advance time to next process arrival
      const nextProc = sortedArrivals[arrivalIndex];
      if (nextProc && nextProc.arrivalTime > currentTime) {
        gantt.push({
          id: "IDLE",
          startTime: currentTime,
          endTime: nextProc.arrivalTime,
          isIdle: true
        });
        currentTime = nextProc.arrivalTime;
      }
      enqueueNewArrivals(currentTime);
      continue;
    }

    // Dequeue next process from head of ready queue
    const currentProc = readyQueue.shift();

    // Record response time upon first CPU allocation
    if (currentProc.responseTime === -1) {
      currentProc.responseTime = currentTime - currentProc.arrivalTime;
    }

    const execDuration = Math.min(quantum, currentProc.remainingTime);
    const startTime = currentTime;
    currentTime += execDuration;
    currentProc.remainingTime -= execDuration;

    // Record Gantt chart segment
    gantt.push({
      id: currentProc.id,
      startTime: startTime,
      endTime: currentTime,
      isIdle: false
    });

    // Enqueue processes arriving during or exactly at the end of this quantum
    // BEFORE re-enqueuing the preempted current process
    enqueueNewArrivals(currentTime);

    if (currentProc.remainingTime > 0) {
      // Preempted: place back at the end of the ready queue
      readyQueue.push(currentProc);
    } else {
      // Process finished execution
      currentProc.completionTime = currentTime;
      currentProc.turnaroundTime = currentProc.completionTime - currentProc.arrivalTime;
      currentProc.waitingTime = currentProc.turnaroundTime - currentProc.burstTime;
      completed++;
    }
  }

  // Preserve input order for results table
  const results = processes.map(p => procMap.get(p.id));

  // Compute average metrics
  const totalTat = results.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalWt = results.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalRt = results.reduce((sum, p) => sum + p.responseTime, 0);

  const avgTurnaround = totalTat / n;
  const avgWaiting = totalWt / n;
  const avgResponse = totalRt / n;

  return {
    results,
    gantt,
    avgTurnaround,
    avgWaiting,
    avgResponse,
    totalTime: currentTime
  };
}

/**
 * Render horizontal Gantt Chart and timeline markers
 */
function renderGanttChart(gantt, totalTime, processes) {
  ganttBar.innerHTML = "";
  ganttTimeline.innerHTML = "";
  ganttLegend.innerHTML = "";

  // Map process IDs to consistent colors
  const colorMap = new Map();
  processes.forEach((p, idx) => {
    colorMap.set(p.id, getProcessColor(idx));
  });

  // Render Legend
  processes.forEach((p) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = colorMap.get(p.id);

    const label = document.createElement("span");
    label.textContent = p.id;

    item.appendChild(swatch);
    item.appendChild(label);
    ganttLegend.appendChild(item);
  });

  // Check if any idle periods exist
  const hasIdle = gantt.some(b => b.isIdle);
  if (hasIdle) {
    const idleItem = document.createElement("div");
    idleItem.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = "var(--idle-color)";

    const label = document.createElement("span");
    label.textContent = "IDLE";

    idleItem.appendChild(swatch);
    idleItem.appendChild(label);
    ganttLegend.appendChild(idleItem);
  }

  // Render Gantt Blocks
  gantt.forEach((block) => {
    const duration = block.endTime - block.startTime;
    const widthPercent = (duration / totalTime) * 100;

    const blockElem = document.createElement("div");
    blockElem.className = `gantt-block ${block.isIdle ? "idle" : ""}`;
    blockElem.style.width = `${widthPercent}%`;
    blockElem.style.flexBasis = `${widthPercent}%`;

    if (!block.isIdle) {
      blockElem.style.backgroundColor = colorMap.get(block.id);
    }

    blockElem.textContent = block.id;
    blockElem.title = `${block.id}: Time ${block.startTime} to ${block.endTime} (${duration} units)`;

    ganttBar.appendChild(blockElem);
  });

  // Render timeline markers at transition boundaries
  const timePoints = [0];
  gantt.forEach((block) => {
    if (!timePoints.includes(block.endTime)) {
      timePoints.push(block.endTime);
    }
  });

  timePoints.forEach((time) => {
    const tick = document.createElement("span");
    tick.className = "gantt-time-tick";
    const leftPercent = (time / totalTime) * 100;
    tick.style.left = `${leftPercent}%`;
    tick.textContent = time;
    ganttTimeline.appendChild(tick);
  });
}

/**
 * Render the Results Table and Summary Averages
 */
function renderResultsTable(results, avgTat, avgWt, avgRt) {
  resultsTableBody.innerHTML = "";

  results.forEach((proc) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    const strong = document.createElement("strong");
    strong.textContent = proc.id;
    tdId.appendChild(strong);

    const tdAt = document.createElement("td");
    tdAt.textContent = proc.arrivalTime;

    const tdBt = document.createElement("td");
    tdBt.textContent = proc.burstTime;

    const tdCt = document.createElement("td");
    tdCt.textContent = proc.completionTime;

    const tdTat = document.createElement("td");
    tdTat.textContent = proc.turnaroundTime;

    const tdWt = document.createElement("td");
    tdWt.textContent = proc.waitingTime;

    const tdRt = document.createElement("td");
    tdRt.textContent = proc.responseTime;

    tr.appendChild(tdId);
    tr.appendChild(tdAt);
    tr.appendChild(tdBt);
    tr.appendChild(tdCt);
    tr.appendChild(tdTat);
    tr.appendChild(tdWt);
    tr.appendChild(tdRt);

    resultsTableBody.appendChild(tr);
  });

  // Display averages rounded to 2 decimal places
  avgTatSpan.textContent = avgTat.toFixed(2);
  avgWtSpan.textContent = avgWt.toFixed(2);
  avgRtSpan.textContent = avgRt.toFixed(2);
}

/**
 * Main Run Simulation Action
 */
function handleRunSimulation() {
  hideError();

  const inputs = getValidatedInputs();
  if (!inputs) return;

  const { processes, quantum } = inputs;
  const simulation = runRoundRobinAlgorithm(processes, quantum);

  renderGanttChart(simulation.gantt, simulation.totalTime, processes);
  renderResultsTable(
    simulation.results,
    simulation.avgTurnaround,
    simulation.avgWaiting,
    simulation.avgResponse
  );

  resultsSection.style.display = "block";
  if (typeof resultsSection.scrollIntoView === "function") {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Event Listeners
if (btnAddProcess) {
  btnAddProcess.addEventListener("click", () => {
    hideError();
    addProcessRow();
  });
}

if (btnRun) btnRun.addEventListener("click", handleRunSimulation);
if (btnLoadExample) btnLoadExample.addEventListener("click", loadExampleData);
if (btnReset) btnReset.addEventListener("click", resetSimulator);

// Initialize on page load with standard example
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    loadExampleData();
  });
}

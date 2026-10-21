# Round Robin CPU Scheduling Simulator

A clean, minimalist, academic web application designed for Operating Systems courses to simulate and visualize the **Preemptive Round Robin (RR) CPU Scheduling Algorithm**.

---

## Features

1. **Process Input Table**:
   - Add and remove processes dynamically.
   - Configure **Process ID**, **Arrival Time** ($\ge 0$), and **Burst Time** ($> 0$).
   - Configurable **Time Quantum** ($> 0$).

2. **Clean Academic Controls**:
   - **Run Simulation**: Validates inputs, executes scheduling logic, and generates visualizations and metrics.
   - **Load Example**: Pre-populates the standard OS lab example ($P_1$: 0, 5; $P_2$: 1, 4; $P_3$: 2, 2 with Quantum = 2).
   - **Reset**: Restores a clean state with empty input rows and resets Time Quantum to 2.

3. **Horizontal Gantt Chart**:
   - Displays process execution order with proportional block widths.
   - Clearly labels process start and end times at timeline tick marks.
   - Visualizes CPU idle time when no process is ready in the queue.
   - Uses distinct academic colors for each process and neutral gray for idle slots.

4. **Ready Queue State Tracker (After Every Time Quantum)**:
   - Tracks the exact contents of the ready queue after each quantum time slice.
   - Shows active execution, process badges with remaining burst times, transition arrows (Head &rarr; Tail), and event descriptions.
   - Accurately demonstrates preemption ordering (new arrivals entering the queue before the preempted process).

5. **Results Table & Performance Metrics**:
   - Displays calculated values for each process:
     - **Completion Time ($CT$)**: Time at which execution completes.
     - **Turnaround Time ($TAT = CT - AT$)**: Total time from arrival to completion.
     - **Waiting Time ($WT = TAT - BT$)**: Total time spent waiting in the ready queue.
     - **Response Time ($RT = \text{First Start Time} - AT$)**: Time from arrival until CPU first begins execution.
   - Summary averages displayed below the table:
     - **Average Turnaround Time**
     - **Average Waiting Time**
     - **Average Response Time**


---

## File Structure

```text
round-robin-simulator/
├── index.html               # Main single-page academic UI layout
├── style.css                # Clean, minimalist CSS styling
├── simulator.js             # Round Robin algorithm and DOM controller
├── test_suite.js            # Automated test suite for scheduling algorithm
├── test_dom_simulation.js   # Automated test suite for UI interactions
└── README.md                # Documentation and running instructions
```

---

## How to Run Locally

This application requires **no build tools, no backend, and no external libraries**. It runs directly in any modern web browser.

### Option 1: Direct File Opening (Easiest)
1. Navigate to the project directory:
   ```
   C:\Users\User\.gemini\antigravity-ide\scratch\round-robin-simulator\
   ```
2. Double-click [index.html](file:///C:/Users/User/.gemini/antigravity-ide/scratch/round-robin-simulator/index.html) (or right-click and choose **Open with** > **Google Chrome** / **Microsoft Edge** / **Firefox**).

### Option 2: Using Python's Built-in HTTP Server
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd "C:\Users\User\.gemini\antigravity-ide\scratch\round-robin-simulator"
   python -m http.server 8080
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## Verification & Testing

To run the automated algorithm verification suite:
```powershell
node test_suite.js
```

To run the UI interaction & validation test suite:
```powershell
node test_dom_simulation.js
```
Both test suites will verify all scheduling logic, edge cases (idle gaps, preemption order), and input validation rules.

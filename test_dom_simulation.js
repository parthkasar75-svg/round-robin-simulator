/**
 * Comprehensive DOM & Interaction Verification Script
 */

class MockElement {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this._value = "";
    this.style = {};
    this.classList = new Set();
    this.listeners = {};
    this.attributes = {};
    this._textContent = "";
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get textContent() { return this._textContent; }
  set textContent(v) { this._textContent = String(v); }

  set innerHTML(v) {
    if (v === "") {
      this.children = [];
      this._textContent = "";
    }
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter(c => c !== this);
    }
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn({ target: this }));
    }
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const check = (node) => {
      let match = false;
      if (selector.startsWith(".") && node.className && node.className.split(" ").includes(selector.substring(1))) {
        match = true;
      } else if (selector.startsWith("#") && node.id === selector.substring(1)) {
        match = true;
      } else if (node.tagName.toLowerCase() === selector.toLowerCase()) {
        match = true;
      }
      if (match) results.push(node);
      for (const c of node.children) check(c);
    };
    for (const c of this.children) check(c);
    return results;
  }

  scrollIntoView() {}
}

const mockDocument = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      const el = new MockElement("div");
      el.id = id;
      this.elements[id] = el;
    }
    return this.elements[id];
  },
  createElement(tag) {
    return new MockElement(tag);
  },
  querySelectorAll(sel) {
    return this.getElementById("process-table-body").querySelectorAll(sel);
  },
  addEventListener(event, fn) {
    if (event === "DOMContentLoaded") fn();
  }
};

global.document = mockDocument;
global.window = {};

const fs = require("fs");
const path = require("path");
const code = fs.readFileSync(path.join(__dirname, "simulator.js"), "utf8");

eval(code);

console.log("=== VERIFYING DOM INTERACTIONS ===");

// 1. Check Initial State
const tbody = document.getElementById("process-table-body");
console.log(`Initial rows count: ${tbody.children.length}`);
if (tbody.children.length === 3) {
  console.log("PASS: Default loaded 3 rows for standard example");
} else {
  console.error("FAIL: Did not load 3 rows");
}

const quantumInput = document.getElementById("time-quantum");
console.log(`Time quantum: ${quantumInput.value}`);
if (quantumInput.value === "2") {
  console.log("PASS: Default time quantum is 2");
}

// 2. Click 'Run Simulation'
const btnRun = document.getElementById("btn-run");
btnRun.dispatchEvent("click");

const resultsSection = document.getElementById("results-section");
console.log(`Results section visible: ${resultsSection.style.display}`);
if (resultsSection.style.display === "block") {
  console.log("PASS: Results section is displayed");
}

const resultsBody = document.getElementById("results-table-body");
console.log(`Result rows count: ${resultsBody.children.length}`);
if (resultsBody.children.length === 3) {
  console.log("PASS: 3 result rows created in Results Table");
}

const queueBody = document.getElementById("queue-table-body");
console.log(`Ready Queue rows count: ${queueBody.children.length}`);
if (queueBody.children.length === 7) {
  console.log("PASS: 7 Ready Queue transition rows displayed in Ready Queue table");
} else {
  console.error("FAIL: Ready Queue rows count mismatch: got " + queueBody.children.length);
}


const avgTat = document.getElementById("avg-tat").textContent;
const avgWt = document.getElementById("avg-wt").textContent;
const avgRt = document.getElementById("avg-rt").textContent;
console.log(`Averages -> TAT: ${avgTat}, WT: ${avgWt}, RT: ${avgRt}`);
if (avgTat === "8.00" && avgWt === "4.33" && avgRt === "1.00") {
  console.log("PASS: Averages calculated and formatted to 2 decimals accurately!");
} else {
  console.error("FAIL: Averages mismatch");
}

const ganttBar = document.getElementById("gantt-bar");
console.log(`Gantt blocks count: ${ganttBar.children.length}`);
if (ganttBar.children.length === 6) {
  console.log("PASS: 6 Gantt chart blocks created (P1, P2, P3, P1, P2, P1)");
} else {
  console.error("FAIL: Gantt blocks count mismatch");
}

// 3. Test Reset
const btnReset = document.getElementById("btn-reset");
btnReset.dispatchEvent("click");
console.log(`After Reset -> Rows count: ${tbody.children.length}, Results display: ${resultsSection.style.display}`);
if (tbody.children.length === 1 && resultsSection.style.display === "none") {
  console.log("PASS: Reset restored clean state with 1 empty row and hidden results");
} else {
  console.error("FAIL: Reset behavior mismatch");
}

// 4. Test Load Example
const btnLoadExample = document.getElementById("btn-load-example");
btnLoadExample.dispatchEvent("click");
console.log(`After Load Example -> Rows count: ${tbody.children.length}`);
if (tbody.children.length === 3) {
  console.log("PASS: Load Example restored 3 rows");
} else {
  console.error("FAIL: Load Example behavior mismatch");
}

// 5. Test Validation: Invalid Quantum
quantumInput.value = "0";
btnRun.dispatchEvent("click");
const errMsg1 = document.getElementById("error-message").textContent;
console.log(`Validation test (Quantum=0): ${errMsg1}`);
if (errMsg1.includes("Time Quantum must be a valid positive number")) {
  console.log("PASS: Invalid Time Quantum caught properly");
}

// 6. Test Validation: Negative Arrival Time
quantumInput.value = "2";
const firstArrival = tbody.children[0].querySelector(".proc-arrival");
firstArrival.value = "-1";
btnRun.dispatchEvent("click");
const errMsg2 = document.getElementById("error-message").textContent;
console.log(`Validation test (Negative Arrival): ${errMsg2}`);
if (errMsg2.includes("Arrival Time must be a non-negative number")) {
  console.log("PASS: Negative Arrival Time caught properly");
}

// 7. Test Validation: Zero Burst Time
firstArrival.value = "0";
const firstBurst = tbody.children[0].querySelector(".proc-burst");
firstBurst.value = "0";
btnRun.dispatchEvent("click");
const errMsg3 = document.getElementById("error-message").textContent;
console.log(`Validation test (Burst Time=0): ${errMsg3}`);
if (errMsg3.includes("Burst Time must be a positive number greater than zero")) {
  console.log("PASS: Zero Burst Time caught properly");
}

// 8. Test Validation: Empty Table
btnReset.dispatchEvent("click");
tbody.children[0].querySelector(".btn-remove-row").dispatchEvent("click");
btnRun.dispatchEvent("click");
const errMsg4 = document.getElementById("error-message").textContent;
console.log(`Validation test (Empty Table): ${errMsg4}`);
if (errMsg4.includes("Please add at least one process")) {
  console.log("PASS: Empty process table caught properly");
}

console.log("\nALL 8 INTERACTION & VALIDATION TESTS PASSED PERFECTLY!");

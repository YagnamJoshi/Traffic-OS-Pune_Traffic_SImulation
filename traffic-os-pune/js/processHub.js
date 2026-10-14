
/* =====================================================
   TrafficOS — Process Control Center
   File: js/processHub.js
   ===================================================== */

const processHub = {
  query: "",
  filter: "ALL",
  selectedPID: null,
  rows: [],
  table: null,
  observer: null,
  frame: null
};

function processEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeState(value) {
  const text = String(value || "").toUpperCase();

  if (text.includes("RUNNING")) return "RUNNING";
  if (text.includes("READY")) return "READY";
  if (text.includes("WAIT") || text.includes("BLOCK"))
    return "WAITING";
  if (text.includes("TERMINAT")) return "TERMINATED";
  if (text.includes("NEW")) return "NEW";

  return "OTHER";
}

function findProcessTable() {
  const root = document.getElementById("page-processes");
  if (!root) return null;

  // Prefer the existing process table, not our own UI.
  return [...root.querySelectorAll("table")]
    .find(table =>
      !table.closest("#processHub") &&
      table.querySelector("tbody")
    ) || null;
}

function readProcessRows() {
  const table = findProcessTable();
  processHub.table = table;

  if (!table) {
    processHub.rows = [];
    return;
  }

  const headers = [...table.querySelectorAll("thead th")]
    .map(th => th.textContent.trim().toLowerCase());

  const data = [...table.querySelectorAll("tbody tr")]
    .filter(tr => tr.querySelectorAll("td").length > 0)
    .map(tr => {
      const cells = [...tr.querySelectorAll("td")]
        .map(td => td.textContent.trim());

      const lookup = (...names) => {
        const index = headers.findIndex(h =>
          names.some(name => h.includes(name))
        );
        return index >= 0 ? cells[index] : "";
      };

      const pid = lookup("pid", "process id") || cells[0];
      const name = lookup("name", "process") ||
                   cells[1] || pid;
      const stateText = lookup("state", "status") ||
                        cells.find(c =>
                          /running|ready|waiting|blocked|terminated|new/i
                            .test(c)
                        ) || "";

      return {
        pid,
        name,
        state: normalizeState(stateText),
        originalState: stateText || "Unknown",
        cells,
        headers,
        element: tr
      };
    });

  processHub.rows = data;
}

function processStateColor(state) {
  const colors = {
    RUNNING: "running",
    READY: "ready",
    WAITING: "waiting",
    TERMINATED: "terminated",
    NEW: "new"
  };

  return colors[state] || "other";
}

function updateProcessStats() {
  const rows = processHub.rows;

  const count = state =>
    rows.filter(row => row.state === state).length;

  const values = {
    total: rows.length,
    running: count("RUNNING"),
    ready: count("READY"),
    waiting: count("WAITING")
  };

  for (const [key, value] of Object.entries(values)) {
    const target = document.getElementById(
      `ph-${key}`
    );
    if (target) target.textContent = value;
  }

  const distribution = document.getElementById(
    "ph-distribution"
  );

  if (distribution) {
    const states = [
      ["RUNNING", count("RUNNING")],
      ["READY", count("READY")],
      ["WAITING", count("WAITING")],
      ["OTHER", rows.length -
        count("RUNNING") -
        count("READY") -
        count("WAITING")]
    ];

    distribution.innerHTML = states.map(([name, number]) => {
      const percent = rows.length
        ? (number / rows.length) * 100
        : 0;

      return `
        <div class="ph-dist-item">
          <div class="ph-dist-label">
            <span>${name}</span>
            <strong>${number}</strong>
          </div>
          <div class="ph-progress">
            <div class="ph-progress-${name.toLowerCase()}"
                 style="width:${percent}%"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

function applyProcessFilters() {
  const query = processHub.query.toLowerCase();
  const table = processHub.table;

  let visible = 0;

  for (const row of processHub.rows) {
    const matchesQuery =
      row.cells.join(" ").toLowerCase().includes(query);

    const matchesState =
      processHub.filter === "ALL" ||
      row.state === processHub.filter;

    const show = matchesQuery && matchesState;

    row.element.style.display = show ? "" : "none";

    if (show) visible++;
  }

  const result = document.getElementById("ph-results");

  if (result) {
    result.textContent =
      `${visible} of ${processHub.rows.length} processes shown`;
  }

  // Add accessible inspection controls to the existing rows.
  for (const row of processHub.rows) {
    row.element.classList.add("ph-inspectable");
    row.element.tabIndex = 0;
    row.element.setAttribute("role", "button");
    row.element.setAttribute(
      "aria-label",
      `Inspect process ${row.pid}`
    );
  }

  if (!table) {
    if (result) {
      result.textContent =
        "Waiting for the simulation process table";
    }
  }
}

function inspectProcess(pid) {
  const row = processHub.rows.find(
    item => item.pid === pid
  );

  const inspector = document.getElementById(
    "ph-inspector"
  );

  if (!inspector) return;

  if (!row) {
    inspector.innerHTML = `
      <div class="ph-inspector-empty">
        Select a process from the table to inspect it.
      </div>
    `;
    processHub.selectedPID = null;
    return;
  }

  processHub.selectedPID = pid;

  const properties = row.cells.map((value, index) => {
    const label = row.headers[index] ||
                  `Column ${index + 1}`;

    return `
      <div class="ph-property">
        <span>${processEscape(label)}</span>
        <strong>${processEscape(value)}</strong>
      </div>
    `;
  }).join("");

  inspector.innerHTML = `
    <div class="ph-inspector-heading">
      <div>
        <span class="ph-kicker">PROCESS DETAILS</span>
        <h3>${processEscape(row.name)}</h3>
      </div>
      <span class="ph-state ph-state-${processStateColor(row.state)}">
        ${processEscape(row.originalState)}
      </span>
    </div>

    <div class="ph-property-grid">
      ${properties}
    </div>

    <div class="ph-process-explanation">
      <strong>What this state means</strong>
      <p>${getStateExplanation(row.state)}</p>
    </div>
  `;
}

function getStateExplanation(state) {
  const explanations = {
    RUNNING:
      "The process is currently assigned CPU execution in the simulation.",
    READY:
      "The process can run but is waiting to be selected by the scheduler.",
    WAITING:
      "The process is waiting for an event or resource before it can continue.",
    TERMINATED:
      "The process has completed or has been stopped.",
    NEW:
      "The process has been created and is awaiting admission."
  };

  return explanations[state] ||
    "The simulator reports this process state. Inspect the process data for more information.";
}

function refreshProcessHub() {
  readProcessRows();
  updateProcessStats();
  applyProcessFilters();

  if (processHub.selectedPID !== null) {
    inspectProcess(processHub.selectedPID);
  }
}

function scheduleProcessRefresh() {
  if (processHub.frame !== null) return;

  processHub.frame = requestAnimationFrame(() => {
    processHub.frame = null;
    refreshProcessHub();
  });
}

function exportProcessesCSV() {
  const table = processHub.table;

  if (!table) return;

  const headers = [...table.querySelectorAll("thead th")]
    .map(th => th.textContent.trim());

  const rows = processHub.rows.map(row => row.cells);

  const csvCell = value =>
    `"${String(value).replaceAll('"', '""')}"`;

  const csv = [headers, ...rows]
    .map(row => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    { type: "text/csv;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "trafficos-processes.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initializeProcessHub() {
  const page = document.getElementById("page-processes");
  if (!page || document.getElementById("processHub")) return;

  const hub = document.createElement("div");
  hub.id = "processHub";

  hub.innerHTML = `
    <div class="ph-hero">
      <div>
        <span class="ph-kicker">TRAFFICOS / PROCESS MANAGER</span>
        <h2>Process Control Center</h2>
        <p>
          Monitor process states, explore the ready queue,
          and inspect the simulated operating system.
        </p>
      </div>
      <span class="ph-live">
        <span class="ph-live-dot"></span>
        LIVE SIMULATION DATA
      </span>
    </div>

    <div class="ph-stats">
      <div class="ph-stat">
        <span>Total Processes</span>
        <strong id="ph-total">0</strong>
        <small>Tracked entries</small>
      </div>
      <div class="ph-stat">
        <span>Running</span>
        <strong id="ph-running">0</strong>
        <small>Using CPU</small>
      </div>
      <div class="ph-stat">
        <span>Ready</span>
        <strong id="ph-ready">0</strong>
        <small>Awaiting CPU</small>
      </div>
      <div class="ph-stat">
        <span>Waiting</span>
        <strong id="ph-waiting">0</strong>
        <small>Blocked / waiting</small>
      </div>
    </div>

    <div class="ph-panels">
      <div class="ph-panel">
        <div class="ph-panel-title">
          <h3>Process State Distribution</h3>
          <span>Live overview</span>
        </div>
        <div id="ph-distribution"></div>
      </div>

      <div class="ph-panel">
        <div class="ph-panel-title">
          <h3>Process Lifecycle</h3>
          <span>OS concept</span>
        </div>

        <div class="ph-lifecycle">
          <span>NEW</span>
          <b>→</b>
          <span>READY</span>
          <b>→</b>
          <span>RUNNING</span>
          <b>→</b>
          <span>TERMINATED</span>
        </div>

        <p class="ph-note">
          A running process may return to Ready when
          preempted, or enter Waiting while blocked.
          When its awaited event completes, it can
          return to Ready.
        </p>
      </div>
    </div>

    <div class="ph-toolbar">
      <div>
        <h3>Process Explorer</h3>
        <p id="ph-results">Loading processes...</p>
      </div>

      <div class="ph-toolbar-actions">
        <input id="ph-search"
               type="search"
               placeholder="Search PID, name, priority...">

        <select id="ph-filter"
                aria-label="Filter by process state">
          <option value="ALL">All States</option>
          <option value="RUNNING">Running</option>
          <option value="READY">Ready</option>
          <option value="WAITING">Waiting</option>
          <option value="NEW">New</option>
          <option value="TERMINATED">Terminated</option>
          <option value="OTHER">Other</option>
        </select>

        <button id="ph-export" type="button">
          Export CSV
        </button>
      </div>
    </div>

    <div class="ph-inspector" id="ph-inspector">
      <div class="ph-inspector-empty">
        Select a process from the existing table
        below to inspect its details.
      </div>
    </div>
  `;

  // Add the dashboard above the existing process controls.
  page.prepend(hub);

  document.getElementById("ph-search")
    .addEventListener("input", event => {
      processHub.query = event.target.value;
      scheduleProcessRefresh();
    });

  document.getElementById("ph-filter")
    .addEventListener("change", event => {
      processHub.filter = event.target.value;
      scheduleProcessRefresh();
    });

  document.getElementById("ph-export")
    .addEventListener("click", exportProcessesCSV);

  // Delegated handler survives table rerenders.
  page.addEventListener("click", event => {
    const row = event.target.closest("tbody tr");
    if (!row || row.closest("#processHub")) return;

    const match = processHub.rows.find(
      item => item.element === row
    );

    if (match) inspectProcess(match.pid);
  });

  page.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const row = event.target.closest("tbody tr");
    if (!row || row.closest("#processHub")) return;

    const match = processHub.rows.find(
      item => item.element === row
    );

    if (match) {
      event.preventDefault();
      inspectProcess(match.pid);
    }
  });

  // Watch only the existing process table's body.
  // Avoid observing our own dashboard updates.
  function attachTableObserver() {
    const table = findProcessTable();

    if (table === processHub.table &&
        processHub.observer) return;

    processHub.observer?.disconnect();
    processHub.table = table;

    if (table) {
      processHub.observer = new MutationObserver(
        scheduleProcessRefresh
      );

      processHub.observer.observe(table, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    scheduleProcessRefresh();
  }

  attachTableObserver();

  // Reconnect if the application replaces the table.
  setInterval(attachTableObserver, 1500);
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeProcessHub,
    { once: true }
  );
} else {
  initializeProcessHub();
}

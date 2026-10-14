
/* =====================================================
   TrafficOS — CPU Scheduling Lab
   File: js/schedulerLab.js
   ===================================================== */

import { state } from "./state.js";
import { getSchedulingHistory } from "./scheduler.js";

const lab = {
    selectedTid: null,
    lastSignature: ""
};

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getThreadById(tid) {
    return state.threads.find(t => t.tid === tid);
}

function getProcessById(pid) {
    return state.processes.find(p => p.pid === pid);
}

function getCurrentThread() {
    return getThreadById(state.scheduler.currentThread);
}

function renderMetric(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderLabMetrics() {
    const scheduler = state.scheduler;
    const current = getCurrentThread();

    renderMetric("sl-running",
        current?.tid || "IDLE");

    renderMetric("sl-ready",
        scheduler.readyQueue.length);

    renderMetric("sl-cpu",
        `${scheduler.cpuUtilization || 0}%`);

    renderMetric("sl-switches",
        scheduler.contextSwitches || 0);

    renderMetric("sl-algorithm",
        scheduler.algorithm || "Unknown");

    renderMetric("sl-quantum",
        scheduler.timeQuantum ?? "—");
}

function renderReadyQueue() {
    const root = document.getElementById("sl-readyQueue");
    if (!root) return;

    const queue = state.scheduler.readyQueue;

    root.innerHTML = queue.length
        ? queue.map((tid, index) => {
            const thread = getThreadById(tid);
            const process = thread
                ? getProcessById(thread.pid)
                : null;

            return `
                <button class="sl-queue-item"
                        data-thread="${esc(tid)}"
                        type="button">
                    <span class="sl-queue-position">
                        ${index + 1}
                    </span>
                    <strong>${esc(tid)}</strong>
                    <small>${esc(process?.name || "Thread")}</small>
                </button>
            `;
        }).join("")
        : `<p class="sl-empty">Ready queue is empty.</p>`;
}

function renderGantt() {
    const root = document.getElementById("sl-gantt");
    if (!root) return;

    const history = getSchedulingHistory();

    if (!history.length) {
        root.innerHTML = `
            <p class="sl-empty">
                Start the simulation to record CPU execution.
            </p>
        `;
        return;
    }

    const recent = history.slice(-35);
    const colors = [
        "#34d399", "#60a5fa", "#fbbf24",
        "#c084fc", "#fb7185", "#2dd4bf"
    ];

    const unique = [
        ...new Set(
            recent.map(item => item.tid)
                .filter(tid => tid !== "IDLE")
        )
    ];

    const colorFor = tid => {
        if (tid === "IDLE") return "#64748b";

        return colors[
            unique.indexOf(tid) % colors.length
        ];
    };

    root.innerHTML = `
        <div class="sl-gantt-track">
            ${recent.map(item => `
                <div class="sl-gantt-block"
                     style="
                        flex:${Math.max(1, item.duration)};
                        background:${colorFor(item.tid)};
                     "
                     title="${esc(item.tid)}: ${item.duration} ticks">
                    <span>${esc(item.tid)}</span>
                </div>
            `).join("")}
        </div>
        <p class="sl-gantt-caption">
            Recent execution segments ·
            Each block width represents scheduler ticks.
            Hover for duration.
        </p>
    `;
}

function renderThreadInspector() {
    const root = document.getElementById("sl-inspector");
    if (!root) return;

    const thread = getThreadById(lab.selectedTid);

    if (!thread) {
        root.innerHTML = `
            <p class="sl-empty">
                Select a thread in the ready queue
                to inspect its scheduling information.
            </p>
        `;
        return;
    }

    const process = getProcessById(thread.pid);

    root.innerHTML = `
        <div class="sl-inspector-title">
            <h3>${esc(thread.tid)}</h3>
            <span>${esc(thread.state)}</span>
        </div>

        <div class="sl-details">
            <div>
                <small>Process</small>
                <strong>${esc(process?.name || thread.pid)}</strong>
            </div>
            <div>
                <small>PID</small>
                <strong>${esc(thread.pid)}</strong>
            </div>
            <div>
                <small>Priority</small>
                <strong>${esc(thread.priority ?? "—")}</strong>
            </div>
            <div>
                <small>CPU Time</small>
                <strong>${esc(thread.cpuTime ?? 0)} ticks</strong>
            </div>
        </div>
    `;
}

function renderQueueDetails() {
    const root = document.getElementById("sl-queues");
    if (!root) return;

    const scheduler = state.scheduler;

    const queues = [
        ["Ready", scheduler.readyQueue],
        ["Waiting", scheduler.waitingQueue],
        ["Blocked", scheduler.blockedQueue]
    ];

    root.innerHTML = queues.map(([label, queue]) => `
        <div class="sl-queue-summary">
            <span>${label}</span>
            <strong>${queue.length}</strong>
            <small>${esc(queue.join(", ") || "None")}</small>
        </div>
    `).join("");
}

function renderSchedulerExplanation() {
    const root = document.getElementById("sl-explanation");
    if (!root) return;

    const algorithm = String(
        state.scheduler.algorithm || ""
    ).toUpperCase();

    let description;

    if (algorithm.includes("ROUND")) {
        description =
            "Round Robin distributes CPU time in quanta. " +
            "A running thread returns to the ready queue " +
            "after its quantum expires.";
    } else if (algorithm.includes("PRIORITY")) {
        description =
            "Priority Scheduling chooses the ready thread " +
            "with the highest numerical priority. " +
            "A higher-priority ready thread may preempt " +
            "the running thread.";
    } else if (algorithm.includes("FCFS")) {
        description =
            "First-Come, First-Served selects the first " +
            "ready thread and normally lets it run until " +
            "it blocks or finishes.";
    } else {
        description =
            "The selected scheduling algorithm controls " +
            "which ready thread receives CPU time.";
    }

    root.textContent = description;
}

function refreshSchedulerLab() {
    const page = document.getElementById("page-scheduler");

    if (!page || !page.classList.contains("active")) {
        return;
    }

    const history = getSchedulingHistory();

    const signature = JSON.stringify({
        current: state.scheduler.currentThread,
        ready: state.scheduler.readyQueue,
        waiting: state.scheduler.waitingQueue,
        blocked: state.scheduler.blockedQueue,
        algorithm: state.scheduler.algorithm,
        quantum: state.scheduler.timeQuantum,
        switches: state.scheduler.contextSwitches,
        cpu: state.scheduler.cpuUtilization,
        history
    });

    if (signature !== lab.lastSignature) {
        lab.lastSignature = signature;

        renderLabMetrics();
        renderReadyQueue();
        renderQueueDetails();
        renderGantt();
        renderSchedulerExplanation();
    }

    // CPU time may change without a context switch.
    renderThreadInspector();
}

function initializeSchedulerLab() {
    const page = document.getElementById("page-scheduler");
    if (!page || document.getElementById("schedulerLab"))
        return;

    const container = document.createElement("div");
    container.id = "schedulerLab";

    container.innerHTML = `
        <div class="sl-hero">
            <div>
                <span class="sl-eyebrow">
                    TRAFFICOS / CPU MANAGEMENT
                </span>
                <h2>CPU Scheduling Lab</h2>
                <p>
                    Observe real scheduling decisions,
                    CPU allocation and thread queues.
                </p>
            </div>
            <span class="sl-live">● LIVE ENGINE</span>
        </div>

        <div class="sl-metrics">
            <div>
                <span>Running Thread</span>
                <strong id="sl-running">—</strong>
            </div>
            <div>
                <span>Ready Threads</span>
                <strong id="sl-ready">0</strong>
            </div>
            <div>
                <span>CPU Utilization</span>
                <strong id="sl-cpu">0%</strong>
            </div>
            <div>
                <span>Context Switches</span>
                <strong id="sl-switches">0</strong>
            </div>
        </div>

        <div class="sl-info-strip">
            <span>
                Algorithm:
                <strong id="sl-algorithm">—</strong>
            </span>
            <span>
                Time Quantum:
                <strong id="sl-quantum">—</strong>
            </span>
        </div>

        <div class="sl-card">
            <div class="sl-card-heading">
                <h3>CPU Execution Timeline</h3>
                <span>Gantt-style history</span>
            </div>
            <div id="sl-gantt"></div>
        </div>

        <div class="sl-two-columns">
            <div class="sl-card">
                <div class="sl-card-heading">
                    <h3>Ready Queue</h3>
                    <span>Select a thread</span>
                </div>
                <div id="sl-readyQueue"
                     class="sl-ready-items"></div>
            </div>

            <div class="sl-card">
                <div class="sl-card-heading">
                    <h3>Thread Inspector</h3>
                    <span>Scheduling details</span>
                </div>
                <div id="sl-inspector"></div>
            </div>
        </div>

        <div class="sl-two-columns">
            <div class="sl-card">
                <h3>Thread Queues</h3>
                <div id="sl-queues"
                     class="sl-queue-summaries"></div>
            </div>

            <div class="sl-card">
                <h3>How This Algorithm Works</h3>
                <p id="sl-explanation"></p>
                <p class="sl-disclaimer">
                    TrafficOS schedules simulated threads,
                    not your computer's real CPU processes.
                </p>
            </div>
        </div>
    `;

    page.prepend(container);

    container.addEventListener("click", event => {
        const button = event.target.closest("[data-thread]");

        if (!button) return;

        lab.selectedTid = button.dataset.thread;
        renderThreadInspector();
    });

    refreshSchedulerLab();

    // The simulation already runs its own render loop.
    // Refresh this dashboard at a modest UI cadence.
    setInterval(refreshSchedulerLab, 250);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeSchedulerLab,
        { once: true }
    );
} else {
    initializeSchedulerLab();
}

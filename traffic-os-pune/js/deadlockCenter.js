
/* =====================================================
   TrafficOS — Deadlock Control Center
   File: js/deadlockCenter.js
   ===================================================== */

import { state, DEADLOCK_MODES } from "./state.js";

import {
    getDeadlockInfo,
    inspectDeadlockCycle,
    setDeadlockMode,
    requestLock,
    releaseLock,
    releaseAllLocks,
    resolveDeadlock,
    detectDeadlock,
    triggerDeadlockScenario,
    resetDeadlockLab
} from "./deadlock.js";

const $ = id => document.getElementById(id);

const lab = {
    signature: "",
    selected: "P01",
    message: ""
};

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function processName(pid) {
    return state.processes.find(p => p.pid === pid)?.name || pid;
}

function modeOptions() {
    return [
        ["Detection", DEADLOCK_MODES.DETECTION],
        ["Prevention", DEADLOCK_MODES.PREVENTION],
        ["Avoidance", DEADLOCK_MODES.AVOIDANCE]
    ];
}

function notice(message) {
    lab.message = message;
    const target = $("dl-notice");
    if (target) target.textContent = message;
}

function renderStats(info, cycle) {
    $("dl-lock-count").textContent =
        Object.keys(info.locks).length;

    $("dl-wait-count").textContent = info.waitFor.length;

    $("dl-detected-count").textContent = info.detectedCount;
    $("dl-recovered-count").textContent = info.resolvedCount;

    $("dl-mode-label").textContent = info.mode;

    const status = $("dl-status");

    status.textContent = cycle.length
        ? "CIRCULAR WAIT"
        : info.waitFor.length
            ? "RESOURCE CONTENTION"
            : "SYSTEM SAFE";

    status.classList.toggle("danger", cycle.length > 0);

    $("dl-cycle-text").textContent = cycle.length
        ? cycle.join(" → ")
        : "No circular wait currently exists.";

    const recover = $("dl-recover");
    recover.disabled = !info.detected;
}

function renderGraph(info, cycle) {
    const root = $("dl-graph");

    const participants = new Set([
        ...info.resources,
        ...Object.values(info.locks),
        ...info.waitFor.map(w => w.pid)
    ]);

    const nodes = [...participants].filter(Boolean);
    const width = 640;
    const height = 340;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 120;

    const positions = new Map();

    nodes.forEach((pid, index) => {
        const angle =
            (2 * Math.PI * index / Math.max(1, nodes.length))
            - Math.PI / 2;

        positions.set(pid, {
            x: cx + Math.cos(angle) * radius * 1.65,
            y: cy + Math.sin(angle) * radius
        });
    });

    const cycleNodes = new Set(cycle);
    const cyclePairs = new Set();

    for (let i = 0; i < cycle.length - 1; i++) {
        cyclePairs.add(`${cycle[i]}|${cycle[i + 1]}`);
    }

    const edges = info.edges.map(edge => {
        const a = positions.get(edge.from);
        const b = positions.get(edge.to);

        if (!a || !b) return "";

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;

        const startX = a.x + ux * 34;
        const startY = a.y + uy * 25;
        const endX = b.x - ux * 42;
        const endY = b.y - uy * 31;

        const dangerous = cyclePairs.has(
            `${edge.from}|${edge.to}`
        );

        const color = dangerous ? "#fb7185" : "#60a5fa";
        const marker = dangerous ? "dlRedArrow" : "dlBlueArrow";

        return `
            <g>
                <line x1="${startX}" y1="${startY}"
                      x2="${endX}" y2="${endY}"
                      stroke="${color}"
                      stroke-width="${dangerous ? 3 : 2}"
                      marker-end="url(#${marker})"/>
                <text x="${(startX + endX) / 2}"
                      y="${(startY + endY) / 2 - 9}"
                      fill="#b8cce2"
                      font-size="11"
                      text-anchor="middle">
                    ${escapeHTML(edge.resource)}
                </text>
            </g>
        `;
    }).join("");

    const circles = nodes.map(pid => {
        const point = positions.get(pid);
        const dangerous = cycleNodes.has(pid);
        const selected = lab.selected === pid;

        return `
            <g data-node="${escapeHTML(pid)}"
               class="dl-graph-node">
                <rect x="${point.x - 35}"
                      y="${point.y - 25}"
                      width="70" height="50" rx="12"
                      fill="${dangerous ? "#572b3a" : "#183c43"}"
                      stroke="${selected ? "#fff" :
                          dangerous ? "#fb7185" : "#34d399"}"
                      stroke-width="${selected ? 3 : 2}"/>
                <text x="${point.x}" y="${point.y + 5}"
                      fill="#f8fafc" font-size="14"
                      font-weight="700" text-anchor="middle"
                      pointer-events="none">
                    ${escapeHTML(pid)}
                </text>
            </g>
        `;
    }).join("");

    root.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}"
             role="img"
             aria-label="Live process wait-for graph">
            <defs>
                <marker id="dlRedArrow"
                        markerWidth="9" markerHeight="9"
                        refX="8" refY="4"
                        orient="auto">
                    <path d="M0 0 L8 4 L0 8"
                          fill="none" stroke="#fb7185"
                          stroke-width="1.5"/>
                </marker>
                <marker id="dlBlueArrow"
                        markerWidth="9" markerHeight="9"
                        refX="8" refY="4"
                        orient="auto">
                    <path d="M0 0 L8 4 L0 8"
                          fill="none" stroke="#60a5fa"
                          stroke-width="1.5"/>
                </marker>
            </defs>
            ${edges}
            ${circles}
        </svg>
    `;
}

function renderResources(info) {
    const root = $("dl-resources");

    root.innerHTML = info.resources.map(resource => {
        const owner = info.locks[resource];
        const waiting = info.waitFor
            .filter(w => w.waitingFor === resource)
            .map(w => w.pid);

        return `
            <div class="dl-resource">
                <div class="dl-resource-top">
                    <strong>${escapeHTML(resource)}</strong>
                    <span class="${owner ? "held" : "free"}">
                        ${owner ? "LOCKED" : "AVAILABLE"}
                    </span>
                </div>
                <p>
                    Owner:
                    <b>${escapeHTML(owner || "None")}</b>
                </p>
                <small>
                    Waiting: ${escapeHTML(waiting.join(", ") || "None")}
                </small>
                ${owner ? `
                    <button type="button"
                            data-release="${escapeHTML(resource)}"
                            data-owner="${escapeHTML(owner)}">
                        Release Lock
                    </button>
                ` : ""}
            </div>
        `;
    }).join("");
}

function renderWaiting(info) {
    const root = $("dl-waiting");

    root.innerHTML = info.waitFor.length
        ? info.waitFor.map(request => `
            <div class="dl-wait-row">
                <strong>${escapeHTML(request.pid)}</strong>
                <span>waiting for</span>
                <strong>${escapeHTML(request.waitingFor)}</strong>
                <small>
                    Held by
                    ${escapeHTML(
                        info.locks[request.waitingFor] || "Nobody"
                    )}
                </small>
            </div>
        `).join("")
        : `<p class="dl-empty">No pending lock requests.</p>`;
}

function renderInspector(info) {
    const root = $("dl-inspector");
    const pid = lab.selected;

    const held = Object.entries(info.locks)
        .filter(([, owner]) => owner === pid)
        .map(([resource]) => resource);

    const waiting = info.waitFor
        .filter(w => w.pid === pid)
        .map(w => w.waitingFor);

    root.innerHTML = `
        <div class="dl-inspector-title">
            <h3>${escapeHTML(pid)}</h3>
            <span>Process</span>
        </div>

        <p>${escapeHTML(processName(pid))}</p>

        <div class="dl-inspector-metrics">
            <div>
                <small>Locks Held</small>
                <strong>${held.length}</strong>
            </div>
            <div>
                <small>Pending Requests</small>
                <strong>${waiting.length}</strong>
            </div>
        </div>

        <p><b>Owned resources:</b>
            ${escapeHTML(held.join(", ") || "None")}</p>

        <p><b>Waiting for:</b>
            ${escapeHTML(waiting.join(", ") || "None")}</p>

        <button type="button" id="dl-release-all">
            Release All Locks
        </button>
    `;
}

function renderExplanation(info) {
    const root = $("dl-explanation");

    const explanations = new Map([
        [
            DEADLOCK_MODES.DETECTION,
            "Detection allows processes to wait for held resources. " +
            "The wait-for graph is scanned for cycles. " +
            "A detected deadlock can be recovered by releasing " +
            "the locks held by a selected victim process."
        ],
        [
            DEADLOCK_MODES.PREVENTION,
            "Prevention enforces ascending resource ordering. " +
            "A process holding a higher-numbered resource " +
            "cannot request a lower-numbered one. " +
            "This prevents circular wait."
        ],
        [
            DEADLOCK_MODES.AVOIDANCE,
            "Avoidance checks whether adding a wait-for " +
            "dependency would create a cycle and rejects " +
            "the dangerous request. This is a single-instance " +
            "resource cycle check, not full Banker's Algorithm."
        ]
    ]);

    root.textContent =
        explanations.get(info.mode) || "Unknown deadlock mode.";
}

function render() {
    const page = $("page-deadlock");

    if (!page || !page.classList.contains("active")) return;

    const info = getDeadlockInfo();
    const cycle = inspectDeadlockCycle();

    const signature = JSON.stringify({
        info,
        cycle,
        selected: lab.selected
    });

    if (signature === lab.signature) return;
    lab.signature = signature;

    renderStats(info, cycle);
    renderGraph(info, cycle);
    renderResources(info);
    renderWaiting(info);
    renderInspector(info);
    renderExplanation(info);

    $("dl-mode").value = info.mode;
}

function initialize() {
    const page = $("page-deadlock");
    if (!page || $("deadlockCenter")) return;

    // Hide old interface without removing elements that
    // existing app.js handlers may reference.
    [...page.children].forEach(child => {
        child.hidden = true;
    });

    const root = document.createElement("div");
    root.id = "deadlockCenter";

    root.innerHTML = `
        <div class="dl-hero">
            <div>
                <span class="dl-eyebrow">
                    TRAFFICOS / RESOURCE MANAGEMENT
                </span>
                <h2>Deadlock Control Center</h2>
                <p>
                    Explore resource ownership, circular waits,
                    deadlock handling and recovery.
                </p>
            </div>
            <span id="dl-status" class="dl-status">
                SYSTEM SAFE
            </span>
        </div>

        <div class="dl-stats">
            <div>
                <span>Active Locks</span>
                <strong id="dl-lock-count">0</strong>
            </div>
            <div>
                <span>Waiting Requests</span>
                <strong id="dl-wait-count">0</strong>
            </div>
            <div>
                <span>Detected Deadlocks</span>
                <strong id="dl-detected-count">0</strong>
            </div>
            <div>
                <span>Recoveries</span>
                <strong id="dl-recovered-count">0</strong>
            </div>
        </div>

        <div class="dl-panel">
            <div class="dl-heading">
                <h3>Live Wait-for Graph</h3>
                <span id="dl-mode-label">—</span>
            </div>

            <div id="dl-graph" class="dl-graph"></div>

            <div class="dl-graph-legend">
                <span>● Green: process</span>
                <span>→ Blue: waiting dependency</span>
                <span>→ Red: circular wait</span>
            </div>

            <p id="dl-cycle-text" class="dl-cycle-text"></p>
        </div>

        <div class="dl-columns">
            <div class="dl-panel">
                <h3>Deadlock Strategy</h3>

                <label class="dl-field">
                    Handling Mode
                    <select id="dl-mode"></select>
                </label>

                <div class="dl-actions">
                    <button id="dl-scenario" type="button">
                        Generate Deadlock Scenario
                    </button>

                    <button id="dl-detect" type="button">
                        Scan for Deadlock
                    </button>

                    <button id="dl-recover" type="button">
                        Recover Deadlock
                    </button>

                    <button id="dl-reset" type="button">
                        Reset Resource State
                    </button>
                </div>

                <p id="dl-notice" class="dl-notice"
                   role="status" aria-live="polite"></p>
            </div>

            <div class="dl-panel">
                <h3>Manual Resource Request</h3>

                <form id="dl-request-form" class="dl-form">
                    <label class="dl-field">
                        Requesting Process
                        <select id="dl-process"></select>
                    </label>

                    <label class="dl-field">
                        Resource Lock
                        <select id="dl-resource"></select>
                    </label>

                    <button type="submit">
                        Request Lock
                    </button>
                </form>

                <p class="dl-hint">
                    Each resource has one exclusive owner.
                    A process requesting a held resource may
                    be placed in the waiting list.
                </p>
            </div>
        </div>

        <div class="dl-panel">
            <div class="dl-heading">
                <h3>Resource Ownership Board</h3>
                <span>Exclusive locks</span>
            </div>
            <div id="dl-resources" class="dl-resource-grid"></div>
        </div>

        <div class="dl-columns">
            <div class="dl-panel">
                <h3>Waiting Requests</h3>
                <div id="dl-waiting"></div>
            </div>

            <div class="dl-panel">
                <h3>Process Inspector</h3>
                <div id="dl-inspector"></div>
            </div>
        </div>

        <div class="dl-panel dl-concepts">
            <span class="dl-eyebrow">OPERATING SYSTEM CONCEPTS</span>
            <h3>Understanding Deadlock</h3>

            <p id="dl-explanation"></p>

            <div class="dl-concept-grid">
                <article>
                    <h4>Mutual Exclusion</h4>
                    <p>A lock has only one owner at a time.</p>
                </article>

                <article>
                    <h4>Hold and Wait</h4>
                    <p>A process holds one lock while
                       requesting another.</p>
                </article>

                <article>
                    <h4>No Preemption</h4>
                    <p>Resources aren't forcibly taken away
                       during ordinary acquisition.</p>
                </article>

                <article>
                    <h4>Circular Wait</h4>
                    <p>Processes form a cycle of dependencies
                       on one another's locks.</p>
                </article>
            </div>
        </div>
    `;

    page.prepend(root);

    const info = getDeadlockInfo();

    $("dl-mode").innerHTML = modeOptions()
        .map(([label, value]) => `
            <option value="${escapeHTML(value)}">
                ${label}
            </option>
        `).join("");

    const pids = [...new Set([
        ...info.resources,
        ...state.processes.map(p => p.pid)
    ])];

    $("dl-process").innerHTML = pids.map(pid => `
        <option value="${escapeHTML(pid)}">
            ${escapeHTML(pid)} — ${escapeHTML(processName(pid))}
        </option>
    `).join("");

    $("dl-resource").innerHTML =
        info.resources.map(resource => `
            <option value="${escapeHTML(resource)}">
                ${escapeHTML(resource)}
            </option>
        `).join("");

    $("dl-mode").addEventListener("change", event => {
        setDeadlockMode(event.target.value);
        notice(`Strategy changed to ${event.target.value}.`);
        render();
    });

    $("dl-request-form").addEventListener("submit", event => {
        event.preventDefault();

        const pid = $("dl-process").value;
        const resource = $("dl-resource").value;

        const granted = requestLock(pid, resource);

        lab.selected = pid;

        notice(
            granted
                ? `${pid} acquired ${resource}.`
                : `${pid} did not acquire ${resource}. Check waiting requests and mode.`
        );

        detectDeadlock();
        render();
    });

    $("dl-scenario").addEventListener("click", () => {
        triggerDeadlockScenario();
        notice("Two-process scenario executed.");
        render();
    });

    $("dl-detect").addEventListener("click", () => {
        detectDeadlock();
        const cycle = inspectDeadlockCycle();

        notice(
            cycle.length
                ? `Circular wait: ${cycle.join(" → ")}`
                : "No circular wait detected."
        );

        render();
    });

    $("dl-recover").addEventListener("click", () => {
        resolveDeadlock();
        notice("Recovery attempted using victim rollback.");
        render();
    });

    $("dl-reset").addEventListener("click", () => {
        resetDeadlockLab();
        notice("Resource state reset.");
        render();
    });

    root.addEventListener("click", event => {
        const node = event.target.closest("[data-node]");

        if (node) {
            lab.selected = node.dataset.node;
            render();
            return;
        }

        const release = event.target.closest("[data-release]");

        if (release) {
            const pid = release.dataset.owner;
            const resource = release.dataset.release;

            releaseLock(pid, resource);
            notice(`${resource} released by ${pid}.`);
            render();
            return;
        }

        if (event.target.closest("#dl-release-all")) {
            const count = releaseAllLocks(lab.selected);
            notice(`${count} locks released by ${lab.selected}.`);
            render();
        }
    });

    render();

    setInterval(() => {
        if (page.classList.contains("active")) render();
    }, 300);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        { once: true }
    );
} else {
    initialize();
}

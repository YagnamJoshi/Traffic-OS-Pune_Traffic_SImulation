/********************************************************************
 * TrafficOS Pune
 * ui.js
 *
 * UI Rendering Engine
 ********************************************************************/

import { state, generateEvent } from "./state.js";
import { getSchedulerInfo } from "./scheduler.js";
import { getDeadlockInfo } from "./deadlock.js";

const ui = {};

let lastProcessSelectKey = "";

/********************************************************************
 * INIT
 ********************************************************************/

export function initializeUI() {

    ui.canvas = document.getElementById("trafficCanvas");
    ui.ctx = ui.canvas ? ui.canvas.getContext("2d") : null;

    cacheElements();
    resizeCanvas();
    initializeMapInteractions();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("fullscreenchange", () => setTimeout(resizeCanvas, 50));

    if (ui.canvas && "ResizeObserver" in window) {
        new ResizeObserver(resizeCanvas).observe(ui.canvas);
    }
}



function cacheElements() {

    ui.cpu = document.getElementById("cpuValue");
    ui.memory = document.getElementById("memoryValue");
    ui.processes = document.getElementById("processCount");
    ui.threads = document.getElementById("threadCount");
    ui.simTime = document.getElementById("simulationTime");
    ui.simStatus = document.getElementById("simulationStatus");
    ui.activityPanel = document.getElementById("activityPanel");
    ui.processTable = document.getElementById("processTableBody");
    ui.memoryGrid = document.getElementById("memoryGrid");
    ui.eventLog = document.getElementById("eventLogBody");
    ui.ipcQueue = document.getElementById("ipcQueue");
}


function resizeCanvas() {
  const canvas = document.getElementById("trafficCanvas");

  if (!canvas) return;

  const bounds = canvas.getBoundingClientRect();

  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));

  // Avoid resetting the canvas unnecessarily.
  // Changing canvas.width or canvas.height clears its contents.
  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }
}


/********************************************************************
 * MAIN RENDER
 ********************************************************************/

export function renderUI() {

    renderTopbar();
    renderActivityPanel();
    renderProcesses();
    renderMemory();
    renderIPC();
    renderEvents();
    renderTrafficMap();
    renderScheduler();
    renderDeadlock();
    renderProcessSelects();
}

/********************************************************************
 * TOPBAR
 ********************************************************************/

function renderTopbar() {

    if (ui.cpu) {
        ui.cpu.textContent = Math.floor(state.scheduler.cpuUtilization || 0) + "%";
    }

    if (ui.memory) {

        const memUsed = state.memory.usedBlocks || 0;
        const memTotal = state.memory.totalBlocks || 1;
        const percent = Math.floor((memUsed / memTotal) * 100);

        ui.memory.textContent = percent + "%";
    }

    if (ui.processes) ui.processes.textContent = state.processes.length;
    if (ui.threads) ui.threads.textContent = state.threads.length;
    if (ui.simTime) ui.simTime.textContent = state.simulationTime.toFixed(1);

    if (ui.simStatus) {
        ui.simStatus.textContent = state.paused ? "PAUSED" : "RUNNING";
    }
}

/********************************************************************
 * ACTIVITY PANEL
 ********************************************************************/

function renderActivityPanel() {
    if (!ui.activityPanel) return;

    const activity = state.activityPanel;

    const title = activity.title || "SYSTEM STATUS";
    const message = activity.message || "Awaiting activity.";
    const concept = activity.concept || "Operating Systems";

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const isDanger = /DEADLOCK|FAILURE|FAULT/i.test(title);
    const isWarning = /EMERGENCY|CONGESTION/i.test(title);

    const status = isDanger
        ? "critical"
        : isWarning
            ? "warning"
            : "healthy";

    ui.activityPanel.innerHTML = `
        <div class="sim-card-heading">
            <div class="sim-card-icon sim-icon-${status}">
                ${isDanger ? "!" : isWarning ? "⚡" : "✓"}
            </div>
            <div>
                <span class="sim-card-eyebrow">SYSTEM HEALTH</span>
                <h3>${escapeHTML(title)}</h3>
            </div>
            <span class="sim-status-dot ${status}"></span>
        </div>

        <p class="sim-activity-message">
            ${escapeHTML(message)}
        </p>

        <div class="sim-card-footer">
            <span>OS CONCEPT</span>
            <strong>${escapeHTML(concept)}</strong>
        </div>
    `;
}

function renderScheduler() {
    const box = document.getElementById("schedulerInfo");
    if (!box) return;

    const info = getSchedulerInfo();

    const cpu = Math.max(
        0,
        Math.min(100, Number(info.cpu) || 0)
    );

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    box.innerHTML = `
        <div class="sim-scheduler-heading">
            <div>
                <span class="sim-card-eyebrow">CPU MANAGEMENT</span>
                <h3>Scheduler Overview</h3>
            </div>
            <span class="sim-algorithm-badge">
                ${escapeHTML(info.algorithm)}
            </span>
        </div>

        <div class="sim-cpu-header">
            <span>CPU Utilization</span>
            <strong>${cpu.toFixed(0)}%</strong>
        </div>

        <div class="sim-cpu-track">
            <div class="sim-cpu-fill"
                 style="width:${cpu}%"></div>
        </div>

        <div class="sim-running">
            <span class="sim-running-indicator"></span>
            <div>
                <small>CURRENTLY RUNNING</small>
                <strong>${escapeHTML(info.running || "CPU IDLE")}</strong>
            </div>
        </div>

        <div class="sim-scheduler-metrics">
            <div>
                <span>Ready</span>
                <strong>${info.ready.length}</strong>
            </div>
            <div>
                <span>Waiting</span>
                <strong>${info.waiting.length}</strong>
            </div>
            <div>
                <span>Blocked</span>
                <strong>${info.blocked.length}</strong>
            </div>
        </div>

        <div class="sim-card-footer">
            <span>CONTEXT SWITCHES</span>
            <strong>${info.switches}</strong>
        </div>
    `;
}

/********************************************************************
 * PROCESS TABLE
 ********************************************************************/

function renderProcesses() {

    if (!ui.processTable) return;

    ui.processTable.innerHTML = state.processes.map(process => `
        <tr>
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td>${process.state}</td>
            <td>${process.priority}</td>
            <td>${process.threads.length}</td>
            <td>${process.cpuUsage}</td>
            <td>
                <button class="btn-small" data-action="priority-down" data-pid="${process.pid}">-</button>
                <button class="btn-small" data-action="priority-up" data-pid="${process.pid}">+</button>
                <button class="btn-small btn-danger" data-action="kill-process" data-pid="${process.pid}">Kill</button>
            </td>
        </tr>
    `).join("");
}

/********************************************************************
 * PROCESS DROPDOWNS (IPC / memory forms)
 ********************************************************************/

function renderProcessSelects() {

    const key = state.processes.map(p => p.pid).join(",");

    if (key === lastProcessSelectKey) return;

    lastProcessSelectKey = key;

    const selects = [
        document.getElementById("ipcSender"),
        document.getElementById("ipcReceiver"),
        document.getElementById("memoryAllocPid"),
        document.getElementById("memoryFreePid")
    ];

    selects.forEach(select => {

        if (!select) return;

        const current = select.value;

        select.innerHTML = state.processes
            .map(p => `<option value="${p.pid}">${p.pid} — ${p.name}</option>`)
            .join("");

        if (state.processes.some(p => p.pid === current)) {
            select.value = current;
        }
    });
}

/********************************************************************
 * MEMORY VIEW
 ********************************************************************/

function renderMemory() {

    if (!ui.memoryGrid) return;

    ui.memoryGrid.innerHTML = state.memory.blocks.map(block => `
        <div
            class="memory-block"
            data-owner="${block.owner || ""}"
            style="background:${block.color};"
            title="${block.owner ? "Click to free " + block.owner : "Free block"}"
        >
            ${block.owner ? block.owner : "FREE"}
        </div>
    `).join("");
}

/********************************************************************
 * IPC
 ********************************************************************/

function renderIPC() {

    if (!ui.ipcQueue) return;

    ui.ipcQueue.innerHTML = state.ipc.queue
        .slice(-20)
        .reverse()
        .map(msg => `
            <div class="ipc-item">
                <strong>${msg.sender}</strong> → <strong>${msg.receiver}</strong>
                <br>
                ${msg.type}
            </div>
        `)
        .join("");
}

/********************************************************************
 * EVENTS
 ********************************************************************/

function renderEvents() {

    if (!ui.eventLog) return;

    ui.eventLog.innerHTML = state.events
        .slice(-50)
        .reverse()
        .map(event => `
            <tr>
                <td>${event.timestamp}</td>
                <td>${event.type}</td>
                <td>${event.message}</td>
            </tr>
        `)
        .join("");
}




/********************************************************************
 * DEADLOCK
 ********************************************************************/

function renderDeadlock() {

    const box = document.getElementById("deadlockInfo");

    if (!box) return;

    const info = getDeadlockInfo();

    const lockRows = Object.entries(info.locks)
        .map(([resource, owner]) => `<div>${resource} locked by ${owner}</div>`)
        .join("") || "<div>No active locks.</div>";

    const waitRows = info.waitFor
        .map(w => `<div>${w.pid} waiting for ${w.waitingFor}</div>`)
        .join("") || "<div>No processes waiting.</div>";

    box.innerHTML = `
        <div><strong>Mode:</strong> ${info.mode}</div>
        <div><strong>Status:</strong> ${info.detected ? "DEADLOCK DETECTED" : "No deadlock"}</div>
        ${info.detected ? `<div><strong>Cycle:</strong> ${info.cycle.join(" → ")}</div>` : ""}
        <h4 style="margin-top:12px;">Held Locks</h4>
        ${lockRows}
        <h4 style="margin-top:12px;">Waiting</h4>
        ${waitRows}
    `;
}


/********************************************************************
 * TRAFFIC MAP — PHASE 2
 * Scalable top-down 2D city renderer
 ********************************************************************/

const MAP = {
    padding: 85,
    roadWidth: 44,
    junctionRadius: 23,
    zoom: 1
};

function renderTrafficMap() {
    if (!ui.canvas || !ui.ctx) return;

    const ctx = ui.ctx;
    const canvas = ui.canvas;

    const width = canvas.width;
    const height = canvas.height;

    if (width <= 0 || height <= 0) return;

    // Always reset the transform before clearing.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    drawMapBackground(ctx, width, height);

    const junctions = state.traffic.junctions || [];
    if (!junctions.length) return;

    // Calculate map boundaries from actual simulation coordinates.
    const xs = junctions.map(j => j.x);
    const ys = junctions.map(j => j.y);

    const minX = Math.min(...xs) - MAP.padding;
    const maxX = Math.max(...xs) + MAP.padding;
    const minY = Math.min(...ys) - MAP.padding;
    const maxY = Math.max(...ys) + MAP.padding;

    const worldWidth = Math.max(1, maxX - minX);
    const worldHeight = Math.max(1, maxY - minY);

    
    const scale = Math.min(
        width / worldWidth,
        height / worldHeight
    ) * MAP.zoom;

    // Center the map inside the canvas
    const offsetX = (width - worldWidth * scale) / 2;
    const offsetY = (height - worldHeight * scale) / 2;

    // Store the same transform for mouse-click detection
    mapInteraction.transform = {
        scale,
        offsetX,
        offsetY,
        minX,
        minY
    };


    mapInteraction.transform = {
    scale,
    offsetX,
    offsetY,
    minX,
    minY
    };

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.translate(-minX, -minY);

    drawCityBlocks(ctx, minX, minY, maxX, maxY);
    renderRoads(ctx);
    renderJunctions(ctx);
    renderMetro(ctx);
    renderVehicles(ctx);

    ctx.restore();

    drawMapOverlay(ctx, width, height);
}

function drawMapBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(
        0, 0, width, height
    );

    gradient.addColorStop(0, "#152c2b");
    gradient.addColorStop(1, "#102320");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawCityBlocks(ctx, minX, minY, maxX, maxY) {
    const cellSize = 100;

    // Subtle ground grid.
    ctx.strokeStyle = "rgba(186, 230, 207, 0.045)";
    ctx.lineWidth = 1;

    for (let x = Math.floor(minX / cellSize) * cellSize;
         x <= maxX; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
        ctx.stroke();
    }

    for (let y = Math.floor(minY / cellSize) * cellSize;
         y <= maxY; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        ctx.lineTo(maxX, y);
        ctx.stroke();
    }

    // Decorative city blocks, not simulation obstacles.
    const blocks = [
        [310, 240, 120, 110],
        [555, 240, 115, 115],
        [810, 240, 120, 110],
        [310, 560, 120, 100],
        [560, 560, 110, 95],
        [820, 560, 110, 95],
        [80, 270, 85, 120],
        [1070, 270, 70, 120]
    ];

    blocks.forEach(([x, y, w, h], index) => {
        ctx.fillStyle = index % 3 === 0
            ? "#21493b"
            : "#1c3936";

        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = "#33534d";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Small building footprints.
        ctx.fillStyle = "#304d4b";
        ctx.fillRect(x + 12, y + 12, w * 0.35, h * 0.34);
        ctx.fillRect(x + w * 0.55, y + h * 0.5,
                     w * 0.3, h * 0.3);
    });
}

function drawRoadSegment(ctx, from, to) {
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;

    // Road shoulders.
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#65716f";
    ctx.lineWidth = MAP.roadWidth + 10;
    ctx.lineCap = "butt";
    ctx.stroke();

    // Asphalt.
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#303943";
    ctx.lineWidth = MAP.roadWidth;
    ctx.stroke();

    // Dashed center line.
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#e4c96a";
    ctx.lineWidth = 2;
    ctx.setLineDash([13, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function renderRoads(ctx) {
    const junctionMap = new Map(
        (state.traffic.junctions || [])
            .map(j => [j.id, j])
    );

    (state.traffic.roads || []).forEach(road => {
        const from = junctionMap.get(road.from);
        const to = junctionMap.get(road.to);

        if (!from || !to) return;

        drawRoadSegment(ctx, from, to);
    });
}

function drawCrosswalk(ctx, x, y, horizontalRoad) {
    ctx.save();
    ctx.translate(x, y);

    // Stripes are drawn across the road.
    if (!horizontalRoad) {
        ctx.rotate(Math.PI / 2);
    }

    ctx.fillStyle = "rgba(245, 248, 250, 0.82)";

    for (let i = -2; i <= 2; i++) {
        ctx.fillRect(-18 + i * 8, -4, 5, 8);
    }

    ctx.restore();
}

function renderJunctions(ctx) {
    const roads = state.traffic.roads || [];
    const junctions = state.traffic.junctions || [];

    junctions.forEach(junction => {
        const x = junction.x;
        const y = junction.y;

        // Intersection asphalt.
        ctx.fillStyle = "#303943";
        ctx.fillRect(
            x - MAP.junctionRadius,
            y - MAP.junctionRadius,
            MAP.junctionRadius * 2,
            MAP.junctionRadius * 2
        );

        // Determine connected road directions.
        const connected = roads
            .filter(r =>
                r.from === junction.id ||
                r.to === junction.id
            )
            .map(r => {
                const otherId = r.from === junction.id
                    ? r.to
                    : r.from;

                return junctions.find(j => j.id === otherId);
            })
            .filter(Boolean);

        connected.forEach(other => {
            const dx = other.x - x;
            const dy = other.y - y;

            if (Math.abs(dx) > Math.abs(dy)) {
                drawCrosswalk(
                    ctx,
                    x + Math.sign(dx) * 32,
                    y,
                    false
                );
            } else {
                drawCrosswalk(
                    ctx,
                    x,
                    y + Math.sign(dy) * 32,
                    true
                );
            }
        });

        // Signal indicator.
        const signalColor = junction.signal === "GREEN"
            ? "#35e5a0"
            : "#ff596c";

        ctx.beginPath();
        ctx.arc(x + 17, y - 17, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#0c1520";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + 17, y - 17, 5, 0, Math.PI * 2);
        ctx.fillStyle = signalColor;
        ctx.shadowColor = signalColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Location label.
        ctx.font = "bold 13px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const labelWidth = Math.max(
            76,
            ctx.measureText(junction.name).width + 20
        );

        const labelY = y - 55;

        ctx.fillStyle = "rgba(10, 22, 32, 0.94)";
        ctx.beginPath();
        ctx.roundRect(
            x - labelWidth / 2,
            labelY - 12,
            labelWidth,
            24,
            6
        );
        ctx.fill();

        ctx.fillStyle = "#e9f5f4";
        ctx.fillText(junction.name, x, labelY);
    });
}

function getVehicleColor(type) {
    switch (type) {
        case "BUS": return "#f6b94c";
        case "AUTO": return "#4ade80";
        case "AMBULANCE": return "#fb7185";
        case "BIKE": return "#93c5fd";
        case "SCOOTER": return "#c4b5fd";
        default: return "#60a5fa";
    }
}


function renderVehicles(ctx) {
    const junctionMap = new Map(
        (state.traffic.junctions || []).map(j => [j.id, j])
    );

    for (const vehicle of state.traffic.vehicles || []) {
        if (!Number.isFinite(vehicle.x) ||
            !Number.isFinite(vehicle.y)) continue;

        // The route is an array of junction IDs.
        // currentNode is the current route index.
        const nextId = vehicle.route?.[vehicle.currentNode + 1];
        const previousId = vehicle.route?.[vehicle.currentNode];

        const next = junctionMap.get(nextId);
        const previous = junctionMap.get(previousId);

        let angle = 0;

        if (next) {
            angle = Math.atan2(
                next.y - vehicle.y,
                next.x - vehicle.x
            );
        } else if (previous) {
            angle = Math.atan2(
                vehicle.y - previous.y,
                vehicle.x - previous.x
            );
        }

        // Display-only offset to visually separate road directions.
        // Real lane-aware movement will be implemented later.
        const laneOffset = 9;
        const drawX = vehicle.x - Math.sin(angle) * laneOffset;
        const drawY = vehicle.y + Math.cos(angle) * laneOffset;

        const isBus = vehicle.type === "BUS";
        const isBike = vehicle.type === "BIKE" ||
                       vehicle.type === "SCOOTER";
        const isAuto = vehicle.type === "AUTO";
        const isAmbulance = vehicle.type === "AMBULANCE";

        const length = isBus ? 29 : isBike ? 12 : isAuto ? 15 : 19;
        const breadth = isBus ? 12 : isBike ? 6 : 10;

        const selected =
            mapInteraction.selected?.type === "vehicle" &&
            mapInteraction.selected.id === vehicle.id;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(angle);

        // Selection halo.
        if (selected) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.ellipse(0, 0, length / 2 + 7,
                        breadth / 2 + 7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Shadow.
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.roundRect(
            -length / 2 + 2, -breadth / 2 + 3,
            length, breadth, 3
        );
        ctx.fill();

        // Body.
        ctx.fillStyle = getVehicleColor(vehicle.type);
        ctx.beginPath();
        ctx.roundRect(
            -length / 2, -breadth / 2,
            length, breadth, isBike ? 2 : 4
        );
        ctx.fill();

        if (!isBike) {
            // Windshield and rear glass.
            ctx.fillStyle = "#b9e6fa";
            ctx.fillRect(
                length / 2 - 7, -breadth / 2 + 2,
                3, breadth - 4
            );

            if (!isBus) {
                ctx.fillStyle = "#29485c";
                ctx.fillRect(
                    -length / 2 + 3, -breadth / 2 + 2,
                    3, breadth - 4
                );
            }
        } else {
            // Rider / handlebar.
            ctx.fillStyle = "#172536";
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(3, -4, 2, 8);
        }

        if (isBus) {
            // Passenger windows.
            ctx.fillStyle = "#193d50";
            for (let x = -9; x <= 7; x += 6) {
                ctx.fillRect(x, -breadth / 2 + 1, 4, 2);
                ctx.fillRect(x, breadth / 2 - 3, 4, 2);
            }
        }

        if (isAuto) {
            ctx.fillStyle = "#173b25";
            ctx.fillRect(-length / 2 + 2, -3, 5, 6);
        }

        if (isAmbulance) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-4, -1, 8, 2);
            ctx.fillRect(-1, -4, 2, 8);
        }

        // Headlights.
        ctx.fillStyle = "#fff4c2";
        ctx.fillRect(length / 2 - 2, -breadth / 2 + 1, 2, 2);
        ctx.fillRect(length / 2 - 2, breadth / 2 - 3, 2, 2);

        if (vehicle.manualStopped) {
            ctx.fillStyle = "#fb7185";
            ctx.beginPath();
            ctx.arc(0, -breadth / 2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function renderMetro(ctx) {
    (state.traffic.metroStations || []).forEach(station => {
        ctx.save();

        ctx.fillStyle = "#a78bfa";
        ctx.strokeStyle = "#e9d5ff";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(
            station.x - 8,
            station.y - 8,
            16,
            16,
            4
        );
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    });
}

function drawMapOverlay(ctx, width, height) {
    ctx.save();

    ctx.fillStyle = "rgba(8, 19, 28, 0.85)";
    ctx.beginPath();
    ctx.roundRect(12, 12, 196, 34, 8);
    ctx.fill();

    ctx.fillStyle = "#e5f5f1";
    ctx.font = "bold 13px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("PUNE • LIVE TRAFFIC", 24, 29);

    // Legend.
    const legendY = height - 19;

    ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillStyle = "#35e5a0";
    ctx.beginPath();
    ctx.arc(18, legendY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dce9e6";
    ctx.fillText("Green", 28, legendY);

    ctx.fillStyle = "#ff596c";
    ctx.beginPath();
    ctx.arc(94, legendY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dce9e6";
    ctx.fillText("Red", 104, legendY);

    ctx.restore();
}

/***********************************************************
 * PHASE 2 — MAP INTERACTIONS
 ***********************************************************/

const mapInteraction = {
    selected: null,
    transform: null
};

function initializeMapInteractions() {
    if (!ui.canvas) return;

    ui.canvas.style.cursor = "crosshair";

    ui.canvas.addEventListener("click", handleMapClick);

    const panel = document.querySelector(".canvas-panel");
    if (!panel || document.getElementById("mapInspector")) return;

    const inspector = document.createElement("div");
    inspector.id = "mapInspector";
    inspector.className = "map-inspector";
    inspector.hidden = true;

    panel.appendChild(inspector);

    inspector.addEventListener("click", event => {
        const button = event.target.closest("[data-map-action]");
        if (!button) return;

        handleMapAction(button.dataset.mapAction);
    });
}

function handleMapClick(event) {
    const canvas = ui.canvas;
    const transform = mapInteraction.transform;

    if (!canvas || !transform) return;

    const rect = canvas.getBoundingClientRect();

    const screenX =
        (event.clientX - rect.left) * canvas.width / rect.width;

    const screenY =
        (event.clientY - rect.top) * canvas.height / rect.height;

    const worldX =
        (screenX - transform.offsetX) / transform.scale +
        transform.minX;

    const worldY =
        (screenY - transform.offsetY) / transform.scale +
        transform.minY;

    const vehicles = state.traffic.vehicles || [];

    
const junctionMap = new Map(
    (state.traffic.junctions || []).map(j => [j.id, j])
);

const vehicle = [...vehicles].reverse().find(v => {
    const next = junctionMap.get(
        v.route?.[v.currentNode + 1]
    );

    const previous = junctionMap.get(
        v.route?.[v.currentNode]
    );

    let angle = 0;

    if (next) {
        angle = Math.atan2(next.y - v.y, next.x - v.x);
    } else if (previous) {
        angle = Math.atan2(
            v.y - previous.y,
            v.x - previous.x
        );
    }

    const drawX = v.x - Math.sin(angle) * 9;
    const drawY = v.y + Math.cos(angle) * 9;

    // Keep clicking reasonably easy at different map scales.
    const hitRadius = Math.max(14, 10 / transform.scale);

    return Math.hypot(
        drawX - worldX,
        drawY - worldY
    ) < hitRadius;
});


    if (vehicle) {
        mapInteraction.selected = {
            type: "vehicle",
            id: vehicle.id
        };

        updateMapInspector();
        return;
    }

    const junction = (state.traffic.junctions || []).find(j =>
        Math.hypot(j.x - worldX, j.y - worldY) < 30
    );

    if (junction) {
        mapInteraction.selected = {
            type: "junction",
            id: junction.id
        };

        updateMapInspector();
        return;
    }

    mapInteraction.selected = null;
    updateMapInspector();
}

function updateMapInspector() {
    const inspector = document.getElementById("mapInspector");
    if (!inspector) return;

    const selection = mapInteraction.selected;

    if (!selection) {
        inspector.hidden = true;
        return;
    }

    if (selection.type === "junction") {
        const junction = state.traffic.junctions.find(
            j => j.id === selection.id
        );

        if (!junction) {
            inspector.hidden = true;
            return;
        }

        inspector.hidden = false;
        inspector.innerHTML = `
            <h3>${junction.name}</h3>
            <p>Junction ID: ${junction.id}</p>
            <p>Signal: <strong>${junction.signal}</strong></p>
            <p>Load: ${junction.load ?? 0}</p>

            <button data-map-action="toggle-signal">
                Toggle Signal
            </button>

            <button data-map-action="close">
                Close
            </button>
        `;
    }

    
if (selection.type === "vehicle") {
    const vehicle = state.traffic.vehicles.find(
        v => v.id === selection.id
    );

    if (!vehicle) {
        mapInteraction.selected = null;
        inspector.hidden = true;
        return;
    }

    const destination = state.traffic.junctions.find(
        j => j.id === vehicle.destination
    );

    const multiplier =
        vehicle.manualSpeedMultiplier ?? 1;

    inspector.hidden = false;

    inspector.innerHTML = `
        <h3>🚗 ${vehicle.type} — ${vehicle.id}</h3>

        <p><strong>Destination:</strong>
            ${destination?.name ?? vehicle.destination ?? "Unknown"}
        </p>

        <p><strong>Base speed:</strong> ${vehicle.speed}</p>

        <p><strong>Current speed:</strong>
            ${(vehicle.speed * multiplier).toFixed(1)}
        </p>

        <p><strong>Status:</strong>
            ${vehicle.manualStopped ? "Stopped manually" : "Active"}
        </p>

        <p><strong>Waiting time:</strong>
            ${vehicle.waitingTime ?? 0} ticks
        </p>

        <div class="map-inspector-actions">
            <button data-map-action="toggle-vehicle">
                ${vehicle.manualStopped ? "▶ Resume" : "⏸ Stop"}
            </button>

            <button data-map-action="speed-down">
                − Speed
            </button>

            <button data-map-action="speed-up">
                + Speed
            </button>

            <button data-map-action="inspect-event">
                Log Inspection
            </button>

            <button data-map-action="remove-vehicle">
                🗑 Remove
            </button>

            <button data-map-action="close">
                Close
            </button>
        </div>
    `;
}

}

function handleMapAction(action) {
    const selection = mapInteraction.selected;
    if (!selection) return;

    
    // Vehicle controls
    if (selection.type === "vehicle") {
        const vehicle = state.traffic.vehicles.find(
            v => v.id === selection.id
        );

        if (!vehicle) {
            mapInteraction.selected = null;
            updateMapInspector();
            return;
        }

        if (action === "toggle-vehicle") {
            vehicle.manualStopped = !vehicle.manualStopped;

            generateEvent(
                "TRAFFIC",
                vehicle.id,
                `${vehicle.id} ${vehicle.manualStopped
                    ? "stopped manually"
                    : "resumed movement"}`,
                "Operator changed the vehicle's movement state.",
                "Process Control"
            );
        }

        if (action === "speed-up" || action === "speed-down") {
            const oldSpeed =
                vehicle.manualSpeedMultiplier ?? 1;

            const difference =
                action === "speed-up" ? 0.25 : -0.25;

            vehicle.manualSpeedMultiplier = Math.max(
                0.25,
                Math.min(3, oldSpeed + difference)
            );

            generateEvent(
                "TRAFFIC",
                vehicle.id,
                `${vehicle.id} speed multiplier set to ` +
                `${vehicle.manualSpeedMultiplier.toFixed(2)}x`,
                "Operator adjusted the vehicle speed.",
                "Process Control"
            );
        }

        if (action === "remove-vehicle") {
            state.traffic.vehicles =
                state.traffic.vehicles.filter(
                    v => v.id !== vehicle.id
                );

            generateEvent(
                "TRAFFIC",
                vehicle.id,
                `${vehicle.id} removed from traffic`,
                "Operator removed a vehicle from the simulation.",
                "Process Termination"
            );

            mapInteraction.selected = null;
            updateMapInspector();
            return;
        }

        if (
            action === "toggle-vehicle" ||
            action === "speed-up" ||
            action === "speed-down"
        ) {
            updateMapInspector();
            return;
        }
    }


    if (action === "close") {
        mapInteraction.selected = null;
        updateMapInspector();
        return;
    }

    if (selection.type === "junction" &&
        action === "toggle-signal") {

        const junction = state.traffic.junctions.find(
            j => j.id === selection.id
        );

        if (!junction) return;

        const previous = junction.signal;

        junction.signal =
            previous === "GREEN" ? "RED" : "GREEN";

        junction.signalTimer = 0;

        state.statistics.signalChanges =
            (state.statistics.signalChanges || 0) + 1;

        generateEvent(
            "TRAFFIC",
            junction.id,
            `${junction.name}: signal changed from ${previous} to ${junction.signal}`,
            "Manual traffic signal override from the city map.",
            "Process Scheduling / Traffic Control"
        );

        updateMapInspector();
    }

    if (selection.type === "vehicle" &&
        action === "inspect-event") {

        const vehicle = state.traffic.vehicles.find(
            v => v.id === selection.id
        );

        if (!vehicle) return;

        generateEvent(
            "TRAFFIC",
            vehicle.id,
            `Vehicle ${vehicle.id} inspected`,
            `Vehicle type: ${vehicle.type}`,
            "Traffic Monitoring"
        );

        updateMapInspector();
    }
}

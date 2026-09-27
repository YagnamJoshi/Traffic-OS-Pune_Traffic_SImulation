/********************************************************************
 * TrafficOS Pune
 * ui.js
 *
 * UI Rendering Engine
 *
 * Reads state only.
 * Does NOT modify simulation logic.
 ********************************************************************/

import { state } from "./state.js";

import {
    getSchedulerInfo
} from "./scheduler.js";

/********************************************************************
 * DOM CACHE
 ********************************************************************/

const ui = {};

/********************************************************************
 * INIT
 ********************************************************************/

export function initializeUI() {

    ui.canvas =
        document.getElementById(
            "trafficCanvas"
        );

    ui.ctx =
        ui.canvas
            ? ui.canvas.getContext("2d")
            : null;

    cacheElements();

    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );
}

/********************************************************************
 * CACHE DOM
 ********************************************************************/

function cacheElements() {

    ui.cpu =
        document.getElementById(
            "cpuValue"
        );

    ui.memory =
        document.getElementById(
            "memoryValue"
        );

    ui.processes =
        document.getElementById(
            "processCount"
        );

    ui.threads =
        document.getElementById(
            "threadCount"
        );

    ui.simTime =
        document.getElementById(
            "simulationTime"
        );

    ui.simStatus =
        document.getElementById(
            "simulationStatus"
        );

    ui.activityPanel =
        document.getElementById(
            "activityPanel"
        );

    ui.processTable =
        document.getElementById(
            "processTableBody"
        );

    ui.memoryGrid =
        document.getElementById(
            "memoryGrid"
        );

    ui.eventLog =
        document.getElementById(
            "eventLogBody"
        );

    ui.ipcQueue =
        document.getElementById(
            "ipcQueue"
        );
}

/********************************************************************
 * CANVAS
 ********************************************************************/

function resizeCanvas() {

    if (!ui.canvas)
        return;

    ui.canvas.width =
        ui.canvas.clientWidth;

    ui.canvas.height =
        ui.canvas.clientHeight;
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
}

/********************************************************************
 * TOPBAR
 ********************************************************************/

function renderTopbar() {

    if (ui.cpu) {

        ui.cpu.textContent =
            Math.floor(
                state.scheduler
                    .cpuUtilization || 0
            ) + "%";
    }

    if (ui.memory) {

        const memUsed =
            state.memory.usedBlocks || 0;

        const memTotal =
            state.memory.totalBlocks || 1;

        const percent =
            Math.floor(
                (memUsed /
                 memTotal) * 100
            );

        ui.memory.textContent =
            percent + "%";
    }

    if (ui.processes) {

        ui.processes.textContent =
            state.processes.length;
    }

    if (ui.threads) {

        ui.threads.textContent =
            state.threads.length;
    }

    if (ui.simTime) {

        ui.simTime.textContent =
            state.simulationTime.toFixed(1);
    }

    if (ui.simStatus) {

        ui.simStatus.textContent =
            state.paused
            ? "PAUSED"
            : "RUNNING";
    }
}

/********************************************************************
 * ACTIVITY PANEL
 ********************************************************************/

function renderActivityPanel() {

    if (!ui.activityPanel)
        return;

    ui.activityPanel.innerHTML = `

        <h3>
            ${state.activityPanel.title}
        </h3>

        <p>
            ${state.activityPanel.message}
        </p>

        <small>
            ${state.activityPanel.concept}
        </small>

    `;
}

/********************************************************************
 * PROCESS TABLE
 ********************************************************************/

function renderProcesses() {

    if (!ui.processTable)
        return;

    ui.processTable.innerHTML =
        state.processes
            .map(process => `
    

<tr>

<td>${process.pid}</td>

<td>${process.name}</td>

<td>${process.state}</td>

<td>${process.priority}</td>

<td>${process.threads.length}</td>

<td>${process.cpuUsage}</td>
<td>${process.threads?.length || 0}</td>
</tr>

`)
            .join("");
}

/********************************************************************
 * MEMORY VIEW
 ********************************************************************/

function renderMemory() {

    if (!ui.memoryGrid)
        return;

    ui.memoryGrid.innerHTML =
        state.memory.blocks
            .map(block => {

                return `

<div
class="memory-block"
style="
background:${block.color};
">

${block.owner
 ? block.owner
 : "FREE"}

</div>

`;

            })
            .join("");
}

/********************************************************************
 * IPC
 ********************************************************************/

function renderIPC() {

    if (!ui.ipcQueue)
        return;

    ui.ipcQueue.innerHTML =

        state.ipc.queue
            .slice(-20)
            .reverse()
            .map(msg => `

<div class="ipc-item">

<strong>
${msg.sender}
</strong>

→

<strong>
${msg.receiver}
</strong>

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

    if (!ui.eventLog)
        return;

    ui.eventLog.innerHTML =

        state.events
            .slice(-50)
            .reverse()
            .map(event => `

<tr>

<td>
${event.timestamp}
</td>

<td>
${event.type}
</td>

<td>
${event.message}
</td>

</tr>

`)
            .join("");
}

/********************************************************************
 * SCHEDULER
 ********************************************************************/

function renderScheduler() {

    const schedulerBox =
        document.getElementById(
            "schedulerInfo"
        );

    if (!schedulerBox)
        return;

    const info =
        getSchedulerInfo();

    schedulerBox.innerHTML = `

<div>

Algorithm:
${info.algorithm}

</div>

<div>

CPU:
${info.cpu}%

</div>

<div>

Running:
${info.running || "IDLE"}

</div>

<div>

Ready:
${info.ready.length}

</div>

<div>

Waiting:
${info.waiting.length}

</div>

<div>

Blocked:
${info.blocked.length}

</div>

<div>

Context Switches:
${info.switches}

</div>

`;
}

/********************************************************************
 * TRAFFIC MAP
 ********************************************************************/

function renderTrafficMap() {

    if (
        !ui.canvas ||
        !ui.ctx
    ) {
        return;
    }

    const ctx =
        ui.ctx;

    ctx.clearRect(
        0,
        0,
        ui.canvas.width,
        ui.canvas.height
    );

    renderRoads(ctx);

    renderJunctions(ctx);

    renderVehicles(ctx);

    renderMetro(ctx);
}

/********************************************************************
 * ROADS
 ********************************************************************/

function renderRoads(ctx) {

    ctx.strokeStyle =
        "#444";

    ctx.lineWidth = 4;

    state.traffic.roads.forEach(
        road => {

            const from =
                state.traffic.junctions
                    .find(
                        j =>
                        j.id === road.from
                    );

            const to =
                state.traffic.junctions
                    .find(
                        j =>
                        j.id === road.to
                    );

            if (!from || !to)
                return;

            ctx.beginPath();

            ctx.moveTo(
                from.x,
                from.y
            );

            ctx.lineTo(
                to.x,
                to.y
            );

            ctx.stroke();
        }
    );
}

/********************************************************************
 * JUNCTIONS
 ********************************************************************/

function renderJunctions(ctx) {

    state.traffic.junctions.forEach(
        junction => {

            ctx.beginPath();

            ctx.fillStyle =
                junction.signal === "GREEN"
                ? "#00ff88"
                : "#ff4444";

            ctx.arc(
                junction.x,
                junction.y,
                16,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
                "#ffffff";

            ctx.font =
                "12px monospace";

            ctx.fillText(
                junction.name,
                junction.x - 20,
                junction.y - 25
            );
        }
    );
}

/********************************************************************
 * VEHICLES
 ********************************************************************/

function renderVehicles(ctx) {

    state.traffic.vehicles.forEach(
        vehicle => {

            let color =
                "#3b82f6";

            if (
                vehicle.type === "BUS"
            ) {
                color = "#f59e0b";
            }

            if (
                vehicle.type === "AUTO"
            ) {
                color = "#22c55e";
            }

            if (
                vehicle.type ===
                "AMBULANCE"
            ) {
                color = "#ef4444";
            }

            ctx.fillStyle =
                color;

            ctx.fillRect(
                vehicle.x - 4,
                vehicle.y - 4,
                8,
                8
            );

        }
    );
}

/********************************************************************
 * METRO
 ********************************************************************/

function renderMetro(ctx) {

    state.traffic.metroStations
        ?.forEach(station => {

            ctx.fillStyle =
                "#a855f7";

            ctx.fillRect(
                station.x,
                station.y,
                12,
                12
            );
        });
}
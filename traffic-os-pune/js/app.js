/********************************************************************
 * TrafficOS Pune
 * app.js
 *
 * Main Application Bootstrap
 ********************************************************************/

import { state, DEADLOCK_MODES } from "./state.js";

import {
    initializeSimulation,
    simulationLoop,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    triggerEmergencyScenario,
    triggerDeadlockScenario,
    triggerFailureScenario,
    triggerRushHour,
    killProcess,
    changeProcessPriority,
    changeDeadlockMode
} from "./simulation.js";

import {
    initializeUI,
    renderUI
} from "./ui.js";

import { setSchedulerAlgorithm } from "./scheduler.js";

import {
    allocateMemory,
    releaseMemory,
    compactMemory,
    setAllocationAlgorithm
} from "./memoryManager.js";

import {
    sendMessage,
    pauseQueue,
    resumeQueue,
    clearQueue,
    IPC_TYPES
} from "./ipcManager.js";

import { createProcess } from "./processManager.js";

/********************************************************************
 * PAGE NAVIGATION
 ********************************************************************/

function initializeNavigation() {

    const navItems = document.querySelectorAll("[data-page]");

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const page = item.dataset.page;

            switchPage(page);
        });
    });
}

function switchPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".sidebar [data-page]").forEach(b => {
        b.classList.toggle("active", b.dataset.page === pageName);
    });

    const page = document.getElementById(`page-${pageName}`);

    if (page) page.classList.add("active");

    state.currentPage = pageName;
}

/********************************************************************
 * CONTROLS
 ********************************************************************/

function initializeControls() {

    const btnStart = document.getElementById("btnStart");
    const btnPause = document.getElementById("btnPause");
    const btnReset = document.getElementById("btnReset");
    const btnEmergency = document.getElementById("btnEmergency");
    const btnDeadlock = document.getElementById("btnDeadlock");
    const btnFailure = document.getElementById("btnFailure");
    const btnRushHour = document.getElementById("btnRushHour");

    if (btnStart) btnStart.addEventListener("click", startSimulation);
    if (btnPause) btnPause.addEventListener("click", pauseSimulation);
    if (btnReset) btnReset.addEventListener("click", resetSimulation);
    if (btnEmergency) btnEmergency.addEventListener("click", triggerEmergencyScenario);
    if (btnDeadlock) btnDeadlock.addEventListener("click", triggerDeadlockScenario);
    if (btnFailure) btnFailure.addEventListener("click", triggerFailureScenario);
    if (btnRushHour) btnRushHour.addEventListener("click", triggerRushHour);
        const btnFullscreen = document.getElementById("btnFullscreen");

    if (btnFullscreen) {
        btnFullscreen.addEventListener("click", () => {
            const panel = document.querySelector(".canvas-panel");
            if (!panel) return;
            if (document.fullscreenElement) document.exitFullscreen();
            else panel.requestFullscreen?.();
        });
    }

    // highlight the default page in the sidebar
    document.querySelector('.sidebar [data-page="simulation"]')?.classList.add("active");
}

/********************************************************************
 * SPEED CONTROLS
 ********************************************************************/

function initializeSpeedControls() {

    document.querySelectorAll("[data-speed]").forEach(button => {

        button.addEventListener("click", () => {

            const speed = Number(button.dataset.speed);

            state.speed = speed;

            document.querySelectorAll("[data-speed]").forEach(b => {
                b.classList.remove("active");
            });

            button.classList.add("active");
        });
    });
}

/********************************************************************
 * ADVANCED / INTERACTIVE CONTROLS
 ********************************************************************/

function initializeAdvancedControls() {

    // ---- Process actions (kill / priority) ----
    const processTableBody = document.getElementById("processTableBody");

    if (processTableBody) {

        processTableBody.addEventListener("click", (e) => {

            const btn = e.target.closest("[data-action]");

            if (!btn) return;

            const pid = btn.dataset.pid;
            const action = btn.dataset.action;
            const process = state.processes.find(p => p.pid === pid);

            if (!process) return;

            if (action === "kill-process") {

                if (confirm(`Kill process ${pid} (${process.name})? This frees its memory and locks.`)) {
                    killProcess(pid);
                }
            }

            if (action === "priority-up") {
                changeProcessPriority(pid, process.priority + 1);
            }

            if (action === "priority-down") {
                changeProcessPriority(pid, process.priority - 1);
            }
        });
    }

    // ---- New process form ----
    const btnCreateProcess = document.getElementById("btnCreateProcess");

    if (btnCreateProcess) {

        btnCreateProcess.addEventListener("click", () => {

            const nameInput = document.getElementById("newProcessName");
            const priorityInput = document.getElementById("newProcessPriority");
            const memoryInput = document.getElementById("newProcessMemory");

            const name = (nameInput?.value || "").trim() || "Custom Process";
            const priority = Number(priorityInput?.value) || 5;
            const memoryRequired = Number(memoryInput?.value) || 2;

            createProcess({ name, type: "CUSTOM", priority, memoryRequired });

            if (nameInput) nameInput.value = "";
        });
    }

    // ---- Memory controls ----
    const memoryAlgorithmSelect = document.getElementById("memoryAlgorithmSelect");

    if (memoryAlgorithmSelect) {

        memoryAlgorithmSelect.value = state.memory.algorithm;

        memoryAlgorithmSelect.addEventListener("change", () => {
            setAllocationAlgorithm(memoryAlgorithmSelect.value);
        });
    }

    const btnMemoryAlloc = document.getElementById("btnMemoryAlloc");

    if (btnMemoryAlloc) {

        btnMemoryAlloc.addEventListener("click", () => {

            const pid = document.getElementById("memoryAllocPid")?.value;
            const size = Number(document.getElementById("memoryAllocSize")?.value) || 1;

            if (pid) allocateMemory(pid, size);
        });
    }

    const btnMemoryFree = document.getElementById("btnMemoryFree");

    if (btnMemoryFree) {

        btnMemoryFree.addEventListener("click", () => {

            const pid = document.getElementById("memoryFreePid")?.value;

            if (pid) releaseMemory(pid);
        });
    }

    const btnCompactMemory = document.getElementById("btnCompactMemory");

    if (btnCompactMemory) {
        btnCompactMemory.addEventListener("click", compactMemory);
    }

    const memoryGrid = document.getElementById("memoryGrid");

    if (memoryGrid) {

        memoryGrid.addEventListener("click", (e) => {

            const block = e.target.closest("[data-owner]");

            if (!block) return;

            const owner = block.dataset.owner;

            if (owner) releaseMemory(owner);
        });
    }

    // ---- IPC controls ----
    const ipcTypeSelect = document.getElementById("ipcType");

    if (ipcTypeSelect) {

        Object.values(IPC_TYPES).forEach(type => {

            const opt = document.createElement("option");
            opt.value = type;
            opt.textContent = type;
            ipcTypeSelect.appendChild(opt);
        });
    }

    const btnIpcSend = document.getElementById("btnIpcSend");

    if (btnIpcSend) {

        btnIpcSend.addEventListener("click", () => {

            const sender = document.getElementById("ipcSender")?.value;
            const receiver = document.getElementById("ipcReceiver")?.value;
            const type = document.getElementById("ipcType")?.value;

            if (sender && receiver && type) {
                sendMessage({ sender, receiver, type });
            }
        });
    }

    const btnIpcPause = document.getElementById("btnIpcPause");
    const btnIpcResume = document.getElementById("btnIpcResume");
    const btnIpcClear = document.getElementById("btnIpcClear");

    if (btnIpcPause) btnIpcPause.addEventListener("click", pauseQueue);
    if (btnIpcResume) btnIpcResume.addEventListener("click", resumeQueue);
    if (btnIpcClear) btnIpcClear.addEventListener("click", clearQueue);

    // ---- Scheduler algorithm ----
    const schedulerAlgorithmSelect = document.getElementById("schedulerAlgorithmSelect");

    if (schedulerAlgorithmSelect) {

        schedulerAlgorithmSelect.value = state.scheduler.algorithm;

        schedulerAlgorithmSelect.addEventListener("change", () => {
            setSchedulerAlgorithm(schedulerAlgorithmSelect.value);
        });
    }

    // ---- Deadlock mode ----
    const deadlockModeSelect = document.getElementById("deadlockModeSelect");

    if (deadlockModeSelect) {

        Object.values(DEADLOCK_MODES).forEach(mode => {

            const opt = document.createElement("option");
            opt.value = mode;
            opt.textContent = mode;
            deadlockModeSelect.appendChild(opt);
        });

        deadlockModeSelect.value = state.deadlock.mode;

        deadlockModeSelect.addEventListener("change", () => {
            changeDeadlockMode(deadlockModeSelect.value);
        });
    }
}

/********************************************************************
 * REALTIME UI LOOP
 ********************************************************************/

function startRenderLoop() {

    function renderFrame() {

        renderUI();

        requestAnimationFrame(renderFrame);
    }

    renderFrame();
}

/********************************************************************
 * BOOT SEQUENCE
 ********************************************************************/

function runBootSequence() {

    const boot = document.getElementById("bootScreen");
    const app = document.getElementById("application");
    const bootText = document.getElementById("bootText");

    const lines = [
        "Initializing Process Manager...OK",
        "Initializing Scheduler...OK",
        "Initializing Memory Manager...OK",
        "Initializing IPC Manager...OK",
        "Initializing Traffic Engine...OK",
        "Initializing Emergency Services...OK",
        "Loading Pune Network...OK",
        "System Ready"
    ];

    let index = 0;

    const interval = setInterval(() => {

        if (bootText) bootText.innerHTML += lines[index] + "<br>";

        index++;

        if (index >= lines.length) {

            clearInterval(interval);

            setTimeout(() => {

                if (boot) boot.style.display = "none";
                if (app) app.style.display = "flex";

                initializeApplication();

            }, 1000);
        }

    }, 350);
}

/********************************************************************
 * MAIN INIT
 ********************************************************************/

function initializeApplication() {

    initializeSimulation();
    initializeUI();
    initializeNavigation();
    initializeControls();
    initializeSpeedControls();
    initializeAdvancedControls();

    startSimulation();
    startRenderLoop();

    requestAnimationFrame(simulationLoop);

    console.log("TrafficOS Pune started.");
}

/********************************************************************
 * DOM READY
 ********************************************************************/

document.addEventListener("DOMContentLoaded", () => {

    runBootSequence();
});
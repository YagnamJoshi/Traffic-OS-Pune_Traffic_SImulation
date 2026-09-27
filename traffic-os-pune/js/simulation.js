/********************************************************************
 * TrafficOS Pune
 * simulation.js
 *
 * MASTER SIMULATION ENGINE
 ********************************************************************/

import {
    state,
    generateEvent,
    startAutoSave
} from "./state.js";

import {
    initializeDefaultProcesses,
    updateProcesses,
    failProcess,
    createEmergencyProcess,
    setPriority,
    removeProcessCompletely
} from "./processManager.js";

import {
    initializeMemory,
    memoryTick,
    allocateEmergencyMemory,
    releaseMemory
} from "./memoryManager.js";

import {
    schedulerTick
} from "./scheduler.js";

import {
    ipcTick,
    startEmergencyIPC
} from "./ipcManager.js";

import {
    initializeTrafficSystem,
    trafficTick,
    spawnAmbulance,
    spawnVehicle,
    spawnBus,
    spawnAuto
} from "./traffic.js";

import {
    deadlockTick,
    setDeadlockMode,
    releaseAllLocks,
    triggerDeadlockScenario as forceDeadlockScenario
} from "./deadlock.js";

/********************************************************************
 * INTERNAL ENGINE STATE
 ********************************************************************/

let lastFrameTime = 0;

let emergencyRunning = false;
let emergencyPhase = 0;
let emergencyTimer = 0;

let replayRecording = true;

/********************************************************************
 * ENGINE INITIALIZATION
 ********************************************************************/

export function initializeSimulation() {

    initializeTrafficSystem();
    initializeMemory();
    initializeDefaultProcesses();
    startAutoSave();
    createInitialTraffic();

    generateEvent(
        "SYSTEM",
        "Kernel",
        "TrafficOS Pune initialized.",
        "Core subsystems online.",
        "Operating Systems"
    );

    updateActivityPanel();
}

function createInitialTraffic() {

    for (let i = 0; i < 25; i++) spawnVehicle();
    for (let i = 0; i < 6; i++) spawnBus();
    for (let i = 0; i < 10; i++) spawnAuto();

    generateEvent(
        "TRAFFIC",
        "Traffic Engine",
        "Morning traffic loaded.",
        "Vehicles already active when simulation starts.",
        "Live Simulation"
    );
}

/********************************************************************
 * MAIN UPDATE LOOP
 ********************************************************************/

export function updateSimulation(deltaTime) {

    if (!state.running) return;
    if (state.paused) return;

    state.simulationTime += deltaTime;

    trafficTick();
    updateProcesses();
    schedulerTick();
    memoryTick();
    ipcTick();
    deadlockTick();

    updateStatistics();
    updateObjectives();
    updateActivityPanel();
    updateEmergencyScenario();
    updateReplay();
}

/********************************************************************
 * RAF LOOP
 ********************************************************************/

export function simulationLoop(timestamp) {

    if (!lastFrameTime) lastFrameTime = timestamp;

    const deltaTime = (timestamp - lastFrameTime) / 1000;

    lastFrameTime = timestamp;

    updateSimulation(deltaTime * state.speed);

    requestAnimationFrame(simulationLoop);
}

/********************************************************************
 * START / PAUSE / RESET
 ********************************************************************/

export function startSimulation() {

    state.running = true;
    state.paused = false;

    generateEvent(
        "SYSTEM",
        "Kernel",
        "Simulation started.",
        "TrafficOS is now active.",
        "System Startup"
    );
}

export function pauseSimulation() {

    state.paused = !state.paused;

    generateEvent(
        "SYSTEM",
        "Kernel",
        state.paused ? "Simulation paused." : "Simulation resumed.",
        "System execution changed.",
        "System Control"
    );
}

export function resetSimulation() {

    location.reload();
}

/********************************************************************
 * USER-DRIVEN PROCESS CONTROLS
 ********************************************************************/

export function killProcess(pid) {

    releaseMemory(pid);
    releaseAllLocks(pid);
    removeProcessCompletely(pid);
}

export function changeProcessPriority(pid, priority) {

    setPriority(pid, priority);
}

/********************************************************************
 * DEADLOCK CONTROLS
 ********************************************************************/

export function changeDeadlockMode(mode) {

    setDeadlockMode(mode);
}

export function triggerDeadlockScenario() {

    forceDeadlockScenario();
}

/********************************************************************
 * EMERGENCY SCENARIO
 ********************************************************************/

export function triggerEmergencyScenario() {

    if (emergencyRunning) return;

    emergencyRunning = true;
    emergencyPhase = 0;
    emergencyTimer = 0;

    generateEvent(
        "EMERGENCY",
        "Dispatcher",
        "Emergency scenario started.",
        "Ambulance request received.",
        "Emergency Handling"
    );
}

function updateEmergencyScenario() {

    if (!emergencyRunning) return;

    emergencyTimer++;

    switch (emergencyPhase) {

        case 0:
            spawnAmbulance();
            emergencyPhase++;
            break;

        case 1:
            if (emergencyTimer > 60) {
                createEmergencyProcess();
                emergencyPhase++;
            }
            break;

        case 2:
            if (emergencyTimer > 120) {
                allocateEmergencyMemory();
                emergencyPhase++;
            }
            break;

        case 3:
            if (emergencyTimer > 180) {
                startEmergencyIPC();
                emergencyPhase++;
                state.achievements.firstEmergency = true;
            }
            break;

        case 4:
            if (emergencyTimer > 500) {

                generateEvent(
                    "EMERGENCY",
                    "P07",
                    "Ambulance reached destination.",
                    "Emergency completed successfully.",
                    "Priority Scheduling"
                );

                state.emergency.active = false;
                emergencyRunning = false;
            }
            break;
    }
}

/********************************************************************
 * FAULT SCENARIO
 ********************************************************************/

export function triggerFailureScenario() {

    failProcess("P02");

    generateEvent(
        "FAULT",
        "Fault Manager",
        "FC Road Junction failed.",
        "Recovery sequence started.",
        "Fault Handling"
    );
}

/********************************************************************
 * RUSH HOUR
 ********************************************************************/

export function triggerRushHour() {

    for (let i = 0; i < 60; i++) spawnVehicle();

    generateEvent(
        "SCENARIO",
        "Traffic",
        "Rush Hour started.",
        "Traffic volume increased dramatically.",
        "Traffic Congestion"
    );
}

/********************************************************************
 * OBJECTIVES
 ********************************************************************/

function updateObjectives() {

    if (state.processes.length > 0) completeObjective("obj1");
    if (state.achievements.firstEmergency) completeObjective("obj2");
    if (state.statistics.ipcMessages > 0) completeObjective("obj3");
    if (state.statistics.memoryAllocations > 0) completeObjective("obj4");
    if (state.statistics.deadlocksDetected > 0) completeObjective("obj5");
    if (state.statistics.deadlocksResolved > 0) completeObjective("obj6");
}

function completeObjective(id) {

    const obj = state.objectives.find(o => o.id === id);

    if (!obj) return;

    obj.completed = true;
}

/********************************************************************
 * ACTIVITY PANEL
 ********************************************************************/

function updateActivityPanel() {

    if (state.deadlock.detected) {

        state.activityPanel = {
            title: "DEADLOCK DETECTED",
            message: "Processes are waiting for each other.",
            concept: "Deadlock Detection"
        };

        return;
    }

    if (state.emergency.active) {

        state.activityPanel = {
            title: "EMERGENCY ACTIVE",
            message: "Green corridor is active.",
            concept: "Priority Scheduling"
        };

        return;
    }

    if (state.traffic.congestionPercent > 70) {

        state.activityPanel = {
            title: "HIGH CONGESTION",
            message: "Traffic queues are growing.",
            concept: "Resource Contention"
        };

        return;
    }

    state.activityPanel = {
        title: "NORMAL OPERATION",
        message: "Traffic operating normally.",
        concept: "Process Scheduling"
    };
}

/********************************************************************
 * STATISTICS
 ********************************************************************/

function updateStatistics() {

    state.statistics.peakCongestion = Math.max(
        state.statistics.peakCongestion,
        state.traffic.congestionPercent
    );
}

/********************************************************************
 * REPLAY
 ********************************************************************/

function updateReplay() {

    if (!replayRecording) return;

    if (state.replay.events.length > 1000) {

        state.replay.events.shift();
    }
}

/********************************************************************
 * SCENARIO REPORT
 ********************************************************************/

export function buildScenarioReport() {

    return {
        responseTime: state.statistics.emergencyResponseTime,
        vehiclesSpawned: state.statistics.vehiclesSpawned,
        ipcMessages: state.statistics.ipcMessages,
        memoryAllocations: state.statistics.memoryAllocations,
        contextSwitches: state.statistics.contextSwitches,
        congestion: state.statistics.peakCongestion
    };
}
/***********************************************************
 * TrafficOS Pune
 * state.js
 *
 * Central State Store
 * Single Source Of Truth
 *
 * Everything reads from this state.
 * Nothing should store duplicate data.
 ***********************************************************/

export const PROCESS_STATES = {
    NEW: "NEW",
    READY: "READY",
    RUNNING: "RUNNING",
    WAITING: "WAITING",
    BLOCKED: "BLOCKED",
    TERMINATED: "TERMINATED",
    FAILED: "FAILED"
};

export const THREAD_STATES = {
    NEW: "NEW",
    READY: "READY",
    RUNNING: "RUNNING",
    WAITING: "WAITING",
    BLOCKED: "BLOCKED",
    TERMINATED: "TERMINATED"
};

export const SCHEDULER_TYPES = {
    ROUND_ROBIN: "ROUND_ROBIN",
    PRIORITY: "PRIORITY",
    FCFS: "FCFS"
};

export const MEMORY_ALGORITHMS = {
    FIRST_FIT: "FIRST_FIT",
    BEST_FIT: "BEST_FIT",
    WORST_FIT: "WORST_FIT"
};

export const SAVE_KEY = "trafficos_pune_save";

/***********************************************************
 * Main State Object
 ***********************************************************/
export const state = {

    version: "1.0",

    running: true,
    paused: false,

    currentPage: "simulation",

    simulationTime: 0,

    speed: 1,

    bootCompleted: false,

    tutorialCompleted: false,

    educationalNotifications: true,

    darkMode: true,

    retroMode: true,

    asciiMode: false,

    ///////////////////////////////////////////////////////
    // PROCESS MANAGEMENT
    ///////////////////////////////////////////////////////

    processes: [],

    nextProcessId: 9,

    processDefinitions: {

        P01: "Deccan Junction",
        P02: "FC Road Junction",
        P03: "JM Road Junction",
        P04: "Shivajinagar Junction",

        P05: "Metro Coordination Service",
        P06: "Bus Coordination Service",

        P07: "Emergency Service",

        P08: "Traffic Monitoring Service"
    },

    ///////////////////////////////////////////////////////
    // THREAD MANAGEMENT
    ///////////////////////////////////////////////////////

    threads: [],

    nextThreadId: 1,

    ///////////////////////////////////////////////////////
    // SCHEDULER
    ///////////////////////////////////////////////////////

    scheduler: {

        algorithm: SCHEDULER_TYPES.ROUND_ROBIN,

        timeQuantum: 100,

        longTermSchedulerEnabled: true,

        mediumTermSchedulerEnabled: true,

        shortTermSchedulerEnabled: true,

        currentThread: null,

        readyQueue: [],

        waitingQueue: [],

        blockedQueue: [],

        terminatedQueue: [],

        contextSwitches: 0,

        averageWaitTime: 0,

        averageResponseTime: 0,

        cpuUtilization: 0,

        lastScheduleMessage:
            "Scheduler initialized."
    },

    ///////////////////////////////////////////////////////
    // MEMORY MANAGER
    ///////////////////////////////////////////////////////

    memory: {

        totalBlocks: 32,

        algorithm: MEMORY_ALGORITHMS.FIRST_FIT,

        blocks: [],

        allocations: [],

        releases: 0,

        fragmentation: 0,

        usedBlocks: 0,

        freeBlocks: 32
    },

    ///////////////////////////////////////////////////////
    // IPC
    ///////////////////////////////////////////////////////

    ipc: {

        queue: [],

        delivered: [],

        messagesPerSecond: 0,

        queuePaused: false
    },

    ///////////////////////////////////////////////////////
    // TRAFFIC
    ///////////////////////////////////////////////////////

    traffic: {
        vehicles: [],
        pedestrians: [],
        signals: [],
        junctions: [],
        roads: [],           // ADD THIS
        metroStations: [],   // ADD THIS
        roadBlocks: [],
        congestionPercent: 0,
        vehicleSpawnRate: 1,
        pedestrianSpawnRate: 1
    },

    ///////////////////////////////////////////////////////
    // EMERGENCY SYSTEM
    ///////////////////////////////////////////////////////

    emergency: {

        active: false,

        ambulanceId: null,

        origin: null,

        destination: null,

        route: [],

        currentStep: null,

        startedAt: null,

        completedAt: null
    },

    ///////////////////////////////////////////////////////
    // RESOURCE MANAGEMENT
    ///////////////////////////////////////////////////////

    resources: {

        cpu: {

            total: 100,

            used: 0
        },

        memory: {

            total: 32,

            used: 0
        },

        signalLocks: [],

        activeLocks: []
    },

    ///////////////////////////////////////////////////////
    // DEADLOCK SYSTEM
    ///////////////////////////////////////////////////////

    deadlock: {

        detected: false,

        graph: [],

        cycle: [],

        resolutionMethod: null
    },

    ///////////////////////////////////////////////////////
    // FAULT MANAGER
    ///////////////////////////////////////////////////////

    faults: {

        active: false,

        failedProcesses: [],

        recoveries: []
    },

    ///////////////////////////////////////////////////////
    // DASHBOARD CHART HISTORY
    ///////////////////////////////////////////////////////

    charts: {

        cpuHistory: [],

        memoryHistory: [],

        congestionHistory: [],

        vehicleHistory: [],

        ipcHistory: [],

        processHistory: [],

        threadHistory: []
    },

    ///////////////////////////////////////////////////////
    // EDUCATIONAL SYSTEM
    ///////////////////////////////////////////////////////

    activityPanel: {

        title: "SYSTEM READY",

        message:
            "Traffic simulation initialized.",

        concept:
            "Operating System Fundamentals"
    },

    learning: {

        currentConcept: null,

        conceptHistory: []
    },

    ///////////////////////////////////////////////////////
    // ACHIEVEMENTS
    ///////////////////////////////////////////////////////

    achievements: {

        startSimulation: false,

        firstEmergency: false,

        firstDeadlock: false,

        deadlockResolved: false,

        processFailureObserved: false,

        memoryAllocationObserved: false,

        ipcObserved: false,

        prioritySchedulingObserved: false
    },

    ///////////////////////////////////////////////////////
    // OBJECTIVES
    ///////////////////////////////////////////////////////

    objectives: [

        {
            id: "obj1",
            text: "Observe active process",
            completed: false
        },

        {
            id: "obj2",
            text: "Trigger emergency",
            completed: false
        },

        {
            id: "obj3",
            text: "Inspect IPC message",
            completed: false
        },

        {
            id: "obj4",
            text: "Observe memory allocation",
            completed: false
        },

        {
            id: "obj5",
            text: "Trigger deadlock",
            completed: false
        },

        {
            id: "obj6",
            text: "Resolve deadlock",
            completed: false
        }
    ],

    ///////////////////////////////////////////////////////
    // EVENT LOG
    ///////////////////////////////////////////////////////

    events: [],

    ///////////////////////////////////////////////////////
    // TIMELINE
    ///////////////////////////////////////////////////////

    timeline: [],

    ///////////////////////////////////////////////////////
    // SCENARIO HISTORY
    ///////////////////////////////////////////////////////

    replay: {

        currentScenario: null,

        events: []
    },

    ///////////////////////////////////////////////////////
    // STATISTICS
    ///////////////////////////////////////////////////////

    statistics: {

        vehiclesSpawned: 0,

        vehiclesCompleted: 0,

        averageWaitingTime: 0,

        averageJourneyTime: 0,

        averageQueueLength: 0,

        peakCongestion: 0,

        signalChanges: 0,

        emergencyResponseTime: 0,

        processesCreated: 0,

        processesTerminated: 0,

        threadsCreated: 0,

        contextSwitches: 0,

        ipcMessages: 0,

        memoryAllocations: 0,

        memoryReleases: 0,

        deadlocksDetected: 0,

        deadlocksResolved: 0,

        faultsDetected: 0,

        faultsRecovered: 0
    },

    ///////////////////////////////////////////////////////
    // DEVELOPER PAGE
    ///////////////////////////////////////////////////////

    developer: {

        name: "Yagnam Sanket Joshi",

        role:
            "Software Developer",

        github: "",

        portfolio: "",

        linkedin: "",

        project:
            "TrafficOS Pune"
    }
};

/***********************************************************
 * Utility Functions
 ***********************************************************/

export function formatTime(seconds) {

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return (
        String(mins).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );
}

export function generateEvent(
    type,
    source,
    message,
    explanation = "",
    concept = ""
) {

    const event = {

        id:
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000),

        timestamp:
            formatTime(state.simulationTime),

        type,

        source,

        message,

        explanation,

        concept
    };

    state.events.push(event);

    state.timeline.push(event);

    state.replay.events.push(event);

    state.activityPanel.message = message;

    state.activityPanel.concept = concept;

    return event;
}

/***********************************************************
 * Autosave
 ***********************************************************/

export function saveState() {

    try {

        const saveData = {

            version: state.version,

            statistics: state.statistics,

            achievements: state.achievements,

            objectives: state.objectives,

            events:
                state.events.slice(-250),

            simulationTime:
                state.simulationTime
        };

        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(saveData)
        );

        console.log(
            "TrafficOS autosaved."
        );

    } catch (err) {

        console.error(
            "Autosave failed",
            err
        );
    }
}

export function loadState() {

    try {

        const raw =
            localStorage.getItem(
                SAVE_KEY
            );

        if (!raw) return false;

        const saved =
            JSON.parse(raw);

        if (saved.statistics)
            Object.assign(
                state.statistics,
                saved.statistics
            );

        if (saved.achievements)
            Object.assign(
                state.achievements,
                saved.achievements
            );

        if (saved.objectives)
            state.objectives =
                saved.objectives;

        if (saved.events)
            state.events =
                saved.events;

        return true;

    } catch (err) {

        console.error(
            "Load state failed",
            err
        );

        return false;
    }
}

export function startAutoSave() {

    setInterval(() => {

        saveState();

    }, 15000);
}
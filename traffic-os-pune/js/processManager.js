/*****************************************************************
 * TrafficOS Pune
 * processManager.js
 *
 * Process Manager
 * Thread Manager
 * PCB Manager
 *
 * OS Concepts:
 * - Process Creation
 * - Process States
 * - PCB
 * - Thread Creation
 * - Process Termination
 * - Process Recovery
 *****************************************************************/

import {
    state,
    PROCESS_STATES,
    THREAD_STATES,
    generateEvent
} from "./state.js";

/*****************************************************************
 * PID GENERATION
 *****************************************************************/

function createPID() {

    const pid =
        "P" +
        String(state.nextProcessId)
            .padStart(2, "0");

    state.nextProcessId++;

    return pid;
}

function createTID() {

    const tid =
        "T" +
        String(state.nextThreadId)
            .padStart(3, "0");

    state.nextThreadId++;

    return tid;
}

/*****************************************************************
 * PCB CREATION
 *****************************************************************/

export function createPCB(process) {

    return {

        pid: process.pid,

        state: process.state,

        priority: process.priority,

        programCounter: 0,

        registers: {

            r1: 0,
            r2: 0,
            r3: 0,
            r4: 0
        },

        memoryBase: null,

        memoryLimit: null,

        cpuTime: 0,

        waitTime: 0,

        turnaroundTime: 0,

        createdAt: state.simulationTime
    };
}

/*****************************************************************
 * PROCESS CREATION
 *****************************************************************/

export function createProcess({

    pid = null,

    name,

    type = "JUNCTION",

    priority = 5,

    memoryRequired = 2

}) {

    const process = {

        pid: pid || createPID(),

        name,

        type,

        state: PROCESS_STATES.NEW,

        priority,

        threads: [],

        memoryRequired,

        cpuUsage: 0,

        messageCount: 0,

        suspended: false,

        faulted: false,

        createdAt: state.simulationTime,

        pcb: null
    };

    process.pcb = createPCB(process);

    state.processes.push(process);

    state.statistics.processesCreated++;

    process.state =
        PROCESS_STATES.READY;

    generateEvent(
        "PROCESS",
        process.pid,
        `${process.name} created.`,
        `${process.name} entered the READY state.`,
        "Process Creation"
    );

    return process;
}

/*****************************************************************
 * THREAD CREATION
 *****************************************************************/

export function createThread({

    processId,

    name,

    priority = 5

}) {

    const process =
        state.processes.find(
            p => p.pid === processId
        );

    if (!process) return null;

    const thread = {

        tid: createTID(),

        pid: processId,

        name,

        state: THREAD_STATES.READY,

        priority,

        cpuTime: 0,

        waitTime: 0,

        createdAt:
            state.simulationTime
    };

    state.threads.push(thread);

    process.threads.push(thread.tid);

    state.scheduler.readyQueue.push(
        thread.tid
    );

    state.statistics.threadsCreated++;

    generateEvent(
        "THREAD",
        process.pid,
        `${thread.name} created.`,
        "Process spawned a new thread.",
        "Thread Management"
    );

    return thread;
}

/*****************************************************************
 * LOOKUPS
 *****************************************************************/

export function getProcess(pid) {

    return state.processes.find(
        p => p.pid === pid
    );
}

export function getThread(tid) {

    return state.threads.find(
        t => t.tid === tid
    );
}

/*****************************************************************
 * PROCESS STATE CHANGE
 *****************************************************************/

export function setProcessState(
    pid,
    newState
) {

    const process = getProcess(pid);

    if (!process) return;

    process.state = newState;

    if (process.pcb) {
        process.pcb.state = newState;
    }

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} -> ${newState}`,
        `Process changed state to ${newState}.`,
        "Process State Transition"
    );
}

/*****************************************************************
 * THREAD STATE CHANGE
 *****************************************************************/

export function setThreadState(
    tid,
    newState
) {

    const thread = getThread(tid);

    if (!thread) return;

    thread.state = newState;
}

/*****************************************************************
 * TERMINATE PROCESS
 *****************************************************************/

export function terminateProcess(pid) {

    const process = getProcess(pid);

    if (!process) return;

    process.state =
        PROCESS_STATES.TERMINATED;

    process.threads.forEach(tid => {

        const thread =
            getThread(tid);

        if (thread) {

            thread.state =
                THREAD_STATES.TERMINATED;
        }
    });

    state.statistics
        .processesTerminated++;

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} terminated.`,
        "Process resources released.",
        "Process Termination"
    );
}

/*****************************************************************
 * SUSPEND PROCESS
 *****************************************************************/

export function suspendProcess(pid) {

    const process = getProcess(pid);

    if (!process) return;

    process.suspended = true;

    process.state =
        PROCESS_STATES.WAITING;

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} suspended.`,
        "Medium-term scheduler temporarily suspended process.",
        "Medium-Term Scheduling"
    );
}

/*****************************************************************
 * RESUME PROCESS
 *****************************************************************/

export function resumeProcess(pid) {

    const process = getProcess(pid);

    if (!process) return;

    process.suspended = false;

    process.state =
        PROCESS_STATES.READY;

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} resumed.`,
        "Process returned to ready queue.",
        "Medium-Term Scheduling"
    );
}

/*****************************************************************
 * RESTART PROCESS
 *****************************************************************/

export function restartProcess(pid) {

    const process = getProcess(pid);

    if (!process) return;

    process.state =
        PROCESS_STATES.READY;

    process.suspended = false;

    process.faulted = false;

    process.cpuUsage = 0;

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} restarted.`,
        "Fault Manager restored process.",
        "Fault Recovery"
    );
}

/**********************************************************/

/*****************************************************************
 * SYSTEM INITIALIZATION
 *****************************************************************/

export function initializeDefaultProcesses() {
    Object.keys(state.processDefinitions).forEach(pid => {
        if (pid !== "P07") { // Skip emergency, triggered dynamically
            createProcess({
                pid: pid,
                name: state.processDefinitions[pid],
                type: "SYSTEM",
                priority: 5,
                memoryRequired: 2
            });
            
            // Create a default thread for each process
            createThread({
                processId: pid,
                name: "Main Thread",
                priority: 5
            });
        }
    });
}

/*****************************************************************
 * PROCESS LIFECYCLE TICK
 *****************************************************************/

export function updateProcesses() {
    state.processes.forEach(process => {
        // Decay CPU usage visually for the UI if not currently running
        if (process.cpuUsage > 0 && process.state !== PROCESS_STATES.RUNNING) {
            process.cpuUsage = Math.max(0, process.cpuUsage - 2);
        }
    });
}

/*****************************************************************
 * EMERGENCY PROCESS INJECTION
 *****************************************************************/

export function createEmergencyProcess() {
    const pid = "P07"; 
    
    if (getProcess(pid)) return getProcess(pid);

    const process = createProcess({
        pid: pid,
        name: state.processDefinitions[pid] || "Emergency Service",
        type: "EMERGENCY",
        priority: 10, // Max priority to trigger preemption
        memoryRequired: 4
    });

    createThread({
        processId: pid,
        name: "Emergency Routing Thread",
        priority: 10
    });

    return process;
}

/*****************************************************************
 * FAULT INJECTION (Scenarios)
 *****************************************************************/

export function failProcess(pid) {
    const process = getProcess(pid);
    
    if (process) {
        process.state = PROCESS_STATES.FAILED;
        process.faulted = true;
        process.cpuUsage = 0;
        
        if (process.pcb) {
            process.pcb.state = PROCESS_STATES.FAILED;
        }

        // Track fault globally
        state.faults.active = true;
        if (!state.faults.failedProcesses.includes(pid)) {
            state.faults.failedProcesses.push(pid);
        }
        
        generateEvent(
            "FAULT", 
            pid, 
            `${process.name} failed`, 
            "Process crashed unexpectedly.", 
            "Fault Handling"
        );
    }
}

/*****************************************************************
 * PRIORITY CHANGE (user-controlled)
 *****************************************************************/

export function setPriority(pid, priority) {

    const process = getProcess(pid);

    if (!process) return;

    process.priority = Math.max(1, Math.min(10, priority));

    process.threads.forEach(tid => {

        const thread = getThread(tid);

        if (thread) thread.priority = process.priority;
    });

    if (process.pcb) process.pcb.priority = process.priority;

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} priority set to ${process.priority}`,
        "Priority changed manually by user.",
        "Priority Scheduling"
    );
}

/*****************************************************************
 * FULL REMOVAL (user-controlled)
 *****************************************************************/

export function removeProcessCompletely(pid) {

    const process = getProcess(pid);

    if (!process) return;

    state.threads = state.threads.filter(t => t.pid !== pid);

    state.scheduler.readyQueue =
        state.scheduler.readyQueue.filter(tid => !process.threads.includes(tid));

    state.scheduler.waitingQueue =
        state.scheduler.waitingQueue.filter(tid => !process.threads.includes(tid));

    state.scheduler.blockedQueue =
        state.scheduler.blockedQueue.filter(tid => !process.threads.includes(tid));

    if (process.threads.includes(state.scheduler.currentThread)) {

        state.scheduler.currentThread = null;
    }

    state.processes = state.processes.filter(p => p.pid !== pid);

    generateEvent(
        "PROCESS",
        pid,
        `${process.name} removed.`,
        "Process and its threads were deleted from the system by the user.",
        "Process Termination"
    );
}
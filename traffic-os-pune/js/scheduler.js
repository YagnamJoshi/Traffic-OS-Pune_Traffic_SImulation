/*****************************************************************
 * TrafficOS Pune
 * scheduler.js
 *
 * CPU Scheduling Engine
 *
 * Concepts Demonstrated:
 *
 * Long Term Scheduler
 * Medium Term Scheduler
 * Short Term Scheduler
 *
 * Round Robin
 * Priority Scheduling
 * FCFS
 *
 * Context Switching
 * Preemption
 * Ready Queue
 * Waiting Queue
 * Blocked Queue
 *****************************************************************/

import {
    state,
    THREAD_STATES,
    PROCESS_STATES,
    SCHEDULER_TYPES,
    generateEvent
} from "./state.js";

import {
    getThread,
    getProcess,
    setThreadState
} from "./processManager.js";

/*****************************************************************
 * INTERNAL TIMER
 *****************************************************************/

let quantumTimer = 0;


let schedulingTickCount = 0;
let busyTickCount = 0;
let rrLastThread = null;

// Actual execution samples, not fabricated chart data.
const executionHistory = [];
const MAX_HISTORY = 120;

function recordExecution(tid) {
    const last = executionHistory.at(-1);

    if (last && last.tid === tid) {
        last.duration++;
    } else {
        executionHistory.push({
            tid: tid || "IDLE",
            duration: 1
        });

        if (executionHistory.length > MAX_HISTORY) {
            executionHistory.shift();
        }
    }
}

export function getSchedulingHistory() {
    return executionHistory.map(item => ({ ...item }));
}

function isRunnableThread(tid) {
    const thread = tid ? getThread(tid) : null;

    return thread &&
        thread.state === THREAD_STATES.RUNNING;
}


/*****************************************************************
 * LONG TERM SCHEDULER
 *
 * Decides which processes
 * enter the system.
 *****************************************************************/

/*****************************************************************
 * ALGORITHM CHANGE (user-controlled)
 *****************************************************************/


export function setSchedulerAlgorithm(algorithm) {
    const supported = [
        SCHEDULER_TYPES.FCFS,
        SCHEDULER_TYPES.PRIORITY,
        SCHEDULER_TYPES.ROUND_ROBIN
    ];

    if (!supported.includes(algorithm)) {
        generateEvent(
            "SCHEDULER",
            "Scheduler",
            `Unsupported scheduling algorithm: ${algorithm}`,
            "Only FCFS, Priority and Round Robin are implemented.",
            "CPU Scheduling"
        );
        return;
    }

    if (state.scheduler.algorithm === algorithm) return;

    const previous = getThread(state.scheduler.currentThread);

    if (previous &&
        previous.state === THREAD_STATES.RUNNING) {
        previous.state = THREAD_STATES.READY;
    }

    state.scheduler.algorithm = algorithm;
    state.scheduler.currentThread = null;

    quantumTimer = 0;
    rrLastThread = null;

    rebuildQueues();

    generateEvent(
        "SCHEDULER",
        "Scheduler",
        `Algorithm changed to ${algorithm}`,
        "Running thread returned to READY for reselection.",
        "CPU Scheduling"
    );
}

export function longTermScheduler() {

    const activeProcesses =
        state.processes.filter(
            p =>
                p.state !== PROCESS_STATES.TERMINATED
        );

    state.scheduler.lastScheduleMessage =
        `Long-Term Scheduler monitoring ${activeProcesses.length} processes`;

}

/*****************************************************************
 * MEDIUM TERM SCHEDULER
 *
 * Handles suspension/resume.
 *****************************************************************/

export function mediumTermScheduler() {

    state.processes.forEach(process => {

        if (
            process.state === PROCESS_STATES.FAILED
        ) {
            return;
        }

        if (
            process.cpuUsage > 90 &&
            Math.random() < 0.01
        ) {

            process.state =
                PROCESS_STATES.WAITING;

            generateEvent(
                "SCHEDULER",
                process.pid,
                `${process.name} temporarily suspended`,
                "Medium-Term Scheduler moved process out of execution.",
                "Medium Term Scheduling"
            );
        }

        if (
            process.state === PROCESS_STATES.WAITING &&
            Math.random() < 0.03
        ) {

            process.state =
                PROCESS_STATES.READY;

            generateEvent(
                "SCHEDULER",
                process.pid,
                `${process.name} resumed`,
                "Process returned to memory and ready queue.",
                "Medium Term Scheduling"
            );
        }

    });

}

/*****************************************************************
 * QUEUE REBUILD
 *****************************************************************/

export function rebuildQueues() {

    state.scheduler.readyQueue =
        [];

    state.scheduler.waitingQueue =
        [];

    state.scheduler.blockedQueue =
        [];

    state.threads.forEach(thread => {

        switch(thread.state) {

            case THREAD_STATES.READY:

                state.scheduler.readyQueue.push(
                    thread.tid
                );

                break;

            case THREAD_STATES.WAITING:

                state.scheduler.waitingQueue.push(
                    thread.tid
                );

                break;

            case THREAD_STATES.BLOCKED:

                state.scheduler.blockedQueue.push(
                    thread.tid
                );

                break;
        }

    });

}

/*****************************************************************
 * FIND NEXT - FCFS
 *****************************************************************/

function selectFCFS() {

    return state.scheduler.readyQueue[0] || null;

}

/*****************************************************************
 * FIND NEXT - PRIORITY
 *****************************************************************/

function selectPriority() {

    if (
        state.scheduler.readyQueue.length === 0
    ) {
        return null;
    }

    let bestThread = null;

    let bestPriority = -1;

    state.scheduler.readyQueue.forEach(
        tid => {

            const thread =
                getThread(tid);

            if (!thread) return;

            if (
                thread.priority >
                bestPriority
            ) {

                bestPriority =
                    thread.priority;

                bestThread =
                    thread;
            }

        }
    );

    return bestThread
        ? bestThread.tid
        : null;
}

/*****************************************************************
 * FIND NEXT - ROUND ROBIN
 *****************************************************************/

function selectRoundRobin() {
    const queue = state.scheduler.readyQueue;

    if (!queue.length) return null;

    if (!rrLastThread) return queue[0];

    const previousIndex = queue.indexOf(rrLastThread);

    if (previousIndex === -1) {
        return queue[0];
    }

    return queue[(previousIndex + 1) % queue.length];
}


/*****************************************************************
 * CHOOSE THREAD
 *****************************************************************/

export function chooseNextThread() {

    const algorithm =
        state.scheduler.algorithm;

    switch(algorithm) {

        case SCHEDULER_TYPES.FCFS:
            return selectFCFS();

        case SCHEDULER_TYPES.PRIORITY:
            return selectPriority();

        default:
            return selectRoundRobin();
    }
}

/*****************************************************************
 * CONTEXT SWITCH
 *****************************************************************/

export function contextSwitch(newTid) {

    const currentTid =
        state.scheduler.currentThread;

    if (currentTid === newTid)
        return;

    if (currentTid) {

        const currentThread =
            getThread(currentTid);

        if (
            currentThread &&
            currentThread.state ===
            THREAD_STATES.RUNNING
        ) {

            currentThread.state =
                THREAD_STATES.READY;

        }

    }

    const nextThread =
        getThread(newTid);

    if (!nextThread)
        return;

    nextThread.state =
        THREAD_STATES.RUNNING;

    state.scheduler.currentThread =
        nextThread.tid;

    state.scheduler.contextSwitches++;

    state.statistics.contextSwitches++;

    generateEvent(
        "SCHEDULER",
        nextThread.pid,
        `CPU assigned to ${nextThread.tid}`,
        "Context switch occurred.",
        "Context Switching"
    );
}

/*****************************************************************
 * PRIORITY PREEMPTION
 *****************************************************************/

export function priorityPreemption() {

    if (
        state.scheduler.algorithm !==
        SCHEDULER_TYPES.PRIORITY
    ) {
        return;
    }

    const current =
        getThread(
            state.scheduler.currentThread
        );

    if (!current)
        return;

    let higher =
        null;

    state.scheduler.readyQueue.forEach(
        tid => {

            const t =
                getThread(tid);

            if (!t)
                return;

            if (
                t.priority >
                current.priority
            ) {

                higher = t;
            }

        }
    );

    if (!higher)
        return;

    generateEvent(
        "SCHEDULER",
        higher.pid,
        `${higher.tid} preempted ${current.tid}`,
        "Higher priority thread selected.",
        "Priority Scheduling"
    );

    contextSwitch(
        higher.tid
    );
}

/*****************************************************************
 * ROUND ROBIN
 *****************************************************************/


function roundRobinTick() {
    const runningTid = state.scheduler.currentThread;
    if (!runningTid) return;

    quantumTimer++;

    const quantum = Math.max(
        1,
        Math.ceil(Number(state.scheduler.timeQuantum || 10) / 10)
    );

    if (quantumTimer < quantum) return;

    quantumTimer = 0;

    const runningThread = getThread(runningTid);

    if (!runningThread ||
        runningThread.state !== THREAD_STATES.RUNNING) {
        state.scheduler.currentThread = null;
        return;
    }

    runningThread.state = THREAD_STATES.READY;
    rrLastThread = runningTid;

    rebuildQueues();

    const nextTid = selectRoundRobin();

    // A single runnable thread can keep the CPU.
    if (!nextTid || nextTid === runningTid) {
        runningThread.state = THREAD_STATES.RUNNING;
        state.scheduler.currentThread = runningTid;
        return;
    }

    contextSwitch(nextTid);
}


/*****************************************************************
 * RUNNING THREAD UPDATE
 *****************************************************************/

function updateRunningThread() {

    const tid =
        state.scheduler.currentThread;

    if (!tid)
        return;

    const thread =
        getThread(tid);

    if (!thread)
        return;

    thread.cpuTime += 1;

    const process =
        getProcess(thread.pid);

    if (process) {

        process.cpuUsage =
            Math.min(
                100,
                process.cpuUsage + 1
            );

        process.state =
            PROCESS_STATES.RUNNING;

        if (process.pcb) {

            process.pcb.cpuTime += 1;

            process.pcb.programCounter++;
        }
    }

}

/*****************************************************************
 * WAIT QUEUE SIMULATION
 *****************************************************************/

function randomWaitingBehaviour() {

    state.threads.forEach(thread => {

        if (
            thread.state ===
            THREAD_STATES.WAITING
        ) {

            if (
                Math.random() < 0.02
            ) {

                thread.state =
                    THREAD_STATES.READY;

                generateEvent(
                    "THREAD",
                    thread.pid,
                    `${thread.tid} returned to READY`,
                    "I/O wait completed.",
                    "Process Synchronization"
                );
            }
        }

    });

}

/*****************************************************************
 * BLOCKING SIMULATION
 *****************************************************************/

function randomBlockingBehaviour() {

    state.threads.forEach(thread => {

        if (
            thread.state ===
            THREAD_STATES.RUNNING &&
            Math.random() < 0.001
        ) {

            thread.state =
                THREAD_STATES.BLOCKED;

            generateEvent(
                "THREAD",
                thread.pid,
                `${thread.tid} blocked`,
                "Waiting for resource lock.",
                "Synchronization"
            );
        }

    });

}

/*****************************************************************
 * CPU UTILIZATION
 *****************************************************************/


function updateCPUUtilization() {
    schedulingTickCount++;

    const current = state.scheduler.currentThread;

    if (isRunnableThread(current)) {
        busyTickCount++;
    }

    state.scheduler.cpuUtilization =
        Math.round(
            (busyTickCount / schedulingTickCount) * 100
        );
}


/*****************************************************************
 * EXPLAIN CURRENT SCHEDULER
 *****************************************************************/

export function explainCurrentScheduling() {

    const current =
        getThread(
            state.scheduler.currentThread
        );

    if (!current) {

        return {
            title:
                "CPU Idle",

            message:
                "No runnable thread available."
        };
    }

    return {

        title:
            "Short Term Scheduler",

        message:
            `${current.tid} is running because the scheduler selected it according to ${state.scheduler.algorithm}.`
    };
}

/*****************************************************************
 * MAIN SCHEDULER TICK
 *****************************************************************/


export function schedulerTick() {
    longTermScheduler();
    mediumTermScheduler();

    // Clear a stale CPU assignment when its thread
    // has blocked, terminated, or stopped running.
    if (!isRunnableThread(state.scheduler.currentThread)) {
        state.scheduler.currentThread = null;
        quantumTimer = 0;
    }

    rebuildQueues();

    if (!state.scheduler.currentThread) {
        const next = chooseNextThread();

        if (next) {
            contextSwitch(next);
        }
    }

    priorityPreemption();

    // Record the thread that actually received this tick.
    const runningTid = isRunnableThread(
        state.scheduler.currentThread
    ) ? state.scheduler.currentThread : null;

    recordExecution(runningTid);

    updateRunningThread();

    randomWaitingBehaviour();
    randomBlockingBehaviour();

    if (
        state.scheduler.algorithm ===
        SCHEDULER_TYPES.ROUND_ROBIN
    ) {
        roundRobinTick();
    }

    // Keep displayed queues synchronized with new states.
    rebuildQueues();

    updateCPUUtilization();
}


/*****************************************************************
 * QUEUE INFO FOR UI
 *****************************************************************/

export function getSchedulerInfo() {
    const runningTid = state.scheduler.currentThread;
    let runningName = "IDLE";

    if (runningTid) {
        const thread = getThread(runningTid);
        if (thread) {
            const process = getProcess(thread.pid);
            runningName = process ? process.name : runningTid;
        }
    }

    return {
        algorithm: state.scheduler.algorithm,
        running: runningName,
        ready: state.scheduler.readyQueue,
        waiting: state.scheduler.waitingQueue,
        blocked: state.scheduler.blockedQueue,
        switches: state.scheduler.contextSwitches,
        cpu: state.scheduler.cpuUtilization
    };
}
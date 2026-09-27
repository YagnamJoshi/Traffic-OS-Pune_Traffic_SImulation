/*******************************************************************
 * TrafficOS Pune
 * deadlock.js
 *
 * DEADLOCK MANAGER
 *
 * Junction-controller processes (P01-P04) compete for each other's
 * locks. The active mode changes how a request is handled:
 *
 * - DETECTION:  grant immediately, periodically scan for cycles,
 *               then pick a victim and roll it back.
 * - PREVENTION: enforce a global resource ordering so a process
 *               can only request resources in ascending ID order,
 *               structurally ruling out circular wait.
 * - AVOIDANCE:  check each request in advance (Banker's-style) and
 *               refuse any request that would create a cycle.
 *******************************************************************/

import {
    state,
    DEADLOCK_MODES,
    generateEvent
} from "./state.js";

import {
    getProcess
} from "./processManager.js";

const LOCKABLE_RESOURCES = ["P01", "P02", "P03", "P04"];

/*******************************************************************
 * MODE
 *******************************************************************/

export function setDeadlockMode(mode) {

    state.deadlock.mode = mode;

    state.deadlock.detected = false;

    state.deadlock.cycle = [];

    state.deadlock.detectedAt = null;

    generateEvent(
        "DEADLOCK",
        "Deadlock Manager",
        `Strategy set to ${mode}`,
        explainMode(mode),
        "Deadlock Handling"
    );
}

function explainMode(mode) {

    switch (mode) {

        case DEADLOCK_MODES.PREVENTION:
            return "Resources must now be acquired in ascending ID order — this rules out circular wait structurally.";

        case DEADLOCK_MODES.AVOIDANCE:
            return "Each lock request is checked in advance; a request that could create a cycle is refused.";

        default:
            return "Locks are granted immediately. The system periodically scans for circular waits and recovers.";
    }
}

/*******************************************************************
 * CYCLE CHECK (used by Avoidance, and by Detection's scanner)
 *******************************************************************/

function buildWaitForGraph(extraEdge) {

    const adjacency = {};

    state.deadlock.waitFor.forEach(w => {

        const holder = state.deadlock.locks[w.waitingFor];

        if (holder) {

            adjacency[w.pid] = adjacency[w.pid] || [];
            adjacency[w.pid].push(holder);
        }
    });

    if (extraEdge) {

        adjacency[extraEdge.from] = adjacency[extraEdge.from] || [];
        adjacency[extraEdge.from].push(extraEdge.to);
    }

    return adjacency;
}

function wouldCreateCycle(pid, resourceId) {

    const holder = state.deadlock.locks[resourceId];

    if (!holder || holder === pid) return false;

    const adjacency = buildWaitForGraph({ from: pid, to: holder });

    const visited = new Set();

    function dfs(node) {

        if (node === pid) return true;

        if (visited.has(node)) return false;

        visited.add(node);

        return (adjacency[node] || []).some(dfs);
    }

    return dfs(holder);
}

function findCycle() {

    const adjacency = buildWaitForGraph();

    const visited = new Set();
    const stack = [];

    function dfs(node) {

        if (stack.includes(node)) {

            return stack.slice(stack.indexOf(node)).concat(node);
        }

        if (visited.has(node)) return null;

        visited.add(node);
        stack.push(node);

        for (const next of (adjacency[node] || [])) {

            const cycle = dfs(next);

            if (cycle) return cycle;
        }

        stack.pop();

        return null;
    }

    for (const node of Object.keys(adjacency)) {

        const cycle = dfs(node);

        if (cycle) return cycle;
    }

    return null;
}

/*******************************************************************
 * LOCK REQUEST
 *******************************************************************/

export function requestLock(pid, resourceId) {

    if (state.deadlock.locks[resourceId] === pid) return true;

    if (state.deadlock.mode === DEADLOCK_MODES.PREVENTION) {

        const held = Object.entries(state.deadlock.locks)
            .filter(([, owner]) => owner === pid)
            .map(([resource]) => resource);

        const highestHeld = held.sort().pop();

        if (highestHeld && resourceId < highestHeld) {

            generateEvent(
                "DEADLOCK",
                pid,
                `${pid} denied lock on ${resourceId}`,
                `Prevention: resources must be requested in ascending order (already holds ${highestHeld}).`,
                "Deadlock Prevention"
            );

            return false;
        }
    }

    if (!state.deadlock.locks[resourceId]) {

        state.deadlock.locks[resourceId] = pid;

        state.deadlock.waitFor =
            state.deadlock.waitFor.filter(w => w.pid !== pid);

        generateEvent(
            "DEADLOCK",
            pid,
            `${pid} acquired lock ${resourceId}`,
            "Resource granted.",
            "Resource Allocation"
        );

        return true;
    }

    if (state.deadlock.mode === DEADLOCK_MODES.AVOIDANCE) {

        if (wouldCreateCycle(pid, resourceId)) {

            generateEvent(
                "DEADLOCK",
                pid,
                `${pid} denied lock ${resourceId}`,
                "Avoidance: granting this would create a circular wait, so it was refused.",
                "Deadlock Avoidance (Banker's Algorithm)"
            );

            return false;
        }
    }

    if (!state.deadlock.waitFor.find(w => w.pid === pid && w.waitingFor === resourceId)) {

        state.deadlock.waitFor.push({ pid, waitingFor: resourceId });

        generateEvent(
            "DEADLOCK",
            pid,
            `${pid} waiting for ${resourceId}`,
            `Resource held by ${state.deadlock.locks[resourceId]}.`,
            "Resource Contention"
        );
    }

    return false;
}

export function releaseLock(pid, resourceId) {

    if (state.deadlock.locks[resourceId] === pid) {

        delete state.deadlock.locks[resourceId];

        generateEvent(
            "DEADLOCK",
            pid,
            `${pid} released lock ${resourceId}`,
            "Resource returned to pool.",
            "Resource Deallocation"
        );
    }

    state.deadlock.waitFor =
        state.deadlock.waitFor.filter(w => w.pid !== pid);
}

export function releaseAllLocks(pid) {

    Object.keys(state.deadlock.locks).forEach(resource => {

        if (state.deadlock.locks[resource] === pid) {

            delete state.deadlock.locks[resource];
        }
    });

    state.deadlock.waitFor =
        state.deadlock.waitFor.filter(w => w.pid !== pid);
}

/*******************************************************************
 * DETECTION + RECOVERY
 *******************************************************************/

export function detectDeadlock() {

    if (state.deadlock.mode !== DEADLOCK_MODES.DETECTION) return;

    const cycle = findCycle();

    if (cycle && !state.deadlock.detected) {

        state.deadlock.detected = true;
        state.deadlock.cycle = cycle;
        state.deadlock.detectedAt = state.simulationTime;

        state.statistics.deadlocksDetected++;

        generateEvent(
            "DEADLOCK",
            "Detector",
            "Deadlock detected.",
            `Circular wait: ${cycle.join(" → ")}`,
            "Deadlock Detection"
        );

    } else if (!cycle && state.deadlock.detected) {

        state.deadlock.detected = false;
        state.deadlock.cycle = [];
        state.deadlock.detectedAt = null;
    }
}

export function resolveDeadlock() {

    if (!state.deadlock.detected || state.deadlock.cycle.length === 0) return;

    let victimPid = state.deadlock.cycle[0];
    let lowestPriority = Infinity;

    state.deadlock.cycle.forEach(pid => {

        const process = getProcess(pid);

        if (process && process.priority < lowestPriority) {

            lowestPriority = process.priority;
            victimPid = pid;
        }
    });

    releaseAllLocks(victimPid);

    state.deadlock.detected = false;
    state.deadlock.cycle = [];
    state.deadlock.detectedAt = null;

    state.statistics.deadlocksResolved++;

    generateEvent(
        "DEADLOCK",
        "Resolver",
        `${victimPid} rolled back to break the cycle.`,
        "Victim process released all held locks (recovery by rollback).",
        "Deadlock Recovery"
    );
}

/*******************************************************************
 * SCENARIO TRIGGER (used by the "Deadlock" button)
 *******************************************************************/

export function triggerDeadlockScenario() {

    requestLock("P01", "P01");
    requestLock("P02", "P02");
    requestLock("P01", "P02");
    requestLock("P02", "P01");
}

/*******************************************************************
 * TICK
 *******************************************************************/

export function deadlockTick() {

    LOCKABLE_RESOURCES.forEach(pid => {

        if (Math.random() < 0.01) {

            const others = LOCKABLE_RESOURCES.filter(r => r !== pid);

            const target = others[Math.floor(Math.random() * others.length)];

            requestLock(pid, target);
        }
    });

    if (state.deadlock.mode === DEADLOCK_MODES.DETECTION) {

        detectDeadlock();

        if (
            state.deadlock.detected &&
            state.simulationTime - (state.deadlock.detectedAt || 0) > 5
        ) {

            resolveDeadlock();
        }
    }
}

/*******************************************************************
 * UI SNAPSHOT
 *******************************************************************/

export function getDeadlockInfo() {

    return {
        mode: state.deadlock.mode,
        detected: state.deadlock.detected,
        cycle: state.deadlock.cycle,
        locks: state.deadlock.locks,
        waitFor: state.deadlock.waitFor
    };
}
/*****************************************************************
 * TrafficOS Pune
 * memoryManager.js
 *
 * MEMORY MANAGEMENT ENGINE
 *
 * Concepts:
 * - First Fit
 * - Best Fit
 * - Worst Fit
 * - Fragmentation
 * - Allocation
 * - Deallocation
 * - Memory Pressure
 * - Emergency Memory Reservation
 *****************************************************************/

import {
    state,
    MEMORY_ALGORITHMS,
    generateEvent
} from "./state.js";

/*****************************************************************
 * INITIALIZE MEMORY
 *****************************************************************/

export function initializeMemory() {

    state.memory.blocks = [];

    for (let i = 0; i < state.memory.totalBlocks; i++) {

        state.memory.blocks.push({

            index: i,

            occupied: false,

            owner: null,

            color: "#1a1f3a"
        });
    }

    updateMemoryStats();

    generateEvent(
        "MEMORY",
        "MemoryManager",
        "RAM initialized.",
        `${state.memory.totalBlocks} blocks available.`,
        "Memory Management"
    );
}

/*****************************************************************
 * MEMORY STATS
 *****************************************************************/

export function updateMemoryStats() {

    const used =
        state.memory.blocks.filter(
            block => block.occupied
        ).length;

    const free =
        state.memory.totalBlocks - used;

    state.memory.usedBlocks = used;

    state.memory.freeBlocks = free;

    state.resources.memory.used = used;

    state.memory.fragmentation =
        calculateFragmentation();
}

/*****************************************************************
 * FRAGMENTATION
 *****************************************************************/

export function calculateFragmentation() {

    let holes = 0;

    let inHole = false;

    for (const block of state.memory.blocks) {

        if (!block.occupied) {

            if (!inHole) {

                holes++;

                inHole = true;
            }

        } else {

            inHole = false;
        }
    }

    return holes;
}

/*****************************************************************
 * GET FREE SEGMENTS
 *****************************************************************/

function getFreeSegments() {

    const segments = [];

    let currentStart = null;

    let currentLength = 0;

    state.memory.blocks.forEach((block, index) => {

        if (!block.occupied) {

            if (currentStart === null) {

                currentStart = index;
            }

            currentLength++;

        } else {

            if (currentLength > 0) {

                segments.push({

                    start: currentStart,

                    length: currentLength
                });
            }

            currentStart = null;

            currentLength = 0;
        }

    });

    if (currentLength > 0) {

        segments.push({

            start: currentStart,

            length: currentLength
        });
    }

    return segments;
}

/*****************************************************************
 * FIRST FIT
 *****************************************************************/

function firstFit(size) {

    const segments = getFreeSegments();

    return segments.find(
        s => s.length >= size
    );
}

/*****************************************************************
 * BEST FIT
 *****************************************************************/

function bestFit(size) {

    const segments = getFreeSegments()
        .filter(
            s => s.length >= size
        )
        .sort(
            (a, b) =>
                a.length - b.length
        );

    return segments[0] || null;
}

/*****************************************************************
 * WORST FIT
 *****************************************************************/

function worstFit(size) {

    const segments = getFreeSegments()
        .filter(
            s => s.length >= size
        )
        .sort(
            (a, b) =>
                b.length - a.length
        );

    return segments[0] || null;
}

/*****************************************************************
 * ALLOCATION STRATEGY
 *****************************************************************/

function chooseSegment(size) {

    switch (
        state.memory.algorithm
    ) {

        case MEMORY_ALGORITHMS.BEST_FIT:

            return bestFit(size);

        case MEMORY_ALGORITHMS.WORST_FIT:

            return worstFit(size);

        default:

            return firstFit(size);
    }
}

/*****************************************************************
 * RANDOM PROCESS COLOR
 *****************************************************************/

function generateColor(pid) {

    const colors = [

        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#a855f7",
        "#06b6d4",
        "#eab308"
    ];

    const code =
        pid.charCodeAt(
            pid.length - 1
        );

    return colors[
        code % colors.length
    ];
}

/*****************************************************************
 * MEMORY ALLOCATION
 *****************************************************************/

export function allocateMemory(
    pid,
    blocksNeeded
) {

    const segment =
        chooseSegment(
            blocksNeeded
        );

    if (!segment) {

        generateEvent(
            "MEMORY",
            pid,
            "Allocation failed.",
            "Not enough contiguous memory.",
            "Memory Pressure"
        );

        return false;
    }

    const allocatedBlocks = [];

    for (
        let i = segment.start;
        i <
        segment.start +
            blocksNeeded;
        i++
    ) {

        state.memory.blocks[i]
            .occupied = true;

        state.memory.blocks[i]
            .owner = pid;

        state.memory.blocks[i]
            .color =
            generateColor(pid);

        allocatedBlocks.push(i);
    }

    state.memory.allocations.push({

        pid,

        blocks: allocatedBlocks,

        size: blocksNeeded,

        simulationTime:
            state.simulationTime
    });

    state.statistics
        .memoryAllocations++;

    updateMemoryStats();

    generateEvent(
        "MEMORY",
        pid,
        `${blocksNeeded} blocks allocated`,
        `${state.memory.algorithm} selected memory region.`,
        "Memory Allocation"
    );

    return true;
}

/*****************************************************************
 * RELEASE MEMORY
 *****************************************************************/


export function releaseMemory(pid) {
    let releaseCount = 0;

    for (const block of state.memory.blocks) {
        if (block.owner !== pid) continue;

        block.occupied = false;
        block.owner = null;
        block.color = "#1a1f3a";
        releaseCount++;
    }

    if (releaseCount === 0) return 0;

    state.memory.allocations =
        state.memory.allocations.filter(
            allocation => allocation.pid !== pid
        );

    state.statistics.memoryReleases++;
    state.memory.releases++;

    updateMemoryStats();

    generateEvent(
        "MEMORY",
        pid,
        `${releaseCount} blocks released`,
        "Memory returned to free pool.",
        "Memory Deallocation"
    );

    return releaseCount;
}


/*****************************************************************
 * PROCESS MEMORY LOOKUP
 *****************************************************************/

export function getProcessMemory(pid) {

    return state.memory.blocks.filter(
        b => b.owner === pid
    ).length;
}

/*****************************************************************
 * MEMORY PRESSURE
 *****************************************************************/

export function createMemoryPressure() {

    let success = 0;

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const pid =
            "TEST_" + i;

        const size =
            Math.floor(
                Math.random() * 5
            ) + 1;

        if (
            allocateMemory(
                pid,
                size
            )
        ) {

            success++;
        }
    }

    generateEvent(
        "MEMORY",
        "LAB",
        "Memory pressure scenario executed.",
        `${success} allocations attempted.`,
        "Memory Pressure"
    );
}

/*****************************************************************
 * COMPACT MEMORY
 *****************************************************************/


export function compactMemory() {
    const usedBlocks = state.memory.blocks
        .filter(block => block.occupied);

    const total = state.memory.totalBlocks;

    state.memory.blocks = Array.from(
        { length: total },
        (_, index) => ({
            index,
            occupied: false,
            owner: null,
            color: "#1a1f3a"
        })
    );

    usedBlocks.forEach((block, index) => {
        state.memory.blocks[index] = {
            index,
            occupied: true,
            owner: block.owner,
            color: block.color
        };
    });

    // Reconstruct allocation records from the new
    // physical positions after compaction.
    const groups = new Map();

    for (const block of state.memory.blocks) {
        if (!block.occupied) continue;

        if (!groups.has(block.owner)) {
            groups.set(block.owner, []);
        }

        groups.get(block.owner).push(block.index);
    }

    state.memory.allocations = [...groups].map(
        ([pid, blocks]) => ({
            pid,
            blocks,
            size: blocks.length,
            simulationTime: state.simulationTime
        })
    );

    updateMemoryStats();

    generateEvent(
        "MEMORY",
        "MemoryManager",
        "Memory compaction completed.",
        "Occupied blocks packed together; free space consolidated.",
        "Fragmentation Reduction"
    );
}

/*****************************************************************
 * EMERGENCY MEMORY
 *****************************************************************/

export function allocateEmergencyMemory() {

    const success =
        allocateMemory(
            "P07",
            4
        );

    if (!success) {

        compactMemory();

        allocateMemory(
            "P07",
            4
        );
    }

    generateEvent(
        "EMERGENCY",
        "P07",
        "Emergency route memory prepared.",
        "Reserved memory for route planning and IPC.",
        "Real Time Systems"
    );
}

/*****************************************************************
 * MEMORY LAB
 *****************************************************************/


export function createMemoryLabProcess(pid, size) {
    const success = allocateMemory(pid, size);

    generateEvent(
        "LAB",
        pid,
        success
            ? "Memory lab allocation successful."
            : "Memory lab allocation failed.",
        success
            ? `Allocated ${size} contiguous blocks.`
            : `Could not allocate ${size} contiguous blocks.`,
        "Memory Lab"
    );

    return success;
}


/*****************************************************************
 * MEMORY SNAPSHOT
 *****************************************************************/

export function getMemorySnapshot() {

    return {

        total:
            state.memory.totalBlocks,

        used:
            state.memory.usedBlocks,

        free:
            state.memory.freeBlocks,

        fragmentation:
            state.memory.fragmentation,

        allocations:
            state.statistics
                .memoryAllocations,

        releases:
            state.statistics
                .memoryReleases,

        algorithm:
            state.memory.algorithm
    };
}

/*****************************************************************
 * ALGORITHM CHANGE
 *****************************************************************/

export function setAllocationAlgorithm(
    algorithm
) {

    state.memory.algorithm =
        algorithm;

    generateEvent(
        "MEMORY",
        "MemoryManager",
        `Allocation strategy changed to ${algorithm}`,
        "Future allocations will use the selected algorithm.",
        "Allocation Strategies"
    );
}

/*****************************************************************
 * MEMORY TICK
 *
 * Runs during simulation.
 *****************************************************************/

export function memoryTick() {

    updateMemoryStats();

    const utilization = Math.floor(
        (
            state.memory.usedBlocks /
            state.memory.totalBlocks
        ) * 100
    );

    if (utilization > 80) {

        generateEvent(
            "MEMORY",
            "MemoryManager",
            "High memory usage detected.",
            `${utilization}% RAM in use.`,
            "Memory Pressure"
        );
    }
}
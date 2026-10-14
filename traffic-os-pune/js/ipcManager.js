
/* ==========================================================
   TrafficOS Pune — IPC Engine v2
   Message Passing / FIFO / Backpressure / Delivery History
   ========================================================== */

import { state, generateEvent } from "./state.js";

export const IPC_TYPES = Object.freeze({
    AMBULANCE_APPROACHING: "AMBULANCE_APPROACHING",
    REQUEST_GREEN_CORRIDOR: "REQUEST_GREEN_CORRIDOR",
    PREPARE_SIGNAL: "PREPARE_SIGNAL",
    SIGNAL_UPDATED: "SIGNAL_UPDATED",
    TRAFFIC_UPDATE: "TRAFFIC_UPDATE",
    CONGESTION_ALERT: "CONGESTION_ALERT",
    DEADLOCK_WARNING: "DEADLOCK_WARNING",
    RESOURCE_LOCK: "RESOURCE_LOCK",
    RESOURCE_RELEASE: "RESOURCE_RELEASE",
    PROCESS_RESTART: "PROCESS_RESTART",
    HEARTBEAT: "HEARTBEAT",
    CUSTOM: "CUSTOM"
});

const CONFIG = {
    capacity: 60,
    deliveriesPerTick: 2,
    deliveryDelayTicks: 2,
    historyLimit: 250,
    heartbeatChance: 0.02
};

let nextMessageId = 1;
let tickNumber = 0;
let deliveredTotal = 0;
let droppedTotal = 0;
let lastTickDelivered = 0;
let totalDeliveryLatency = 0;
let latencySamples = 0;

const droppedHistory = [];
const handlers = new Map();

function emit(actor, title, detail, concept = "Message Passing") {
    generateEvent(
        "IPC",
        actor,
        title,
        detail,
        concept
    );
}

function ensureIPCState() {
    state.ipc ??= {};
    state.ipc.queue ??= [];
    state.ipc.delivered ??= [];
    state.ipc.queuePaused ??= false;
    state.ipc.messagesPerSecond ??= 0;

    state.statistics ??= {};
    state.statistics.ipcMessages ??= 0;
}

function copyMessage(message) {
    return {
        ...message,
        payload: { ...(message.payload || {}) }
    };
}

function boundedPush(array, value) {
    array.push(value);

    if (array.length > CONFIG.historyLimit) {
        array.splice(
            0,
            array.length - CONFIG.historyLimit
        );
    }
}

function recordDrop(message, reason) {
    message.status = "DROPPED";
    message.dropReason = reason;
    message.droppedAt = state.simulationTime;

    droppedTotal++;
    boundedPush(droppedHistory, message);

    emit(
        message.sender,
        `${message.id} dropped`,
        reason,
        "IPC Backpressure"
    );
}

export function sendMessage({
    sender,
    receiver,
    type = IPC_TYPES.CUSTOM,
    payload = {}
} = {}) {
    ensureIPCState();

    sender = String(sender ?? "").trim();
    receiver = String(receiver ?? "").trim();

    if (!sender || !receiver) {
        throw new Error(
            "IPC messages require a sender and receiver."
        );
    }

    const message = {
        id: `MSG-${String(nextMessageId++).padStart(5, "0")}`,
        sender,
        receiver,
        type: String(type),
        payload: payload && typeof payload === "object"
            ? { ...payload }
            : { value: payload },
        status: "QUEUED",
        queuedAt: state.simulationTime,
        queuedTick: tickNumber,
        deliveredAt: null,
        deliveredTick: null,
        dropReason: null
    };

    // Retain existing TrafficOS meaning:
    // ipcMessages counts accepted messages.
    if (state.ipc.queue.length >= CONFIG.capacity) {
        recordDrop(
            message,
            `Queue full (${CONFIG.capacity} messages).`
        );
        return message;
    }

    state.ipc.queue.push(message);
    state.statistics.ipcMessages++;

    emit(
        sender,
        `${message.id}: ${sender} → ${receiver}`,
        `${message.type} queued for delivery.`,
        "Inter Process Communication"
    );

    return message;
}

/*
 * Optional integration hook:
 * Other TrafficOS modules can register a receiver.
 * Handlers run when a message is DELIVERED, not sent.
 *
 * Example:
 * registerIPCHandler("P01", message => {
 *     if (message.type === IPC_TYPES.PREPARE_SIGNAL) {
 *         // Apply an actual traffic-control action here.
 *     }
 * });
 */
export function registerIPCHandler(receiver, callback) {
    if (typeof callback !== "function") {
        throw new TypeError("IPC handler must be a function.");
    }

    const key = String(receiver);
    const set = handlers.get(key) || new Set();

    set.add(callback);
    handlers.set(key, set);

    return () => {
        set.delete(callback);
        if (!set.size) handlers.delete(key);
    };
}

function notifyReceiver(message) {
    const listeners = [
        ...(handlers.get(message.receiver) || []),
        ...(handlers.get("*") || [])
    ];

    for (const listener of listeners) {
        try {
            listener(copyMessage(message));
        } catch (error) {
            emit(
                message.receiver,
                `Receiver handler failed for ${message.id}`,
                String(error.message || error),
                "IPC Error Handling"
            );
        }
    }
}

function deliverMessage(message) {
    message.status = "DELIVERED";
    message.deliveredAt = state.simulationTime;
    message.deliveredTick = tickNumber;

    const latency = Math.max(
        0,
        tickNumber - (message.queuedTick ?? tickNumber)
    );

    totalDeliveryLatency += latency;
    latencySamples++;
    deliveredTotal++;

    boundedPush(state.ipc.delivered, message);

    notifyReceiver(message);

    emit(
        message.receiver,
        `${message.id} delivered`,
        `${message.type} from ${message.sender}; latency ${latency} ticks.`,
        "Message Passing"
    );
}

export function processIPCQueue() {
    ensureIPCState();

    if (state.ipc.queuePaused) {
        lastTickDelivered = 0;
        return 0;
    }

    let count = 0;

    while (
        state.ipc.queue.length &&
        count < CONFIG.deliveriesPerTick
    ) {
        const message = state.ipc.queue[0];

        // Compatibility with older queued messages.
        message.queuedTick ??= tickNumber;

        const age = tickNumber - message.queuedTick;

        if (age < CONFIG.deliveryDelayTicks) {
            break;
        }

        state.ipc.queue.shift();
        deliverMessage(message);
        count++;
    }

    lastTickDelivered = count;
    return count;
}

export function pauseQueue() {
    ensureIPCState();
    if (state.ipc.queuePaused) return;

    state.ipc.queuePaused = true;

    emit(
        "IPC Manager",
        "Message delivery paused",
        "New messages can queue, but consumers cannot receive them.",
        "Producer / Consumer"
    );
}

export function resumeQueue() {
    ensureIPCState();
    if (!state.ipc.queuePaused) return;

    state.ipc.queuePaused = false;

    emit(
        "IPC Manager",
        "Message delivery resumed",
        "Queued messages can now be consumed.",
        "Producer / Consumer"
    );
}

export function clearQueue() {
    ensureIPCState();

    const pending = state.ipc.queue.splice(0);

    for (const message of pending) {
        recordDrop(message, "Queue manually flushed.");
    }

    emit(
        "IPC Manager",
        `${pending.length} pending messages cleared`,
        "Only queued messages were removed; delivered history was retained.",
        "Queue Management"
    );

    return pending.length;
}

export function generateHeartbeats() {
    const services = [
        "P01", "P02", "P03",
        "P04", "P05", "P06"
    ];

    for (const receiver of services) {
        if (Math.random() < CONFIG.heartbeatChance) {
            sendMessage({
                sender: "P08",
                receiver,
                type: IPC_TYPES.HEARTBEAT
            });
        }
    }
}

export function startEmergencyIPC() {
    const chain = [
        ["P07", "P01", IPC_TYPES.AMBULANCE_APPROACHING],
        ["P01", "P02", IPC_TYPES.REQUEST_GREEN_CORRIDOR],
        ["P02", "P03", IPC_TYPES.PREPARE_SIGNAL],
        ["P03", "P04", IPC_TYPES.PREPARE_SIGNAL]
    ];

    const messages = chain.map(
        ([sender, receiver, type]) =>
            sendMessage({
                sender,
                receiver,
                type,
                payload: { emergency: true }
            })
    );

    emit(
        "P07",
        "Emergency communication chain queued",
        `${messages.length} messages created.`,
        "Emergency IPC"
    );

    return messages;
}

export function createIPCStorm() {
    const services = [
        "P01", "P02", "P03", "P04",
        "P05", "P06", "P08"
    ];

    const messages = [];

    for (let i = 0; i < 50; i++) {
        const sender = services[
            Math.floor(Math.random() * services.length)
        ];

        const possibleReceivers = services.filter(
            pid => pid !== sender
        );

        const receiver = possibleReceivers[
            Math.floor(
                Math.random() * possibleReceivers.length
            )
        ];

        messages.push(sendMessage({
            sender,
            receiver,
            type: IPC_TYPES.TRAFFIC_UPDATE,
            payload: { storm: true, sequence: i + 1 }
        }));
    }

    emit(
        "IPC Manager",
        "IPC storm generated",
        `${messages.length} messages attempted.`,
        "Queue Capacity / Backpressure"
    );

    return messages;
}

export function sendCustomMessage(sender, receiver, text) {
    return sendMessage({
        sender,
        receiver,
        type: IPC_TYPES.CUSTOM,
        payload: { text: String(text ?? "") }
    });
}

export function getIPCStatistics() {
    ensureIPCState();

    return {
        queued: state.ipc.queue.length,
        delivered: state.ipc.delivered.length,
        deliveredTotal,
        dropped: droppedTotal,
        throughput: lastTickDelivered,
        paused: state.ipc.queuePaused,
        capacity: CONFIG.capacity,
        averageLatency: latencySamples
            ? totalDeliveryLatency / latencySamples
            : 0
    };
}

export function getIPCSnapshot() {
    ensureIPCState();

    return {
        queue: state.ipc.queue.map(copyMessage),
        delivered: state.ipc.delivered.map(copyMessage),
        dropped: droppedHistory.map(copyMessage),
        stats: getIPCStatistics(),
        tick: tickNumber
    };
}

export function ipcTick() {
    ensureIPCState();

    tickNumber++;

    const delivered = processIPCQueue();

    generateHeartbeats();

    // Correctly labeled: delivered per IPC tick,
    // NOT messages per real-world second.
    state.ipc.messagesPerSecond = delivered;
}

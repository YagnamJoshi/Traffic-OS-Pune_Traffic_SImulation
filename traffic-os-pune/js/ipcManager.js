/*******************************************************************
 * TrafficOS Pune
 * ipcManager.js
 *
 * Inter Process Communication Engine
 *
 * Concepts:
 * - Message Passing
 * - Message Queue
 * - IPC Throughput
 * - Queue Management
 * - Delivery Status
 * - Producer/Consumer
 * - Emergency Communication
 * - IPC Storm
 *******************************************************************/

import {
    state,
    generateEvent
} from "./state.js";

/*******************************************************************
 * MESSAGE TYPES
 *******************************************************************/

export const IPC_TYPES = {

    AMBULANCE_APPROACHING:
        "AMBULANCE_APPROACHING",

    REQUEST_GREEN_CORRIDOR:
        "REQUEST_GREEN_CORRIDOR",

    PREPARE_SIGNAL:
        "PREPARE_SIGNAL",

    SIGNAL_UPDATED:
        "SIGNAL_UPDATED",

    TRAFFIC_UPDATE:
        "TRAFFIC_UPDATE",

    CONGESTION_ALERT:
        "CONGESTION_ALERT",

    DEADLOCK_WARNING:
        "DEADLOCK_WARNING",

    RESOURCE_LOCK:
        "RESOURCE_LOCK",

    RESOURCE_RELEASE:
        "RESOURCE_RELEASE",

    PROCESS_RESTART:
        "PROCESS_RESTART",

    HEARTBEAT:
        "HEARTBEAT",

    CUSTOM:
        "CUSTOM"
};

/*******************************************************************
 * MESSAGE ID GENERATOR
 *******************************************************************/

let messageCounter = 1;

function createMessageId() {

    const id =
        "MSG-" +
        String(messageCounter)
            .padStart(5, "0");

    messageCounter++;

    return id;
}

/*******************************************************************
 * HUMAN READABLE EXPLANATIONS
 *******************************************************************/

function getExplanation(type) {

    switch(type) {

        case IPC_TYPES.AMBULANCE_APPROACHING:

            return "Emergency Service is warning the next junction that an ambulance is approaching.";

        case IPC_TYPES.REQUEST_GREEN_CORRIDOR:

            return "A junction is asking another junction to prepare a green signal path.";

        case IPC_TYPES.PREPARE_SIGNAL:

            return "A signal controller is preparing signal timings.";

        case IPC_TYPES.CONGESTION_ALERT:

            return "Traffic congestion has exceeded safe thresholds.";

        case IPC_TYPES.DEADLOCK_WARNING:

            return "The system suspects a circular dependency.";

        case IPC_TYPES.PROCESS_RESTART:

            return "Fault Manager is notifying services of recovery.";

        default:

            return "Processes are exchanging information.";
    }
}

/*******************************************************************
 * SEND MESSAGE
 *******************************************************************/

export function sendMessage({

    sender,

    receiver,

    type,

    payload = {}

}) {

    const message = {

        id: createMessageId(),

        sender,

        receiver,

        type,

        payload,

        status: "QUEUED",

        queuedAt:
            state.simulationTime,

        deliveredAt: null
    };

    state.ipc.queue.push(message);

    state.statistics.ipcMessages++;

    generateEvent(
        "IPC",
        sender,
        `${sender} → ${receiver} : ${type}`,
        getExplanation(type),
        "Inter Process Communication"
    );

    return message;
}

/*******************************************************************
 * DELIVER MESSAGE
 *******************************************************************/

function deliverMessage(message) {

    message.status = "DELIVERED";

    message.deliveredAt =
        state.simulationTime;

    state.ipc.delivered.push(
        message
    );

    onMessageReceived(message);

    generateEvent(
        "IPC",
        message.receiver,
        `Message delivered (${message.type})`,
        getExplanation(
            message.type
        ),
        "Message Passing"
    );
}

/*******************************************************************
 * RECEIVE CALLBACKS
 *******************************************************************/

function onMessageReceived(message) {

    switch (
        message.type
    ) {

        case IPC_TYPES.AMBULANCE_APPROACHING:

            generateEvent(
                "EMERGENCY",
                message.receiver,
                "Junction notified of incoming ambulance",
                "Emergency vehicle approaching.",
                "Priority Coordination"
            );

            break;

        case IPC_TYPES.REQUEST_GREEN_CORRIDOR:

            generateEvent(
                "TRAFFIC",
                message.receiver,
                "Green corridor request accepted",
                "Preparing signal coordination.",
                "IPC + Traffic Control"
            );

            break;

        case IPC_TYPES.CONGESTION_ALERT:

            generateEvent(
                "TRAFFIC",
                message.receiver,
                "Congestion warning received",
                "Route optimization may occur.",
                "Traffic Flow Management"
            );

            break;

        case IPC_TYPES.DEADLOCK_WARNING:

            generateEvent(
                "SYSTEM",
                message.receiver,
                "Deadlock notification received",
                "Monitoring resource dependency cycle.",
                "Deadlock Detection"
            );

            break;
    }
}

/*******************************************************************
 * PROCESS QUEUE
 *******************************************************************/

export function processIPCQueue() {

    if (
        state.ipc.queuePaused
    ) {
        return;
    }

    const maxDeliveries = 5;

    let deliveredCount = 0;

    while (

        state.ipc.queue.length > 0 &&
        deliveredCount <
        maxDeliveries

    ) {

        const msg =
            state.ipc.queue.shift();

        deliverMessage(msg);

        deliveredCount++;
    }
}

/*******************************************************************
 * PAUSE QUEUE
 *******************************************************************/

export function pauseQueue() {

    state.ipc.queuePaused = true;

    generateEvent(
        "IPC",
        "IPC Manager",
        "Message delivery paused",
        "Messages will remain queued.",
        "Queue Synchronization"
    );
}

/*******************************************************************
 * RESUME QUEUE
 *******************************************************************/

export function resumeQueue() {

    state.ipc.queuePaused = false;

    generateEvent(
        "IPC",
        "IPC Manager",
        "Message delivery resumed",
        "Queued messages can now be delivered.",
        "Queue Synchronization"
    );
}

/*******************************************************************
 * CLEAR QUEUE
 *******************************************************************/

export function clearQueue() {

    const count =
        state.ipc.queue.length;

    state.ipc.queue = [];

    generateEvent(
        "IPC",
        "IPC Manager",
        `${count} queued messages cleared`,
        "Queue flushed manually.",
        "Queue Management"
    );
}

/*******************************************************************
 * HEARTBEATS
 *******************************************************************/

export function generateHeartbeats() {

    const monitoring =
        "P08";

    const services = [

        "P01",
        "P02",
        "P03",
        "P04",
        "P05",
        "P06"
    ];

    services.forEach(service => {

        if (
            Math.random() < 0.02
        ) {

            sendMessage({

                sender:
                    monitoring,

                receiver:
                    service,

                type:
                    IPC_TYPES.HEARTBEAT
            });
        }

    });

}

/*******************************************************************
 * EMERGENCY SEQUENCE
 *******************************************************************/

export function startEmergencyIPC() {

    sendMessage({

        sender: "P07",

        receiver: "P01",

        type:
            IPC_TYPES.AMBULANCE_APPROACHING
    });

    sendMessage({

        sender: "P01",

        receiver: "P02",

        type:
            IPC_TYPES.REQUEST_GREEN_CORRIDOR
    });

    sendMessage({

        sender: "P02",

        receiver: "P03",

        type:
            IPC_TYPES.PREPARE_SIGNAL
    });

    sendMessage({

        sender: "P03",

        receiver: "P04",

        type:
            IPC_TYPES.PREPARE_SIGNAL
    });

    generateEvent(
        "EMERGENCY",
        "P07",
        "Green Corridor Message Chain Started",
        "Multiple junctions have been informed.",
        "Emergency Response"
    );
}

/*******************************************************************
 * IPC STORM SCENARIO
 *******************************************************************/

export function createIPCStorm() {

    const processes = [

        "P01",
        "P02",
        "P03",
        "P04",
        "P05",
        "P06",
        "P08"
    ];

    for (
        let i = 0;
        i < 50;
        i++
    ) {

        const sender =
            processes[
                Math.floor(
                    Math.random() *
                    processes.length
                )
            ];

        const receiver =
            processes[
                Math.floor(
                    Math.random() *
                    processes.length
                )
            ];

        if (
            sender === receiver
        ) continue;

        sendMessage({

            sender,

            receiver,

            type:
                IPC_TYPES.TRAFFIC_UPDATE
        });
    }

    generateEvent(
        "SCENARIO",
        "IPC",
        "IPC Storm Started",
        "Many processes are communicating simultaneously.",
        "IPC Throughput"
    );
}

/*******************************************************************
 * CUSTOM MESSAGE
 *******************************************************************/

export function sendCustomMessage(

    sender,
    receiver,
    text

) {

    sendMessage({

        sender,

        receiver,

        type:
            IPC_TYPES.CUSTOM,

        payload: {

            text
        }
    });
}

/*******************************************************************
 * IPC ANALYTICS
 *******************************************************************/

export function getIPCStatistics() {

    return {

        queued:
            state.ipc.queue.length,

        delivered:
            state.ipc.delivered.length,

        throughput:
            state.statistics
                .ipcMessages,

        paused:
            state.ipc.queuePaused
    };
}

/*******************************************************************
 * IPC TICK
 *******************************************************************/

export function ipcTick() {

    processIPCQueue();

    generateHeartbeats();

    state.ipc.messagesPerSecond =
        state.ipc.delivered.length;
}
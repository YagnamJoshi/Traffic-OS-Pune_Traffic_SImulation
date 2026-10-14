
import { state } from "./state.js";

import {
    IPC_TYPES,
    sendMessage,
    pauseQueue,
    resumeQueue,
    clearQueue,
    startEmergencyIPC,
    createIPCStorm,
    getIPCSnapshot
} from "./ipcManager.js";

const center = {
    selected: null,
    tab: "queue",
    signature: ""
};

const $ = id => document.getElementById(id);

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function services() {
    const list = Array.isArray(state.processes)
        ? state.processes
        : [];

    return list.map(process => ({
        pid: String(process.pid),
        name: String(process.name || process.pid)
    }));
}

function messageList(snapshot) {
    if (center.tab === "delivered") {
        return snapshot.delivered.slice().reverse();
    }

    if (center.tab === "dropped") {
        return snapshot.dropped.slice().reverse();
    }

    return snapshot.queue;
}

function renderMessages(snapshot) {
    const messages = messageList(snapshot);
    const root = $("ipc2-messages");

    root.innerHTML = messages.length
        ? messages.map(message => `
            <button class="ipc2-message
                ${center.selected === message.id ? "selected" : ""}"
                data-message="${safe(message.id)}"
                type="button">
                <span class="ipc2-message-top">
                    <strong>${safe(message.id)}</strong>
                    <small class="ipc2-status
                        ipc2-${safe(message.status.toLowerCase())}">
                        ${safe(message.status)}
                    </small>
                </span>
                <span class="ipc2-route">
                    ${safe(message.sender)}
                    <b>→</b>
                    ${safe(message.receiver)}
                </span>
                <span class="ipc2-type">
                    ${safe(message.type)}
                </span>
            </button>
        `).join("")
        : `<p class="ipc2-empty">
            No ${safe(center.tab)} messages.
           </p>`;
}

function renderInspector(snapshot) {
    const root = $("ipc2-inspector");

    const all = [
        ...snapshot.queue,
        ...snapshot.delivered,
        ...snapshot.dropped
    ];

    const message = all.find(
        item => item.id === center.selected
    );

    if (!message) {
        root.innerHTML = `
            <p class="ipc2-empty">
                Select a message to inspect its payload,
                status and delivery information.
            </p>
        `;
        return;
    }

    root.innerHTML = `
        <div class="ipc2-inspector-head">
            <h3>${safe(message.id)}</h3>
            <span class="ipc2-status
                ipc2-${safe(message.status.toLowerCase())}">
                ${safe(message.status)}
            </span>
        </div>

        <div class="ipc2-inspector-grid">
            <div><small>Sender</small>
                <strong>${safe(message.sender)}</strong></div>
            <div><small>Receiver</small>
                <strong>${safe(message.receiver)}</strong></div>
            <div><small>Type</small>
                <strong>${safe(message.type)}</strong></div>
            <div><small>Queued Tick</small>
                <strong>${safe(message.queuedTick)}</strong></div>
            <div><small>Delivered Tick</small>
                <strong>${safe(message.deliveredTick ?? "—")}</strong></div>
            <div><small>Latency</small>
                <strong>${message.deliveredTick == null
                    ? "—"
                    : message.deliveredTick - message.queuedTick
                } ticks</strong></div>
        </div>

        <h4>Payload</h4>
        <pre>${safe(JSON.stringify(message.payload, null, 2))}</pre>

        ${message.dropReason
            ? `<p class="ipc2-error">
                ${safe(message.dropReason)}
               </p>`
            : ""}
    `;
}

function renderStats(snapshot) {
    const stats = snapshot.stats;

    $("ipc2-queued").textContent = stats.queued;
    $("ipc2-delivered").textContent = stats.deliveredTotal;
    $("ipc2-dropped").textContent = stats.dropped;
    $("ipc2-rate").textContent = stats.throughput;
    $("ipc2-latency").textContent =
        `${stats.averageLatency.toFixed(1)} ticks`;

    $("ipc2-capacity").textContent =
        `${stats.queued} / ${stats.capacity}`;

    $("ipc2-capacity-bar").style.width =
        `${Math.min(100,
            stats.queued / stats.capacity * 100)}%`;

    $("ipc2-mode").textContent =
        stats.paused ? "PAUSED" : "DELIVERING";

    $("ipc2-pause").textContent =
        stats.paused ? "Resume Delivery" : "Pause Delivery";
}

function renderPipeline(snapshot) {
    const first = snapshot.queue[0];

    $("ipc2-producer").textContent =
        first?.sender || "—";

    $("ipc2-consumer").textContent =
        first?.receiver || "—";

    $("ipc2-next").textContent =
        first?.type || "Queue empty";

    $("ipc2-pending").textContent =
        `${snapshot.queue.length} pending`;
}

function render() {
    const root = $("ipcCenter");
    if (!root) return;

    const snapshot = getIPCSnapshot();

    const signature = JSON.stringify({
        snapshot,
        selected: center.selected,
        tab: center.tab
    });

    if (signature === center.signature) return;
    center.signature = signature;

    renderStats(snapshot);
    renderPipeline(snapshot);
    renderMessages(snapshot);
    renderInspector(snapshot);

    root.querySelectorAll("[data-tab]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.tab === center.tab
        );
    });
}

function notice(text, error = false) {
    const target = $("ipc2-notice");
    target.textContent = text;
    target.classList.toggle("error", error);
}

function initialize() {
    const page = $("page-ipc");
    if (!page || $("ipcCenter")) return;

    // Full visual redo: preserve original markup in the DOM
    // for compatibility, but hide it.
    [...page.children].forEach(child => {
        child.hidden = true;
    });

    const root = document.createElement("div");
    root.id = "ipcCenter";

    root.innerHTML = `
        <div class="ipc2-hero">
            <div>
                <span class="ipc2-eyebrow">
                    TRAFFICOS / INTER-PROCESS COMMUNICATION
                </span>
                <h2>IPC Communication Center</h2>
                <p>
                    Send messages, observe the FIFO queue,
                    control delivery and investigate failures.
                </p>
            </div>
            <span id="ipc2-mode" class="ipc2-mode">
                DELIVERING
            </span>
        </div>

        <div class="ipc2-stats">
            <div><span>Queued</span>
                <strong id="ipc2-queued">0</strong></div>
            <div><span>Delivered</span>
                <strong id="ipc2-delivered">0</strong></div>
            <div><span>Dropped</span>
                <strong id="ipc2-dropped">0</strong></div>
            <div><span>Delivered / Tick</span>
                <strong id="ipc2-rate">0</strong></div>
        </div>

        <div class="ipc2-panel">
            <div class="ipc2-panel-heading">
                <h3>Message Passing Pipeline</h3>
                <span>Producer → Queue → Consumer</span>
            </div>

            <div class="ipc2-pipeline">
                <div>
                    <small>PRODUCER</small>
                    <strong id="ipc2-producer">—</strong>
                    <span>Sender process</span>
                </div>

                <b class="ipc2-arrow">→</b>

                <div class="ipc2-pipeline-queue">
                    <small>FIFO MESSAGE QUEUE</small>
                    <strong id="ipc2-pending">0 pending</strong>
                    <span id="ipc2-next">Queue empty</span>
                </div>

                <b class="ipc2-arrow">→</b>

                <div>
                    <small>CONSUMER</small>
                    <strong id="ipc2-consumer">—</strong>
                    <span>Receiver process</span>
                </div>
            </div>

            <div class="ipc2-capacity-label">
                <span>Queue Capacity</span>
                <strong id="ipc2-capacity">0 / 60</strong>
            </div>
            <div class="ipc2-capacity-track">
                <div id="ipc2-capacity-bar"></div>
            </div>
        </div>

        <div class="ipc2-columns">
            <div class="ipc2-panel">
                <h3>Compose Message</h3>

                <form id="ipc2-compose" class="ipc2-form">
                    <label>
                        Sender
                        <select id="ipc2-sender" required></select>
                    </label>

                    <label>
                        Receiver
                        <select id="ipc2-receiver" required></select>
                    </label>

                    <label>
                        Message Type
                        <select id="ipc2-type"></select>
                    </label>

                    <label>
                        Message Text
                        <textarea id="ipc2-text" rows="3"
                            placeholder="Enter a message..."></textarea>
                    </label>

                    <button type="submit" class="ipc2-primary">
                        Send Message
                    </button>
                </form>

                <p id="ipc2-notice" class="ipc2-notice"
                    role="status" aria-live="polite"></p>
            </div>

            <div class="ipc2-panel">
                <h3>Queue Operations</h3>

                <div class="ipc2-actions">
                    <button id="ipc2-pause" type="button">
                        Pause Delivery
                    </button>

                    <button id="ipc2-clear" type="button">
                        Clear Pending Queue
                    </button>
                </div>

                <h3>Simulation Scenarios</h3>

                <div class="ipc2-actions">
                    <button id="ipc2-emergency" type="button">
                        Emergency Message Chain
                    </button>

                    <button id="ipc2-storm" type="button">
                        Generate IPC Storm
                    </button>
                </div>

                <div class="ipc2-explanation">
                    <strong>Average Delivery Latency</strong>
                    <span id="ipc2-latency">0 ticks</span>
                    <p>
                        Messages are delivered in FIFO order,
                        with a simulated delay and a maximum
                        delivery rate per IPC tick.
                    </p>
                </div>
            </div>
        </div>

        <div class="ipc2-columns">
            <div class="ipc2-panel">
                <div class="ipc2-panel-heading">
                    <h3>Message Explorer</h3>
                    <span>Inspect live IPC traffic</span>
                </div>

                <div class="ipc2-tabs">
                    <button data-tab="queue" class="active">
                        Pending
                    </button>
                    <button data-tab="delivered">
                        Delivered
                    </button>
                    <button data-tab="dropped">
                        Dropped
                    </button>
                </div>

                <div id="ipc2-messages"
                    class="ipc2-message-list"></div>
            </div>

            <div class="ipc2-panel">
                <h3>Message Inspector</h3>
                <div id="ipc2-inspector"></div>
            </div>
        </div>

        <div class="ipc2-panel ipc2-docs">
            <span class="ipc2-eyebrow">OS CONCEPTS</span>
            <h3>How IPC Works in TrafficOS</h3>

            <div class="ipc2-doc-grid">
                <article>
                    <h4>Message Passing</h4>
                    <p>
                        Processes communicate by sending
                        messages rather than directly
                        accessing another process's data.
                    </p>
                </article>

                <article>
                    <h4>Producer / Consumer</h4>
                    <p>
                        Senders produce messages.
                        The queue buffers them until
                        the receiver-side delivery stage.
                    </p>
                </article>

                <article>
                    <h4>FIFO Queue</h4>
                    <p>
                        Messages leave the queue in the
                        order they were accepted.
                    </p>
                </article>

                <article>
                    <h4>Backpressure</h4>
                    <p>
                        When producers outpace consumers,
                        the queue fills. New messages
                        are dropped at capacity.
                    </p>
                </article>

                <article>
                    <h4>Delivery Latency</h4>
                    <p>
                        The number of simulated IPC ticks
                        between queueing and delivery.
                    </p>
                </article>

                <article>
                    <h4>Emergency Communication</h4>
                    <p>
                        Emergency services notify junction
                        controllers through a sequence
                        of typed IPC messages.
                    </p>
                </article>
            </div>
        </div>
    `;

    page.prepend(root);

    const available = services();

    const options = available.map(service => `
        <option value="${safe(service.pid)}">
            ${safe(service.pid)} — ${safe(service.name)}
        </option>
    `).join("");

    $("ipc2-sender").innerHTML = options;
    $("ipc2-receiver").innerHTML = options;

    $("ipc2-receiver").selectedIndex =
        available.length > 1 ? 1 : 0;

    $("ipc2-type").innerHTML =
        Object.values(IPC_TYPES).map(type => `
            <option value="${safe(type)}">${safe(type)}</option>
        `).join("");

    $("ipc2-type").value = IPC_TYPES.CUSTOM;

    $("ipc2-compose").addEventListener("submit", event => {
        event.preventDefault();

        const sender = $("ipc2-sender").value;
        const receiver = $("ipc2-receiver").value;
        const type = $("ipc2-type").value;
        const text = $("ipc2-text").value.trim();

        if (!sender || !receiver) {
            notice("Select valid processes.", true);
            return;
        }

        if (sender === receiver) {
            notice("Choose different sender and receiver processes.", true);
            return;
        }

        const message = sendMessage({
            sender,
            receiver,
            type,
            payload: { text }
        });

        center.selected = message.id;

        notice(
            message.status === "DROPPED"
                ? `${message.id} dropped: queue is full.`
                : `${message.id} accepted into the queue.`,
            message.status === "DROPPED"
        );

        render();
    });

    $("ipc2-pause").addEventListener("click", () => {
        if (getIPCSnapshot().stats.paused) {
            resumeQueue();
        } else {
            pauseQueue();
        }
        render();
    });

    $("ipc2-clear").addEventListener("click", () => {
        const count = clearQueue();
        notice(`${count} queued messages cleared.`);
        render();
    });

    $("ipc2-emergency").addEventListener("click", () => {
        startEmergencyIPC();
        notice("Emergency message chain queued.");
        render();
    });

    $("ipc2-storm").addEventListener("click", () => {
        const messages = createIPCStorm();
        const dropped = messages.filter(
            m => m.status === "DROPPED"
        ).length;

        notice(
            `${messages.length} messages attempted; ${dropped} dropped.`
        );
        render();
    });

    root.addEventListener("click", event => {
        const tab = event.target.closest("[data-tab]");

        if (tab) {
            center.tab = tab.dataset.tab;
            render();
            return;
        }

        const message = event.target.closest("[data-message]");

        if (message) {
            center.selected = message.dataset.message;
            render();
        }
    });

    render();

    setInterval(() => {
        if (page.classList.contains("active")) render();
    }, 250);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        { once: true }
    );
} else {
    initialize();
}

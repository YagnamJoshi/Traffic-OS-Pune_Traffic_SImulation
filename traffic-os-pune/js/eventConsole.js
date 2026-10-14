
/* ======================================================
   TrafficOS — Event Observability Console
   File: js/eventConsole.js
   ====================================================== */

import { state } from "./state.js";

const $ = id => document.getElementById(id);

const view = {
    live: true,
    snapshot: [],
    query: "",
    type: "ALL",
    severity: "ALL",
    selected: null,
    bookmarks: new Set(),
    limit: 100,
    signature: "",
    session: 0
};

const escapeHTML = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function severityOf(event) {
    const type = String(event.type || "").toUpperCase();
    const text = [
        event.message,
        event.explanation,
        event.concept
    ].join(" ").toLowerCase();

    if (
        /deadlock detected|circular wait|critical failure|fatal|crash/.test(text)
    ) return "CRITICAL";

    if (
        /failed|failure|denied|dropped|warning|congestion|fault|emergency|rollback/.test(text)
    ) return "WARNING";

    if (
        /recovered|resolved|completed|successful|delivered|acquired|released|created|started/.test(text)
    ) return "SUCCESS";

    if (type === "ERROR") return "WARNING";

    return "INFO";
}

function allEvents() {
    return view.live ? state.events : view.snapshot;
}

function indexedEvents() {
    return allEvents().map((event, index) => ({
        event,
        index,
        key: `${view.session}:${index}`
    }));
}

function filteredEvents() {
    const query = view.query.trim().toLowerCase();

    return indexedEvents().filter(({ event }) => {
        if (
            view.type !== "ALL" &&
            String(event.type) !== view.type
        ) return false;

        if (
            view.severity !== "ALL" &&
            severityOf(event) !== view.severity
        ) return false;

        if (!query) return true;

        return [
            event.id,
            event.timestamp,
            event.type,
            event.source,
            event.message,
            event.explanation,
            event.concept
        ].some(value =>
            String(value ?? "").toLowerCase().includes(query)
        );
    });
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function renderStats(events) {
    const severityCounts = {
        CRITICAL: 0,
        WARNING: 0,
        SUCCESS: 0,
        INFO: 0
    };

    events.forEach(event => {
        severityCounts[severityOf(event)]++;
    });

    setText("ev-total", events.length);
    setText("ev-critical", severityCounts.CRITICAL);
    setText("ev-warning", severityCounts.WARNING);
    setText("ev-success", severityCounts.SUCCESS);
    setText("ev-matching", filteredEvents().length);

    setText(
        "ev-stream-status",
        view.live ? "LIVE VIEW" : "VIEW FROZEN"
    );

    setText(
        "ev-toggle",
        view.live ? "Freeze View" : "Resume Live View"
    );
}

function renderTypes(events) {
    const select = $("ev-type");
    const current = view.type;

    const types = [...new Set(
        events.map(event => String(event.type || "UNKNOWN"))
    )].sort();

    select.innerHTML = `
        <option value="ALL">All categories</option>
        ${types.map(type => `
            <option value="${escapeHTML(type)}">
                ${escapeHTML(type)}
            </option>
        `).join("")}
    `;

    if (types.includes(current)) {
        select.value = current;
    } else {
        view.type = "ALL";
        select.value = "ALL";
    }
}

function renderFrequency(events) {
    const root = $("ev-frequency");
    const counts = new Map();

    events.forEach(event => {
        const type = String(event.type || "UNKNOWN");
        counts.set(type, (counts.get(type) || 0) + 1);
    });

    const entries = [...counts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const maximum = Math.max(1, ...entries.map(e => e[1]));

    root.innerHTML = entries.length
        ? entries.map(([type, count]) => `
            <div class="ev-bar-row">
                <span title="${escapeHTML(type)}">
                    ${escapeHTML(type)}
                </span>
                <div class="ev-bar-track">
                    <div style="width:${count / maximum * 100}%"></div>
                </div>
                <strong>${count}</strong>
            </div>
        `).join("")
        : `<p class="ev-empty">No events recorded yet.</p>`;
}

function renderStream() {
    const matches = filteredEvents();
    const visible = matches.slice(-view.limit).reverse();
    const root = $("ev-stream");

    setText(
        "ev-showing",
        `Showing ${visible.length} of ${matches.length} matching events`
    );

    root.innerHTML = visible.length
        ? visible.map(({ event, key }) => {
            const severity = severityOf(event);
            const bookmarked = view.bookmarks.has(key);

            return `
                <div class="ev-event
                    ${view.selected === key ? "selected" : ""}">
                    <button type="button"
                            class="ev-open"
                            data-event-key="${key}">
                        <span class="ev-event-top">
                            <small>${escapeHTML(event.timestamp)}</small>
                            <span class="ev-severity ev-${severity.toLowerCase()}">
                                ${severity}
                            </span>
                        </span>
                        <strong>${escapeHTML(event.message)}</strong>
                        <span class="ev-event-bottom">
                            <span>${escapeHTML(event.type)}</span>
                            <span>${escapeHTML(event.source)}</span>
                        </span>
                    </button>
                    <button type="button"
                            class="ev-bookmark ${bookmarked ? "active" : ""}"
                            data-bookmark="${key}"
                            title="Bookmark event"
                            aria-label="${bookmarked ? "Remove bookmark" : "Bookmark event"}">
                        ${bookmarked ? "★" : "☆"}
                    </button>
                </div>
            `;
        }).join("")
        : `<p class="ev-empty">
            No events match the current filters.
           </p>`;
}

function selectedEntry() {
    return indexedEvents().find(
        entry => entry.key === view.selected
    );
}

function renderInspector() {
    const root = $("ev-inspector");
    const entry = selectedEntry();

    if (!entry) {
        root.innerHTML = `
            <p class="ev-empty">
                Select an event to inspect its source,
                explanation and related OS concept.
            </p>
        `;
        return;
    }

    const event = entry.event;
    const severity = severityOf(event);

    root.innerHTML = `
        <div class="ev-inspector-head">
            <strong>${escapeHTML(event.type)}</strong>
            <span class="ev-severity ev-${severity.toLowerCase()}">
                ${severity}
            </span>
        </div>

        <h3>${escapeHTML(event.message)}</h3>

        <div class="ev-details">
            <div><small>Simulation Time</small>
                <strong>${escapeHTML(event.timestamp)}</strong></div>
            <div><small>Source</small>
                <strong>${escapeHTML(event.source)}</strong></div>
            <div><small>Event ID</small>
                <strong>${escapeHTML(event.id)}</strong></div>
            <div><small>Event Category</small>
                <strong>${escapeHTML(event.type)}</strong></div>
        </div>

        <h4>Explanation</h4>
        <p>${escapeHTML(event.explanation || "No explanation recorded.")}</p>

        <h4>Related OS Concept</h4>
        <p>${escapeHTML(event.concept || "Not specified.")}</p>

        <p class="ev-severity-note">
            Severity is inferred from event text,
            not supplied by the event engine.
        </p>
    `;
}

function renderBookmarks() {
    const root = $("ev-bookmarks");

    const entries = indexedEvents()
        .filter(entry => view.bookmarks.has(entry.key))
        .reverse();

    root.innerHTML = entries.length
        ? entries.map(({ event, key }) => `
            <button type="button"
                    class="ev-bookmarked-item"
                    data-event-key="${key}">
                <strong>${escapeHTML(event.message)}</strong>
                <small>${escapeHTML(event.timestamp)}
                    · ${escapeHTML(event.type)}</small>
            </button>
        `).join("")
        : `<p class="ev-empty">
            Bookmark important events using the star beside each entry.
           </p>`;
}

function render() {
    const page = $("page-events");

    if (!page || !page.classList.contains("active")) return;

    const events = allEvents();

    // The event array can be replaced during reset/load.
    // The signature checks both the array content and UI state.
    const signature = JSON.stringify({
        events,
        live: view.live,
        query: view.query,
        type: view.type,
        severity: view.severity,
        selected: view.selected,
        bookmarks: [...view.bookmarks],
        limit: view.limit,
        session: view.session
    });

    if (signature === view.signature) return;

    view.signature = signature;

    renderTypes(events);
    renderStats(events);
    renderFrequency(events);
    renderStream();
    renderInspector();
    renderBookmarks();
}

function downloadFile(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportEvents(format) {
    const events = filteredEvents().map(({ event }) => ({
        id: event.id,
        timestamp: event.timestamp,
        type: event.type,
        source: event.source,
        message: event.message,
        explanation: event.explanation,
        concept: event.concept,
        inferredSeverity: severityOf(event)
    }));

    if (format === "json") {
        downloadFile(
            "trafficos-events.json",
            JSON.stringify(events, null, 2),
            "application/json"
        );
        return;
    }

    const columns = [
        "id", "timestamp", "type", "source",
        "message", "explanation", "concept",
        "inferredSeverity"
    ];

    const csvCell = value => {
        const text = String(value ?? "");

        // Prevent spreadsheet formula execution on import.
        const safe = /^[\s]*[=+\-@\t\r]/.test(text)
            ? "'" + text
            : text;

        return `"${safe.replaceAll('"', '""')}"`;
    };

    const csv = [
        columns.join(","),
        ...events.map(event =>
            columns.map(column => csvCell(event[column])).join(",")
        )
    ].join("\r\n");

    downloadFile(
        "trafficos-events.csv",
        "\uFEFF" + csv,
        "text/csv;charset=utf-8"
    );
}

function initialize() {
    const page = $("page-events");

    if (!page || $("eventConsole")) return;

    // Preserve the old table for compatibility with ui.js.
    [...page.children].forEach(child => {
        child.hidden = true;
    });

    const root = document.createElement("div");
    root.id = "eventConsole";

    root.innerHTML = `
        <div class="ev-hero">
            <div>
                <span class="ev-eyebrow">
                    TRAFFICOS / SYSTEM OBSERVABILITY
                </span>
                <h2>Event Log Console</h2>
                <p>
                    Investigate real simulation activity across
                    scheduling, memory, IPC, traffic and deadlocks.
                </p>
            </div>
            <span id="ev-stream-status" class="ev-live">
                LIVE VIEW
            </span>
        </div>

        <div class="ev-stats">
            <div><span>Total Events</span>
                <strong id="ev-total">0</strong></div>
            <div><span>Critical (inferred)</span>
                <strong id="ev-critical">0</strong></div>
            <div><span>Warnings (inferred)</span>
                <strong id="ev-warning">0</strong></div>
            <div><span>Success (inferred)</span>
                <strong id="ev-success">0</strong></div>
        </div>

        <div class="ev-panel">
            <div class="ev-heading">
                <h3>Investigation Tools</h3>
                <span>
                    <b id="ev-matching">0</b> matching events
                </span>
            </div>

            <div class="ev-filters">
                <input id="ev-search" type="search"
                    placeholder="Search messages, sources, concepts...">

                <select id="ev-type">
                    <option value="ALL">All categories</option>
                </select>

                <select id="ev-severity">
                    <option value="ALL">All severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="WARNING">Warning</option>
                    <option value="SUCCESS">Success</option>
                    <option value="INFO">Info</option>
                </select>
            </div>

            <div class="ev-toolbar">
                <button id="ev-toggle" type="button">
                    Freeze View
                </button>
                <button id="ev-reset-filters" type="button">
                    Reset Filters
                </button>
                <button id="ev-export-csv" type="button">
                    Export CSV
                </button>
                <button id="ev-export-json" type="button">
                    Export JSON
                </button>
            </div>

            <p class="ev-hint">
                Freezing the view takes a snapshot of the log.
                The simulation continues running.
                Exports include all matching events, not just
                the visible entries.
            </p>
        </div>

        <div class="ev-layout">
            <div class="ev-panel">
                <div class="ev-heading">
                    <h3>System Event Stream</h3>
                    <span id="ev-showing">0 events</span>
                </div>

                <div id="ev-stream" class="ev-stream"></div>

                <button id="ev-more" type="button"
                    class="ev-more">
                    Show More Events
                </button>
            </div>

            <div class="ev-side">
                <div class="ev-panel">
                    <h3>Event Inspector</h3>
                    <div id="ev-inspector"></div>
                </div>

                <div class="ev-panel">
                    <h3>Event Categories</h3>
                    <div id="ev-frequency"></div>
                </div>

                <div class="ev-panel">
                    <h3>Bookmarked Events</h3>
                    <div id="ev-bookmarks"></div>
                </div>
            </div>
        </div>

        <div class="ev-panel ev-docs">
            <span class="ev-eyebrow">OS OBSERVABILITY</span>
            <h3>Why Event Logs Matter</h3>
            <p>
                Event logs provide a chronological record of
                what the simulator reports. They help explain
                process scheduling, IPC delivery, memory
                allocation failures, resource contention,
                deadlock recovery and traffic events.
            </p>
            <p>
                These are application-level simulation events,
                not real Windows or Linux kernel logs.
                They show what TrafficOS explicitly records;
                they do not automatically capture every
                internal state transition.
            </p>
        </div>
    `;

    page.prepend(root);

    $("ev-search").addEventListener("input", event => {
        view.query = event.target.value;
        view.limit = 100;
        render();
    });

    $("ev-type").addEventListener("change", event => {
        view.type = event.target.value;
        view.limit = 100;
        render();
    });

    $("ev-severity").addEventListener("change", event => {
        view.severity = event.target.value;
        view.limit = 100;
        render();
    });

    $("ev-toggle").addEventListener("click", () => {
        if (view.live) {
            view.snapshot = state.events.slice();
            view.live = false;
        } else {
            view.live = true;
            view.snapshot = [];
        }

        render();
    });

    $("ev-reset-filters").addEventListener("click", () => {
        view.query = "";
        view.type = "ALL";
        view.severity = "ALL";
        view.limit = 100;

        $("ev-search").value = "";
        $("ev-severity").value = "ALL";

        render();
    });

    $("ev-export-csv").addEventListener("click", () => {
        exportEvents("csv");
    });

    $("ev-export-json").addEventListener("click", () => {
        exportEvents("json");
    });

    $("ev-more").addEventListener("click", () => {
        view.limit += 100;
        render();
    });

    root.addEventListener("click", event => {
        const bookmark = event.target.closest("[data-bookmark]");

        if (bookmark) {
            const key = bookmark.dataset.bookmark;

            if (view.bookmarks.has(key)) {
                view.bookmarks.delete(key);
            } else {
                view.bookmarks.add(key);
            }

            render();
            return;
        }

        const item = event.target.closest("[data-event-key]");

        if (item) {
            view.selected = item.dataset.eventKey;
            render();
        }
    });

    // The existing app already runs a render loop.
    // This independent interval keeps the console lightweight.
    setInterval(render, 500);

    render();
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

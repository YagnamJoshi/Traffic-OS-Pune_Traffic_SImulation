
/* =====================================================
   TrafficOS — Memory Management Lab
   File: js/memoryLab.js
   ===================================================== */

import { state } from "./state.js";

import {
    allocateMemory,
    releaseMemory,
    compactMemory,
    setAllocationAlgorithm,
    updateMemoryStats
} from "./memoryManager.js";

const memoryLab = {
    selectedPID: null,
    signature: "",
    message: "",
    error: false
};

function mlEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function mlOwners() {
    const owners = new Map();

    for (const block of state.memory.blocks) {
        if (!block.occupied || !block.owner) continue;

        if (!owners.has(block.owner)) {
            owners.set(block.owner, []);
        }

        owners.get(block.owner).push(block.index);
    }

    return owners;
}

function mlFreeSegments() {
    const segments = [];
    let start = -1;

    state.memory.blocks.forEach((block, index) => {
        if (!block.occupied && start === -1) {
            start = index;
        }

        if (block.occupied && start !== -1) {
            segments.push({
                start,
                length: index - start
            });

            start = -1;
        }
    });

    if (start !== -1) {
        segments.push({
            start,
            length: state.memory.blocks.length - start
        });
    }

    return segments;
}

function mlSetText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function mlNotice(message, error = false) {
    memoryLab.message = message;
    memoryLab.error = error;

    const root = document.getElementById("ml-notice");

    if (root) {
        root.textContent = message;
        root.classList.toggle("ml-error", error);
    }
}

function mlRenderStats() {
    const memory = state.memory;
    const total = memory.blocks.length;
    const used = memory.blocks.filter(b => b.occupied).length;
    const free = total - used;
    const holes = mlFreeSegments().length;

    const percent = total
        ? Math.round((used / total) * 100)
        : 0;

    mlSetText("ml-total", total);
    mlSetText("ml-used", used);
    mlSetText("ml-free", free);
    mlSetText("ml-holes", holes);
    mlSetText("ml-percent", `${percent}%`);

    const bar = document.getElementById("ml-usage-fill");

    if (bar) bar.style.width = `${percent}%`;
}

function mlRenderMap() {
    const root = document.getElementById("ml-blocks");
    if (!root) return;

    root.innerHTML = state.memory.blocks.map(block => {
        const owner = block.occupied
            ? String(block.owner)
            : "FREE";

        const selected =
            block.occupied &&
            memoryLab.selectedPID === owner;

        const color = block.occupied
            ? block.color
            : "#26364e";

        return `
            <button
                type="button"
                class="ml-block ${selected ? "ml-selected" : ""}"
                data-owner="${mlEscape(owner)}"
                title="Block ${block.index}: ${mlEscape(owner)}"
                style="--block-color:${mlEscape(color)}"
                aria-label="Block ${block.index}, ${mlEscape(owner)}"
            ></button>
        `;
    }).join("");
}

function mlRenderOwners() {
    const root = document.getElementById("ml-owners");
    if (!root) return;

    const owners = mlOwners();

    if (!owners.size) {
        root.innerHTML = `
            <p class="ml-empty">
                No allocated memory blocks.
            </p>
        `;
        return;
    }

    root.innerHTML = [...owners].map(([pid, blocks]) => {
        const firstBlock = state.memory.blocks[blocks[0]];

        return `
            <button
                type="button"
                class="ml-owner ${memoryLab.selectedPID === pid
                    ? "ml-owner-active" : ""}"
                data-pid="${mlEscape(pid)}"
            >
                <span class="ml-owner-color"
                      style="background:${mlEscape(firstBlock.color)}">
                </span>
                <strong>${mlEscape(pid)}</strong>
                <small>${blocks.length} blocks</small>
            </button>
        `;
    }).join("");
}

function mlRenderSegments() {
    const root = document.getElementById("ml-segments");
    if (!root) return;

    const segments = mlFreeSegments();

    if (!segments.length) {
        root.innerHTML = `
            <p class="ml-empty">No free segments available.</p>
        `;
        return;
    }

    root.innerHTML = segments.map((segment, index) => `
        <div class="ml-segment">
            <span>Hole ${index + 1}</span>
            <strong>${segment.length} blocks</strong>
            <small>Starts at block ${segment.start}</small>
        </div>
    `).join("");
}

function mlRenderInspector() {
    const root = document.getElementById("ml-inspector");
    if (!root) return;

    const pid = memoryLab.selectedPID;
    const blocks = mlOwners().get(pid);

    if (!blocks) {
        memoryLab.selectedPID = null;

        root.innerHTML = `
            <p class="ml-empty">
                Select a colored block or an allocation
                to inspect its owner.
            </p>
        `;
        return;
    }

    root.innerHTML = `
        <div class="ml-inspector-title">
            <div>
                <span class="ml-eyebrow">ALLOCATION DETAILS</span>
                <h3>${mlEscape(pid)}</h3>
            </div>

            <button type="button" id="ml-release-selected">
                Release Memory
            </button>
        </div>

        <div class="ml-inspector-grid">
            <div>
                <span>Allocated Blocks</span>
                <strong>${blocks.length}</strong>
            </div>

            <div>
                <span>First Block</span>
                <strong>${blocks[0]}</strong>
            </div>

            <div>
                <span>Last Block</span>
                <strong>${blocks.at(-1)}</strong>
            </div>

            <div>
                <span>Owner</span>
                <strong>${mlEscape(pid)}</strong>
            </div>
        </div>

        <p class="ml-inspector-note">
            Block indices: ${mlEscape(blocks.join(", "))}
        </p>
    `;
}

function mlRenderExplanation() {
    const root = document.getElementById("ml-explanation");
    if (!root) return;

    const algorithm = String(
        state.memory.algorithm || ""
    ).toUpperCase();

    let description =
        "First Fit selects the first free contiguous segment " +
        "large enough to satisfy the allocation.";

    if (algorithm.includes("BEST")) {
        description =
            "Best Fit chooses the smallest free segment " +
            "that can hold the requested allocation.";
    } else if (algorithm.includes("WORST")) {
        description =
            "Worst Fit chooses the largest available " +
            "free segment for the allocation.";
    }

    root.textContent = description;

    mlSetText(
        "ml-active-algorithm",
        state.memory.algorithm
    );
}

function mlRefresh() {
    const page = document.getElementById("page-memory");

    if (!page || !page.classList.contains("active")) {
        return;
    }

    const signature = JSON.stringify({
        algorithm: state.memory.algorithm,
        blocks: state.memory.blocks.map(b => [
            b.occupied, b.owner, b.color
        ]),
        selected: memoryLab.selectedPID
    });

    if (signature === memoryLab.signature) return;

    memoryLab.signature = signature;

    mlRenderStats();
    mlRenderMap();
    mlRenderOwners();
    mlRenderSegments();
    mlRenderInspector();
    mlRenderExplanation();
}

function mlAllocate(event) {
    event.preventDefault();

    const nameInput = document.getElementById("ml-pid");
    const sizeInput = document.getElementById("ml-size");

    const pid = nameInput.value.trim();
    const size = Number(sizeInput.value);

    if (!/^[A-Za-z0-9_-]{1,30}$/.test(pid)) {
        mlNotice(
            "Use a PID containing 1–30 letters, numbers, _ or -.",
            true
        );
        return;
    }

    if (!Number.isSafeInteger(size) || size <= 0) {
        mlNotice("Enter a positive whole number of blocks.", true);
        return;
    }

    if (size > state.memory.blocks.length) {
        mlNotice("Requested size exceeds total memory.", true);
        return;
    }

    // Lab allocations use unique owners so that
    // each can be released independently.
    if (mlOwners().has(pid)) {
        mlNotice(
            "This PID already owns memory. Choose a unique lab PID.",
            true
        );
        return;
    }

    const success = allocateMemory(pid, size);

    if (success) {
        memoryLab.selectedPID = pid;
        mlNotice(`Allocated ${size} blocks to ${pid}.`);
    } else {
        mlNotice(
            `Allocation failed: no contiguous free segment of ${size} blocks.`,
            true
        );
    }

    mlRefresh();
}

function mlReleaseSelected() {
    const pid = memoryLab.selectedPID;
    if (!pid) return;

    const count = releaseMemory(pid);

    memoryLab.selectedPID = null;

    mlNotice(
        count
            ? `Released ${count} blocks from ${pid}.`
            : `No blocks were released for ${pid}.`,
        count === 0
    );

    mlRefresh();
}

function mlInitialize() {
    const page = document.getElementById("page-memory");

    if (!page || document.getElementById("memoryLab")) {
        return;
    }

    const root = document.createElement("div");
    root.id = "memoryLab";

    root.innerHTML = `
        <div class="ml-hero">
            <div>
                <span class="ml-eyebrow">
                    TRAFFICOS / MEMORY MANAGEMENT
                </span>
                <h2>Memory Allocation Lab</h2>
                <p>
                    Explore contiguous allocation, free-space
                    fragmentation and memory compaction.
                </p>
            </div>

            <span class="ml-engine-label">● LIVE MEMORY STATE</span>
        </div>

        <div class="ml-stats">
            <div><span>Total Blocks</span><strong id="ml-total">0</strong></div>
            <div><span>Used Blocks</span><strong id="ml-used">0</strong></div>
            <div><span>Free Blocks</span><strong id="ml-free">0</strong></div>
            <div><span>Free Holes</span><strong id="ml-holes">0</strong></div>
        </div>

        <div class="ml-panel">
            <div class="ml-panel-heading">
                <h3>Physical Memory Map</h3>
                <span id="ml-percent">0%</span>
            </div>

            <div class="ml-usage">
                <div id="ml-usage-fill"></div>
            </div>

            <p class="ml-helper">
                Each square represents one simulated memory block.
                Select an occupied block to inspect its owner.
            </p>

            <div class="ml-block-grid" id="ml-blocks"></div>

            <div class="ml-legend">
                <span><i></i> Free memory</span>
                <span>Colored blocks = allocated memory</span>
            </div>
        </div>

        <div class="ml-two-column">
            <div class="ml-panel">
                <h3>Allocate Memory</h3>

                <form id="ml-allocate-form" class="ml-form">
                    <label>
                        Allocation ID
                        <input
                            id="ml-pid"
                            placeholder="LAB_01"
                            maxlength="30"
                            required
                        >
                    </label>

                    <label>
                        Blocks Required
                        <input
                            id="ml-size"
                            type="number"
                            min="1"
                            step="1"
                            value="4"
                            required
                        >
                    </label>

                    <button type="submit">
                        Allocate Blocks
                    </button>
                </form>

                <div class="ml-divider"></div>

                <h3>Memory Operations</h3>

                <button id="ml-compact" type="button"
                        class="ml-secondary-button">
                    Compact Memory
                </button>

                <p id="ml-notice" class="ml-notice"
                   role="status" aria-live="polite"></p>
            </div>

            <div class="ml-panel">
                <div class="ml-panel-heading">
                    <h3>Allocation Inspector</h3>
                    <span>Selected owner</span>
                </div>

                <div id="ml-inspector"></div>
            </div>
        </div>

        <div class="ml-two-column">
            <div class="ml-panel">
                <h3>Active Memory Owners</h3>
                <div id="ml-owners" class="ml-owner-list"></div>
            </div>

            <div class="ml-panel">
                <h3>Free Memory Segments</h3>
                <div id="ml-segments" class="ml-segments"></div>
            </div>
        </div>

        <div class="ml-panel ml-concept-panel">
            <span class="ml-eyebrow">OS CONCEPT EXPLAINED</span>
            <h3>Allocation Strategy:
                <span id="ml-active-algorithm">—</span>
            </h3>
            <p id="ml-explanation"></p>

            <p>
                <strong>External fragmentation:</strong>
                Free memory exists, but it is divided into
                separate holes. A request can fail even when
                the total free block count is sufficient.
            </p>

            <p>
                <strong>Compaction:</strong>
                Moves occupied blocks together so that
                free memory becomes one contiguous region.
            </p>
        </div>
    `;

    page.prepend(root);

    root.querySelector("#ml-allocate-form")
        .addEventListener("submit", mlAllocate);

    root.querySelector("#ml-compact")
        .addEventListener("click", () => {
            compactMemory();
            mlNotice("Memory compacted successfully.");
            mlRefresh();
        });

    root.addEventListener("click", event => {
        if (event.target.closest("#ml-release-selected")) {
            mlReleaseSelected();
            return;
        }

        const ownerButton = event.target.closest("[data-owner]");

        if (ownerButton) {
            const pid = ownerButton.dataset.owner;

            memoryLab.selectedPID =
                pid === "FREE" ? null : pid;

            mlRefresh();
            return;
        }

        const pidButton = event.target.closest("[data-pid]");

        if (pidButton) {
            memoryLab.selectedPID = pidButton.dataset.pid;
            mlRefresh();
        }
    });

    // Use a low-cost refresh interval rather than
    // replacing the simulator's existing render loop.
    setInterval(mlRefresh, 300);

    mlRefresh();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        mlInitialize,
        { once: true }
    );
} else {
    mlInitialize();
}

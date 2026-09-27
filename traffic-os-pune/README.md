# TrafficOS Pune

**A Smart City Operating System Simulator**

TrafficOS Pune is a browser-based simulation that teaches core Operating
System concepts — process management, CPU scheduling, memory allocation,
inter-process communication, and deadlock handling — by modeling them as a
living Pune traffic network. Junctions are processes, ambulances trigger
priority preemption, congestion creates memory pressure, and junction
controllers can deadlock over shared signal locks — with three selectable
strategies to stop them.

No build step, no dependencies. Open `index.html` and it runs.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Getting Started](#getting-started)
- [OS Concepts Demonstrated](#os-concepts-demonstrated)
- [Using the Simulator](#using-the-simulator)
  - [Simulation Page](#simulation-page)
  - [Process Management](#process-management)
  - [CPU Scheduler](#cpu-scheduler)
  - [Memory Manager](#memory-manager)
  - [IPC](#ipc)
  - [Deadlock Lab](#deadlock-lab)
  - [Scenarios](#scenarios)
- [State Model](#state-model)
- [Offline Support (PWA)](#offline-support-pwa)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Developer](#developer)
- [License](#license)

---

## Features

- **Live traffic simulation** on a canvas-rendered map of eight
  Pune-inspired junctions (Deccan, FC Road, JM Road, Shivajinagar,
  Kothrud, Baner, Hinjawadi, Kalyani Nagar), with cars, autos, buses,
  and ambulances moving along a real road graph.
- **Full process lifecycle control** — create custom processes, change
  their priority live, or kill them and watch the OS reclaim their
  memory and locks.
- **Switchable CPU scheduling algorithms** — Round Robin, Priority, and
  FCFS, changeable while the simulation is running.
- **Interactive memory manager** — pick First Fit / Best Fit / Worst
  Fit, manually allocate or free blocks, compact memory, or just click
  a block on the grid to free it.
- **Manual IPC** — send a message between any two processes with a
  chosen message type, or pause/resume/clear the queue to see backlog
  build up.
- **A real Deadlock Lab** — not a scripted animation. Junction-controller
  processes (P01–P04) genuinely compete for each other's signal locks,
  and you choose how the system responds:
  - **Detection** — grant locks immediately, periodically scan the
    wait-for graph for cycles, and recover by rolling back a victim.
  - **Prevention** — enforce a global ascending resource order so a
    circular wait can never form.
  - **Avoidance** — check every request in advance (Banker's-style) and
    refuse any request that would create a cycle.
- **Emergency scenario** — dispatch an ambulance and watch a green
  corridor propagate through IPC messages, an emergency process spawn
  at max priority, and reserved memory get allocated in real time.
- **Fault injection** — fail a junction process and watch fault
  handling and recovery.
- **Rush hour** — flood the network with traffic to observe congestion,
  queueing, and resource contention.
- **Offline-capable** — registers a service worker so the app keeps
  working without a network connection.

## Architecture

```
index.html
    ↓
  app.js  (bootstrap, navigation, all UI wiring)
    ↓
simulation.js  (master engine — orchestrates every tick)
    ↓
 ┌───────────┬────────────┬────────────────┬─────────────┬─────────────┐
 ↓           ↓            ↓                ↓             ↓             ↓
traffic.js scheduler.js memoryManager.js ipcManager.js deadlock.js
 ↓           ↓            ↓                ↓             ↓
             └──────────────────→ processManager.js ←─────┘
                                        ↓
                                    state.js
```

- **`state.js`** is the single source of truth. Every module reads and
  mutates the shared `state` object; nothing keeps its own duplicate
  copy of simulation data.
- **`simulation.js`** owns the main update loop (`updateSimulation`) and
  is the only place that calls every subsystem's tick function in
  order: traffic → processes → scheduler → memory → IPC → deadlock →
  statistics → objectives.
- **`ui.js`** is a pure renderer. It reads `state` and writes to the
  DOM; it never mutates simulation state directly (all mutation happens
  through `app.js` calling into `simulation.js` / the manager modules
  in response to user actions).
- **`app.js`** is the only file that touches the DOM for *input*
  (buttons, selects, forms) and wires those events to exported
  functions from `simulation.js`, `scheduler.js`, `memoryManager.js`,
  and `ipcManager.js`.

## File Structure

```
TrafficOS-Pune/
├── index.html              Page shell, all pages/panels, element IDs
├── manifest.json            PWA manifest
├── service-worker.js        Offline cache
├── css/
│   └── style.css            All styling
└── js/
    ├── app.js                Bootstrap, navigation, event wiring
    ├── state.js               Central state store + constants + utils
    ├── simulation.js          Master engine / update loop
    ├── processManager.js      Process + thread + PCB lifecycle
    ├── scheduler.js            CPU scheduling (RR / Priority / FCFS)
    ├── memoryManager.js        Block allocation (First/Best/Worst Fit)
    ├── ipcManager.js           Message queue + delivery
    ├── deadlock.js             Lock manager: Detection/Prevention/Avoidance
    ├── traffic.js               Junctions, roads, vehicles, routing
    └── ui.js                    DOM rendering (read-only from state)
```

## Getting Started

TrafficOS Pune has zero dependencies and no build step.

1. Clone or download the project.
2. Serve the folder with any static file server (opening `index.html`
   directly with `file://` will also work for most browsers, but a
   local server avoids service-worker/CORS quirks):

   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```

3. Open the served URL in a browser. The boot sequence runs for a few
   seconds, then the simulation starts automatically.

No API keys, no external services, no install step.

## OS Concepts Demonstrated

| Area | Concepts |
|---|---|
| **Process Management** | PCB, process states (NEW/READY/RUNNING/WAITING/BLOCKED/TERMINATED/FAILED), thread creation, process creation/termination/removal, fault injection & recovery |
| **CPU Scheduling** | Long-term, medium-term, and short-term schedulers; Round Robin with time quantum; Priority scheduling with preemption; FCFS; context switching |
| **Memory Management** | First Fit, Best Fit, Worst Fit allocation; contiguous block allocation; fragmentation tracking; compaction; emergency reservation |
| **IPC** | Message passing, message queue with pause/resume/clear, producer-consumer delivery, emergency coordination chains |
| **Deadlocks** | A real wait-for graph over junction-controller locks; Detection (cycle scan + victim rollback), Prevention (resource ordering), Avoidance (pre-request cycle check) |
| **Real-Time Systems** | Emergency vehicle priority preemption, green-corridor signal coordination |

## Using the Simulator

### Simulation Page

The default view: a live canvas map plus an Activity Panel (explains
what the system is currently doing and which OS concept it
demonstrates) and a live Scheduler snapshot.

The top control bar is available from every page:

| Button | Effect |
|---|---|
| **Start / Pause / Reset** | Controls the simulation clock |
| **Emergency** | Dispatches an ambulance and runs the full emergency sequence |
| **Rush Hour** | Spawns 60 additional vehicles at once |
| **Process Failure** | Fails the FC Road Junction process (P02) |
| **Force Deadlock Scenario** | Forces P01 and P02 to request each other's locks, so you can see the *currently selected* deadlock strategy react immediately |

Speed can be set to 1x / 2x / 5x / 10x.

### Process Management

- **Create Process** — name, priority (1–10), and memory requirement
  (blocks); creates a real process with a default thread.
- **Table actions** — `+` / `-` adjust priority live (also updates all
  of that process's threads); **Kill** terminates the process, frees
  its memory blocks, and releases any locks it was holding.

### CPU Scheduler

Switch the active scheduling algorithm (Round Robin / Priority / FCFS)
at any time; the ready/waiting/blocked queues and running thread update
immediately.

### Memory Manager

- Switch allocation strategy (First Fit / Best Fit / Worst Fit).
- **Compact Memory** consolidates all free space into one block.
- **Allocate** — pick a process and a block count.
- **Free** — release everything a process owns, or just click an
  occupied block in the grid to free its owner directly.

### IPC

- **Send Message** — pick sender, receiver, and message type and send
  it manually.
- **Pause / Resume / Clear Queue** — watch messages back up when paused,
  and clear the backlog at any time.
- The live queue view shows the last 20 messages.

### Deadlock Lab

Pick a strategy from the dropdown:

- **Detection** — locks are granted immediately, and the system scans
  for cycles. When one is found, the lowest-priority process in the
  cycle is rolled back (its locks released) automatically after a
  short delay.
- **Prevention** — a process may only request locks in ascending
  resource-ID order. A request that would violate that order is
  refused outright, so a circular wait can never form.
- **Avoidance** — every request is checked against the current wait-for
  graph before being granted; a request that *would* complete a cycle
  is refused, even though the resource ordering isn't enforced.

Junctions P01–P04 request each other's locks on their own as part of
the normal tick, so you'll see organic contention even without
clicking anything. Use **Force Deadlock Scenario** to immediately test
how the selected strategy handles a deliberate circular request.

### Scenarios

- **Emergency** — ambulance spawns → route computed → emergency process
  created at max priority → memory reserved → IPC chain notifies each
  junction along the route → green corridor activates.
- **Process Failure** — demonstrates fault detection and the recovery
  path.
- **Rush Hour** — stress-tests congestion calculation and road capacity.

## State Model

Everything lives in a single exported object, `state`, in `state.js`.
Selected top-level keys:

```js
state.processes        // array of process objects (pid, name, state, priority, threads, cpuUsage, ...)
state.threads          // array of thread objects
state.scheduler         // algorithm, queues, currentThread, cpuUtilization, contextSwitches
state.memory             // totalBlocks, blocks[], algorithm, usedBlocks, fragmentation
state.ipc                 // queue[], delivered[], queuePaused
state.deadlock             // mode, locks{}, waitFor[], detected, cycle[]
state.traffic                // junctions[], roads[], vehicles[], metroStations[], congestionPercent
state.emergency                // active, route, origin, destination
state.statistics                 // counters used across the app (allocations, switches, deadlocks, ...)
state.events, state.activityPanel  // event log + the "what's happening now" panel
```

No module keeps its own copy of this data — `ui.js` renders straight
from `state`, and every manager module (`processManager.js`,
`scheduler.js`, `memoryManager.js`, `ipcManager.js`, `deadlock.js`)
mutates it directly and calls `generateEvent()` to log what happened.

## Offline Support (PWA)

`service-worker.js` caches the app shell (`index.html`, `style.css`,
all JS modules) on install, so TrafficOS Pune keeps working offline
after the first load. `manifest.json` allows it to be installed as a
standalone app.

> If you edit any file under `js/` or `css/`, bump `CACHE_NAME` in
> `service-worker.js` (e.g. `"trafficos-v2"`) so the service worker
> fetches the new versions instead of serving stale cached files.

## Known Limitations

- `resetSimulation()` performs a full `location.reload()` rather than
  an in-memory reset — simple and reliable, but loses in-progress
  autosave state that hasn't been flushed yet.
- The route-finding in `traffic.js` (`findSimpleRoute`) is a plain BFS
  over the road graph, not shortest-path-by-distance — fine for this
  network's scale, not meant to generalize to a larger map.
- Deadlock resources are limited to the four junction-controller
  processes (P01–P04); other processes (metro/bus coordination,
  monitoring, emergency) don't currently participate in the lock
  graph.

## Roadmap

- Draw the live wait-for / lock graph directly on the canvas instead
  of as a text panel.
- Represent Banker's Algorithm avoidance as an actual need/allocation/
  available matrix rather than a simplified cycle check.
- Validate memory requirement against available space before creating
  a process, with a clear failure event instead of a silent
  allocation failure later.
- Per-process memory/IPC/lock inspector panel (click a row to expand).
- Charts (CPU history, memory history, congestion history) — the data
  is already collected in `state.charts` but not yet rendered.

## Developer

**Yagnam Sanket Joshi** — Developer and System Designer

TrafficOS Pune is a Smart City Operating System simulator built to
demonstrate core OS concepts through a traffic management game.

- GitHub: _add link_
- Portfolio: _add link_

## License

Add your preferred license here (e.g. MIT) before publishing this
repository publicly.
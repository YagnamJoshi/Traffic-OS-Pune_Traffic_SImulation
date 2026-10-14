# 🚦 TrafficOS Pune
### An Interactive Operating Systems & Traffic Management Simulator

**TrafficOS Pune** is an interactive, browser-based educational simulator that demonstrates fundamental **Operating System concepts through a virtual urban traffic management environment inspired by Pune, India**.

The project connects OS theory with a practical scenario: coordinating traffic junctions, vehicles, emergency events, and city services using simulated processes, CPU scheduling, memory allocation, inter-process communication, and deadlock management.

Rather than presenting OS algorithms as isolated textbook examples, TrafficOS allows users to observe how these concepts interact within a dynamic traffic-control system.

---

## 🌐 Live Demo

**[Launch TrafficOS Pune](https://YagnamJoshi.github.io/REPOSITORY-NAME/)**

> Replace `REPOSITORY-NAME` with the actual GitHub repository name after deployment.

## 🎯 Project Objectives

The primary goal of TrafficOS Pune is to make Operating System concepts easier to understand through interactive visualization and experimentation.

The project aims to:

- Demonstrate OS concepts through a real-world-inspired traffic scenario.
- Simulate process creation, execution, suspension, and termination.
- Visualize CPU scheduling and context switching.
- Explore memory allocation and fragmentation.
- Demonstrate communication between simulated processes.
- Explain deadlock detection, prevention, avoidance, and recovery.
- Record simulation activity through an event logging console.
- Provide a responsive, accessible learning interface.

---

## ✨ Key Features

### 🗺️ Interactive Pune Traffic Simulation

A dynamic traffic simulation featuring Pune-inspired junctions, roads, vehicles, and transportation services.

**Features include:**
- Interactive traffic map and junction inspection.
- Vehicle movement and traffic visualization.
- Start, pause, and reset controls.
- Adjustable simulation speeds.
- Emergency and rush-hour scenarios.
- Simulated process failures.
- Fullscreen map viewing.

The traffic environment provides the practical context for the operating-system modules.

### ⚙️ Process Management

Simulated traffic controllers and coordination services are represented as processes.

**Features include:**
- Process Control Block (PCB) information.
- Process creation and termination.
- Process state visualization.
- Thread information.
- Process priorities and CPU usage.
- Process inspection and monitoring.

This module helps demonstrate how an operating system organizes and manages active processes.

### 🧠 CPU Scheduling

A scheduling module demonstrates how simulated CPU time is allocated among runnable threads.

**Supported algorithms:**
- First Come, First Served (FCFS)
- Round Robin
- Priority Scheduling

**Additional concepts:**
- Ready, waiting, and blocked queues.
- Context switching.
- Scheduling decisions.
- CPU utilization.
- Execution history visualization.
- Long-term, medium-term, and short-term scheduling concepts.

### 💾 Memory Management

An interactive memory management module explores allocation strategies and memory usage.

**Supported strategies:**
- First Fit
- Best Fit
- Worst Fit

**Additional features:**
- Memory block visualization.
- Allocation and deallocation.
- Memory compaction.
- Memory utilization monitoring.
- Fragmentation demonstrations.

### 🔄 Inter-Process Communication (IPC)

The IPC Communication Center illustrates how simulated traffic-control processes exchange messages.

**Features include:**
- Message passing between processes.
- FIFO message queue.
- Sender and receiver selection.
- Message delivery tracking.
- Queue capacity and overflow behavior.
- Message inspection.
- Communication scenarios.
- IPC-related event logging.

### 🔒 Deadlock Management

The Deadlock Control Center demonstrates resource contention and circular dependencies.

**Features include:**
- Exclusive resource locking.
- Resource ownership visualization.
- Wait-for graph.
- Circular-wait detection.
- Deadlock scenarios.
- Detection, prevention, and cycle-avoidance modes.
- Simulated recovery through victim selection and lock release.

**Note:** The avoidance implementation demonstrates cycle avoidance for single-instance resources; it is not a complete Banker's Algorithm implementation.

### 📊 Event Log & Observability

A centralized console records and displays simulator-generated events.

**Features include:**
- Live event monitoring.
- Search and category filters.
- Inferred severity classification.
- Detailed event inspection.
- Event frequency visualization.
- Temporary bookmarks.
- CSV and JSON export.
- Live-view freezing for investigation.

The console helps users understand how decisions in one subsystem affect the wider simulation.

### 📚 OS Concepts Learning Hub

An educational section dedicated to explaining the operating-system concepts demonstrated in TrafficOS.

It complements the interactive modules with conceptual explanations and learning resources.

### 👨‍💻 Developer Hub

A dedicated section presenting the project's architecture, contributors, implementation details, and development direction.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Responsive layouts and visual styling |
| JavaScript (ES Modules) | Simulation logic and interaction |
| HTML Canvas | Traffic map visualization |
| SVG | Graphs and visual diagrams |
| Service Worker | Offline caching support |
| Web App Manifest | Progressive web app metadata |
| Git & GitHub | Version control and collaboration |
| GitHub Pages | Static website hosting |

The project uses a frontend-focused architecture without requiring a backend server.

---

## 🏗️ System Architecture

TrafficOS separates simulation logic from presentation and user interaction.

**Core components:**

1. **Application Controller** — Handles navigation, user interactions, and simulation controls.
2. **Simulation State** — Maintains shared information about processes, threads, memory, events, and system activity.
3. **Process Manager** — Manages simulated process and thread lifecycles.
4. **CPU Scheduler** — Selects runnable threads according to the active scheduling algorithm.
5. **Memory Manager** — Handles memory allocation and deallocation.
6. **IPC Manager** — Manages simulated message communication.
7. **Deadlock Manager** — Tracks resource ownership, waiting requests, and recovery.
8. **Traffic Engine** — Updates the traffic environment and its simulated activity.
9. **User Interface** — Presents interactive controls, dashboards, diagrams, and event information.

These components work together to create an integrated educational environment.

---

## 📁 Project Structure

```text
traffic-os-pune/
├── assets/                # Images and other static assets
├── css/                   # Stylesheets
├── js/                    # Simulation engines and UI modules
├── index.html             # Main application entry point
├── manifest.json          # Web app manifest
├── service-worker.js      # Offline asset caching
└── README.md              # Project documentation
```

---

## 🚀 Getting Started

### Option 1: Use the Live Website

Open the live demo link above in a modern web browser.

### Option 2: Run Locally

**1. Clone the repository**

```bash
git clone https://github.com/YagnamJoshi/REPOSITORY-NAME.git
```

**2. Open the project folder**

```bash
cd REPOSITORY-NAME/traffic-os-pune
```

**3. Start a local development server**

If Python is installed:

```bash
python -m http.server 5500
```

**4. Open the application**

Visit:

```text
http://localhost:5500
```

A local HTTP server is recommended because JavaScript modules and service workers may not function correctly when opening the HTML file directly through a `file://` URL.

---

## 🧪 How to Use TrafficOS

**Step 1 — Start the Simulation**

Open the Simulation tab and press **Start** to begin traffic activity.

**Step 2 — Explore Process Management**

Inspect traffic-controller processes, process states, priorities, and threads.

**Step 3 — Compare Scheduling Algorithms**

Switch between FCFS, Round Robin, and Priority Scheduling to observe different scheduling behavior.

**Step 4 — Experiment with Memory**

Allocate and free memory using different strategies, then explore compaction.

**Step 5 — Test IPC**

Send messages between simulated processes and inspect queue and delivery behavior.

**Step 6 — Explore Deadlocks**

Generate resource contention, inspect the wait-for graph, and experiment with detection and recovery.

**Step 7 — Investigate Events**

Use the Event Log Console to examine recorded system activity and export results.

---

## 🎓 Operating System Concepts Covered

| OS Concept | TrafficOS Demonstration |
|---|---|
| Processes | Traffic junction controllers and coordination services |
| Threads | Simulated units of execution |
| Process states | Ready, running, waiting, and blocked states |
| CPU scheduling | FCFS, Round Robin, and Priority |
| Context switching | Switching between simulated running threads |
| Memory allocation | First Fit, Best Fit, and Worst Fit |
| Fragmentation | Free and occupied memory blocks |
| Memory compaction | Rearrangement of allocated memory |
| IPC | Message queues and process communication |
| Synchronization | Resource ownership and exclusive locking |
| Deadlock | Circular wait and resource contention |
| Deadlock recovery | Simulated victim selection and lock release |
| System logging | Event recording and inspection |

---

## 👥 Project Team

### Yagnam Sanket Joshi
**Project Lead & System Architect**

Responsible for overall project direction, system architecture, module integration, and development coordination.

### Aarush Shah
**Frontend & UI Development**

Responsible for frontend development, interface design, responsive layouts, and user experience.

### Sharath Krishna
**OS Algorithms & Simulation**

Responsible for operating-system algorithms, simulation concepts, and related implementation.

---

## 💡 Educational Scope

TrafficOS Pune is an **educational simulation**, not a real operating system or a production traffic-control platform.

Its processes and threads are JavaScript-based simulation objects rather than actual operating-system processes or kernel threads.

CPU scheduling, memory management, IPC, and deadlock handling are implemented as conceptual models designed to demonstrate operating-system behavior.

The traffic network is a fictionalized, Pune-inspired environment rather than a live representation of actual road conditions.

---

## 🔮 Future Enhancements

Potential improvements include:

- 3D traffic map visualization.
- Stronger integration between IPC messages and traffic signals.
- Additional CPU scheduling algorithms.
- More advanced memory management simulations.
- Extended deadlock-avoidance algorithms.
- Detailed performance comparisons between scheduling strategies.
- More interactive learning exercises.
- Improved simulation analytics and reporting.

---

## 🤝 Contributions

Suggestions, bug reports, and improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request explaining the improvement.

Please keep changes consistent with the project's educational purpose and modular architecture.

---

## 📌 Project Information

**Project:** TrafficOS Pune  
**Category:** Operating Systems / Educational Simulation  
**Application Type:** Interactive Web Application  
**Platform:** Modern Desktop and Mobile Browsers  
**Development Approach:** Modular JavaScript Simulation

---

## ⭐ Support the Project

If you find TrafficOS Pune useful for learning operating-system concepts, consider starring the repository.

Your feedback can help improve the simulation and make OS concepts more accessible.

---

**TrafficOS Pune — Learning Operating Systems Through the Flow of a City.**

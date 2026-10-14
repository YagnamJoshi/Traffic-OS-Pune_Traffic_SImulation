
/* ==========================================================
   TrafficOS Pune — OS Concepts Learning Hub
   File: js/osConcepts.js
   ========================================================== */

const GFG = "https://www.geeksforgeeks.org/operating-systems/";

const lessons = [
  {
    id: "introduction",
    icon: "🖥️",
    title: "Introduction to Operating Systems",
    category: "Foundations",
    summary: "Understand the OS, kernel, system calls and services.",
    demo: "simulation",
    chapters: [
      {
        title: "What is an Operating System?",
        content: `An operating system is system software that manages
computer hardware and provides services to application programs.

It acts as an intermediary between users, applications and hardware.
The OS manages CPU time, memory, storage, input/output devices,
processes, files and security.

A useful distinction is that the kernel is the privileged core
of the operating system, while the complete OS also includes
system libraries, utilities and user-facing services.`,
        points: [
          "Resource management: distribute CPU, memory and I/O.",
          "Process management: create, schedule and terminate processes.",
          "Memory management: allocate and protect memory.",
          "File management: organize persistent data.",
          "Protection: control access to system resources."
        ],
        diagram: ["User Applications", "System Calls", "Kernel", "Hardware"]
      },
      {
        title: "Types of Operating Systems",
        content: `Batch systems execute collections of jobs without
continuous user interaction. Time-sharing systems share CPU
time among multiple users or processes. Real-time operating
systems emphasize predictable response deadlines.

Distributed systems coordinate multiple computers, while
embedded operating systems support dedicated devices.
Modern desktop and server operating systems often combine
multitasking, multiprocessing and networking features.`,
        points: [
          "Batch: jobs run in batches.",
          "Time-sharing: interactive CPU sharing.",
          "Real-time: timing constraints matter.",
          "Distributed: resources span multiple computers.",
          "Embedded: specialized devices and controllers."
        ]
      },
      {
        title: "System Calls",
        content: `A system call is a controlled entry point through which
a user program requests a kernel service.

Common categories include process control, file operations,
device operations, information maintenance and IPC.

For example, write() requests that bytes be written to a
file descriptor. The library interface ultimately invokes
the operating system's corresponding service.`,
        code: `#include <unistd.h>

int main(void) {
    const char message[] = "Hello from OS!\\n";

    write(STDOUT_FILENO,
          message,
          sizeof(message) - 1);

    return 0;
}`,
        codeNote: "POSIX example: write() requests an OS output service."
      }
    ],
    connection: "TrafficOS acts as a simplified resource-management system for traffic controllers, vehicles and simulated processes.",
    reference: GFG
  },
  {
    id: "processes",
    icon: "⚙️",
    title: "Process Management",
    category: "Core Concepts",
    summary: "Process states, PCB, creation, termination and context switching.",
    demo: "processes",
    chapters: [
      {
        title: "Process and Program",
        content: `A program is a passive set of instructions stored
on disk. A process is an active execution instance.

A process has its own execution context, including a
program counter, CPU registers, memory mappings and
operating-system-managed resources.

Multiple processes can execute instances of the same
program independently.`,
        points: [
          "Program: passive instructions.",
          "Process: program in execution.",
          "PID: identifier assigned to a process.",
          "PCB: data structure describing a process."
        ]
      },
      {
        title: "Process States",
        content: `In a common five-state model, a process moves between
New, Ready, Running, Waiting and Terminated.

A process in Ready is eligible for CPU time. Running
means it is executing. Waiting means it cannot proceed
until an event or resource becomes available.

The exact state model varies across operating systems.`,
        diagram: [
          "NEW",
          "READY",
          "RUNNING",
          "WAITING / BLOCKED",
          "TERMINATED"
        ],
        points: [
          "New → Ready: admitted into the system.",
          "Ready → Running: selected by the scheduler.",
          "Running → Ready: preempted.",
          "Running → Waiting: blocks for an event.",
          "Waiting → Ready: event completes."
        ]
      },
      {
        title: "Process Control Block",
        content: `The PCB stores information needed to manage a process.
Typical fields include process ID, state, program counter,
register values, scheduling priority, memory-management
information and accounting details.

During a context switch, the operating system saves
the outgoing process context and restores another.`,
        points: [
          "PID and process state",
          "Program counter and CPU registers",
          "Scheduling information",
          "Memory mappings",
          "Open files and resource information"
        ]
      },
      {
        title: "Creating a Process in C",
        content: `On POSIX systems, fork() creates a child process.
The child receives a return value of zero; the parent
receives the child's PID.

wait() allows the parent to wait for child termination.
fork() is not a native Windows process-creation API.`,
        code: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();

    if (pid < 0) {
        perror("fork");
        return 1;
    }

    if (pid == 0) {
        printf("Child process\\n");
    } else {
        wait(NULL);
        printf("Parent process\\n");
    }

    return 0;
}`,
        codeNote: "Compile on Linux or another POSIX-compatible environment."
      }
    ],
    connection: "Open Processes in TrafficOS to inspect controller processes, states and priorities. The simulator models selected process-management concepts rather than a real OS kernel.",
    reference: "https://www.geeksforgeeks.org/operating-systems/states-of-a-process-in-operating-systems/"
  },
  {
    id: "threads",
    icon: "🧵",
    title: "Threads and Concurrency",
    category: "Core Concepts",
    summary: "Threads, shared memory, concurrency and parallelism.",
    demo: "processes",
    chapters: [
      {
        title: "What is a Thread?",
        content: `A thread is an execution sequence within a process.
Threads in the same process usually share its address
space and open resources, while each thread has its own
stack, registers and execution position.

Threads are often lighter to create and switch between
than separate processes, although actual costs vary.`,
        points: [
          "A process can contain multiple threads.",
          "Threads share process memory.",
          "Each thread has its own execution context.",
          "Shared state requires synchronization."
        ]
      },
      {
        title: "Concurrency vs Parallelism",
        content: `Concurrency means tasks make progress during overlapping
periods. Parallelism means tasks actually execute at the
same time, for example on separate CPU cores.

A single-core CPU can provide concurrency through
scheduling without true simultaneous execution.`,
        diagram: ["Tasks", "Scheduler", "CPU Core(s)"]
      },
      {
        title: "POSIX Threads",
        content: `The pthread API provides thread creation and joining
on POSIX-compatible systems.`,
        code: `#include <stdio.h>
#include <pthread.h>

void *worker(void *arg) {
    (void)arg;
    puts("Worker thread running");
    return NULL;
}

int main(void) {
    pthread_t thread;

    if (pthread_create(&thread, NULL,
                       worker, NULL) != 0)
        return 1;

    pthread_join(thread, NULL);
    return 0;
}`,
        codeNote: "Compile with: gcc main.c -pthread -o main"
      }
    ],
    connection: "TrafficOS represents controller work through simulated processes and threads. Use the Processes page to explore their relationship.",
    reference: GFG
  },
  {
    id: "scheduling",
    icon: "⏱️",
    title: "CPU Scheduling",
    category: "Algorithms",
    summary: "FCFS, SJF, SRTF, Priority, Round Robin and metrics.",
    demo: "scheduler",
    chapters: [
      {
        title: "Why CPU Scheduling Matters",
        content: `When multiple ready processes compete for a CPU,
the scheduler chooses which process runs next.

Scheduling policies balance response time, waiting time,
turnaround time, fairness, throughput and CPU utilization.
No single algorithm is best for every workload.`,
        points: [
          "Turnaround = Completion − Arrival.",
          "Waiting = Turnaround − Burst (in a simple CPU-burst model).",
          "Response = First CPU start − Arrival.",
          "Preemptive scheduling can interrupt a running process."
        ]
      },
      {
        title: "FCFS, SJF and SRTF",
        content: `First-Come, First-Served schedules jobs by arrival order.
It is simple but can suffer from the convoy effect.

Shortest Job First selects the smallest next CPU burst.
Shortest Remaining Time First is its preemptive variant.

SJF minimizes average waiting time for an idealized
known-burst workload, but exact future bursts are usually
not known in practice.`,
        points: [
          "FCFS: simple and non-preemptive.",
          "SJF: shortest burst first.",
          "SRTF: shortest remaining time first.",
          "Long jobs may suffer starvation under shortest-job policies."
        ]
      },
      {
        title: "Priority and Round Robin",
        content: `Priority scheduling selects processes based on
priority values. The convention for higher priority
depends on the implementation.

Round Robin gives ready processes a limited time quantum.
When a quantum expires, an unfinished process returns
to the ready queue.

Very small quanta increase context-switch overhead;
very large quanta make Round Robin behave more like FCFS.`,
        points: [
          "Priority: supports urgent work.",
          "Aging can reduce starvation.",
          "Round Robin: supports time-sharing.",
          "Quantum size influences responsiveness and overhead."
        ]
      },
      {
        title: "Scheduling Example",
        content: `Suppose three processes arrive at time zero:
P1 has burst 5, P2 has burst 3, and P3 has burst 1.

FCFS order P1 → P2 → P3 gives waiting times
0, 5 and 8. Average waiting time is 13/3 ≈ 4.33.

SJF order P3 → P2 → P1 gives waiting times
0, 1 and 4. Average waiting time is 5/3 ≈ 1.67.`,
        diagram: ["P3: 0–1", "P2: 1–4", "P1: 4–9"]
      },
      {
        title: "Simple FCFS C Implementation",
        content: `This example assumes all processes arrive at time zero.`,
        code: `#include <stdio.h>

int main(void) {
    int burst[] = {5, 3, 1};
    int wait[3] = {0};
    int n = 3;

    for (int i = 1; i < n; i++)
        wait[i] = wait[i - 1] + burst[i - 1];

    for (int i = 0; i < n; i++)
        printf("P%d waiting = %d\\n",
               i + 1, wait[i]);

    return 0;
}`
      }
    ],
    connection: "Open Scheduler to select supported scheduling algorithms and observe ready, running, waiting and blocked process counts.",
    reference: "https://www.geeksforgeeks.org/operating-systems/cpu-scheduling-in-operating-systems/"
  },
  {
    id: "synchronization",
    icon: "🔒",
    title: "Process Synchronization",
    category: "Core Concepts",
    summary: "Race conditions, critical sections, mutexes and semaphores.",
    demo: "deadlock",
    chapters: [
      {
        title: "Race Conditions",
        content: `A race condition occurs when the result of concurrent
operations depends on their timing or interleaving.

For example, two threads incrementing a shared counter
without synchronization may overwrite each other's
updates.

A critical section accesses shared state that must be
protected from conflicting concurrent operations.`,
        points: [
          "Mutual exclusion prevents conflicting simultaneous access.",
          "Progress means eligible processes can proceed.",
          "Bounded waiting limits indefinite postponement."
        ]
      },
      {
        title: "Mutexes and Semaphores",
        content: `A mutex protects a critical section using exclusive
ownership. A semaphore maintains a count used to
coordinate access or signal events.

A binary semaphore has values conceptually restricted
to zero and one; counting semaphores support multiple
available resource units.

Mutexes and semaphores are related but not interchangeable
in every situation.`,
        diagram: [
          "Thread A requests lock",
          "Critical Section",
          "Unlock",
          "Thread B may enter"
        ]
      },
      {
        title: "Mutex Example in C",
        content: `The following example protects a shared counter.`,
        code: `#include <stdio.h>
#include <pthread.h>

int counter = 0;
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void *increment(void *arg) {
    (void)arg;

    for (int i = 0; i < 10000; i++) {
        pthread_mutex_lock(&lock);
        counter++;
        pthread_mutex_unlock(&lock);
    }

    return NULL;
}

int main(void) {
    pthread_t a, b;

    pthread_create(&a, NULL, increment, NULL);
    pthread_create(&b, NULL, increment, NULL);

    pthread_join(a, NULL);
    pthread_join(b, NULL);

    printf("Counter: %d\\n", counter);
    pthread_mutex_destroy(&lock);
    return 0;
}`,
        codeNote: "Compile with -pthread on a POSIX system."
      }
    ],
    connection: "Junction controllers compete for simulated resources in the Deadlock Lab, illustrating why synchronization matters.",
    reference: GFG
  },
  {
    id: "ipc",
    icon: "📨",
    title: "Inter-Process Communication",
    category: "Core Concepts",
    summary: "Message passing, shared memory, pipes and queues.",
    demo: "ipc",
    chapters: [
      {
        title: "Why IPC Exists",
        content: `Separate processes need mechanisms to exchange
information and coordinate activities.

Two broad approaches are message passing and shared
memory. Message passing sends structured information
through communication facilities. Shared memory exposes
a region accessible to multiple cooperating processes.`,
        points: [
          "Pipes: byte streams between processes.",
          "Message queues: discrete messages.",
          "Shared memory: common addressable region.",
          "Sockets: communication between local or remote endpoints.",
          "Synchronization is often needed with shared memory."
        ]
      },
      {
        title: "Producer–Consumer",
        content: `A producer generates items and a consumer processes
them. A bounded queue has limited capacity.

The producer must not overwrite a full buffer; the
consumer must not read an empty buffer.

Semaphores, mutexes or blocking queues can coordinate
these operations.`,
        diagram: ["Producer", "Message Queue", "Consumer"]
      },
      {
        title: "Pipe Example in C",
        content: `This POSIX example sends a message through a pipe
from a parent process to a child process.`,
        code: `#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    int fd[2];
    char buffer[32] = {0};

    if (pipe(fd) == -1) return 1;

    pid_t pid = fork();
    if (pid < 0) return 1;

    if (pid == 0) {
        close(fd[1]);
        read(fd[0], buffer, sizeof(buffer) - 1);
        printf("Received: %s\\n", buffer);
        close(fd[0]);
    } else {
        close(fd[0]);
        write(fd[1], "Traffic alert", 13);
        close(fd[1]);
        wait(NULL);
    }

    return 0;
}`
      }
    ],
    connection: "TrafficOS includes a simulated IPC message queue for controller communication, alerts and emergency-related messages.",
    reference: GFG
  },
  {
    id: "deadlocks",
    icon: "🔗",
    title: "Deadlocks",
    category: "Algorithms",
    summary: "Coffman conditions, wait-for graphs and recovery.",
    demo: "deadlock",
    chapters: [
      {
        title: "What is Deadlock?",
        content: `A deadlock occurs when a set of processes cannot
proceed because each is waiting for a resource or event
that another member of the set must release.

A typical example involves two processes, each holding
one lock while requesting the other's lock.`,
        diagram: [
          "P1 holds R1",
          "P1 waits for R2",
          "P2 holds R2",
          "P2 waits for R1"
        ]
      },
      {
        title: "Four Necessary Conditions",
        content: `Four conditions are necessary for resource deadlock:
mutual exclusion, hold and wait, no preemption, and
circular wait.

Preventing any one of these conditions prevents this
class of deadlock.`,
        points: [
          "Mutual exclusion: a resource cannot be shared freely.",
          "Hold and wait: a process holds resources while waiting.",
          "No preemption: resources cannot be forcibly reclaimed.",
          "Circular wait: processes form a cycle of dependencies."
        ]
      },
      {
        title: "Prevention, Avoidance and Detection",
        content: `Prevention restricts resource requests to eliminate
a necessary deadlock condition.

Avoidance checks whether a proposed allocation keeps
the system in a safe state. Banker's algorithm is a
classic avoidance method for multiple resource types
when maximum demands are known.

Detection allows allocation and periodically searches
for deadlocks. Recovery may terminate processes or
reclaim resources.

A cycle in a wait-for graph indicates deadlock when
the graph correctly represents single-instance resource
dependencies. General multi-instance cases require
more detailed analysis.`,
        points: [
          "Prevention: break a necessary condition.",
          "Avoidance: remain in safe states.",
          "Detection: find deadlocks after they occur.",
          "Recovery: terminate or reclaim resources."
        ]
      }
    ],
    connection: "The Deadlock Lab demonstrates simulated resource contention, detection and resolution. Its avoidance mode should not be treated as a full Banker's algorithm implementation unless a safe-state check is implemented.",
    reference: "https://www.geeksforgeeks.org/operating-systems/deadlock-in-operating-system/"
  },
  {
    id: "memory",
    icon: "🧠",
    title: "Memory Management",
    category: "Memory",
    summary: "Contiguous allocation, First Fit, Best Fit and Worst Fit.",
    demo: "memory",
    chapters: [
      {
        title: "Memory Allocation",
        content: `The OS tracks free and allocated memory and ensures
processes access only authorized regions.

In contiguous allocation, a process receives a single
continuous region. Free memory may be represented by
a list of holes or blocks.`,
        points: [
          "First Fit: choose the first sufficiently large hole.",
          "Best Fit: choose the smallest sufficient hole.",
          "Worst Fit: choose the largest available hole.",
          "Allocation strategy affects fragmentation."
        ]
      },
      {
        title: "Fragmentation and Compaction",
        content: `External fragmentation occurs when enough total free
memory exists but is divided into noncontiguous holes.

Internal fragmentation is wasted space inside an
allocated unit, often caused by fixed allocation sizes.

Compaction moves allocated regions to combine free
space, but requires suitable relocation support and
may be expensive.`,
        diagram: [
          "Used 20",
          "Free 10",
          "Used 15",
          "Free 25",
          "Compaction"
        ]
      },
      {
        title: "Allocation Example",
        content: `Suppose holes have sizes 100, 500, 200, 300 and 600,
and a process requests 212 units.

First Fit selects the 500-unit hole.
Best Fit selects the 300-unit hole.
Worst Fit selects the 600-unit hole.

This example assumes each hole can be split.`,
        points: [
          "First Fit: fast scan in a typical free-list implementation.",
          "Best Fit: may leave many small holes.",
          "Worst Fit: preserves smaller holes but can waste large ones."
        ]
      }
    ],
    connection: "The Memory page provides a block allocator with First Fit, Best Fit, Worst Fit, fragmentation and compaction demonstrations.",
    reference: GFG
  },
  {
    id: "virtual-memory",
    icon: "📚",
    title: "Virtual Memory",
    category: "Memory",
    summary: "Paging, page tables, page faults and replacement.",
    demo: "memory",
    chapters: [
      {
        title: "Virtual Address Spaces",
        content: `Virtual memory gives processes their own virtual
address spaces. The OS and hardware translate virtual
addresses into physical memory locations.

Paging divides virtual memory into pages and physical
memory into frames. Page tables record mappings and
protection information.`,
        diagram: [
          "Virtual Address",
          "Page Table",
          "Physical Frame"
        ]
      },
      {
        title: "Demand Paging and Page Faults",
        content: `Demand paging loads pages when needed rather than
requiring every page to be resident initially.

A page fault occurs when an access cannot be satisfied
using the current translation. The OS may need to load
a page from storage, update mappings, or reject an
invalid access.`,
        points: [
          "Page faults can be valid or invalid.",
          "Storage-backed page loading is much slower than RAM access.",
          "Thrashing occurs when excessive paging dominates useful work."
        ]
      },
      {
        title: "Page Replacement",
        content: `When no suitable free frame exists, the OS may need
to evict a resident page.

FIFO evicts the oldest loaded page. LRU approximates
recency of use. Optimal replacement evicts the page
used farthest in the future and serves as a theoretical
benchmark rather than a practical online algorithm.`,
        points: [
          "FIFO: simple queue-based replacement.",
          "LRU: recency-based replacement.",
          "Optimal: ideal benchmark with future knowledge."
        ]
      }
    ],
    connection: "TrafficOS currently demonstrates contiguous block allocation. Paging and page replacement are documentation topics, not yet implemented in the Memory simulator.",
    reference: GFG
  },
  {
    id: "files",
    icon: "📁",
    title: "File Systems",
    category: "Storage",
    summary: "Files, directories, allocation and permissions.",
    demo: null,
    chapters: [
      {
        title: "Files and Directories",
        content: `A file system organizes persistent data into files
and directories. It manages metadata, naming, allocation,
access permissions and storage-space tracking.

File operations include open, read, write, seek and close.`,
        points: [
          "Metadata may include size, timestamps and permissions.",
          "Directories map names to file-system objects.",
          "File descriptors identify open files within a process."
        ]
      },
      {
        title: "File Allocation Methods",
        content: `Contiguous allocation stores file blocks together.
Linked allocation chains blocks using pointers.
Indexed allocation uses a separate structure to
identify file blocks.

Modern file systems often use more advanced structures
such as extents and trees.`,
        diagram: ["File", "Metadata", "Storage Blocks"]
      },
      {
        title: "File I/O in C",
        content: `The C standard library provides portable file-stream
operations.`,
        code: `#include <stdio.h>

int main(void) {
    FILE *file = fopen("log.txt", "w");
    if (!file) {
        perror("fopen");
        return 1;
    }

    fprintf(file, "TrafficOS event\\n");
    fclose(file);
    return 0;
}`,
        codeNote: "Creates or overwrites log.txt in the working directory."
      }
    ],
    connection: "The TrafficOS Event Log is currently an in-memory event display. Persistent file-system simulation is a future feature.",
    reference: GFG
  },
  {
    id: "io",
    icon: "🔌",
    title: "I/O Management",
    category: "Storage",
    summary: "Interrupts, device drivers, buffering and spooling.",
    demo: "events",
    chapters: [
      {
        title: "Device Management",
        content: `The OS coordinates communication with devices
through device drivers and I/O subsystems.

Drivers translate higher-level requests into operations
supported by hardware controllers.`,
        points: [
          "Polling: repeatedly check device status.",
          "Interrupts: devices signal that attention is needed.",
          "DMA: hardware transfers data with limited CPU involvement."
        ]
      },
      {
        title: "Buffering, Caching and Spooling",
        content: `Buffering temporarily stores data while it moves
between components with different speeds.

Caching keeps copies of frequently accessed data
to reduce access latency.

Spooling queues work for a device that handles jobs
sequentially, such as a printer.`,
        diagram: ["Application", "I/O Buffer", "Device Driver", "Device"]
      }
    ],
    connection: "TrafficOS events can illustrate asynchronous notifications, but they are not hardware interrupts.",
    reference: GFG
  },
  {
    id: "disk",
    icon: "💽",
    title: "Disk Scheduling",
    category: "Algorithms",
    summary: "FCFS, SSTF, SCAN and C-SCAN.",
    demo: null,
    chapters: [
      {
        title: "Why Disk Scheduling?",
        content: `For traditional rotating hard drives, request
ordering can reduce seek movement and improve
throughput.

Disk scheduling is less directly applicable to SSDs,
which have no mechanical seek head, although storage
request scheduling still matters.`,
        points: [
          "FCFS: serve requests in arrival order.",
          "SSTF: serve the nearest pending cylinder.",
          "SCAN: move in one direction then reverse.",
          "C-SCAN: service in one direction and wrap around."
        ]
      },
      {
        title: "Example",
        content: `Suppose the disk head starts at cylinder 50 and
requests are 10, 20, 55 and 90.

FCFS order 10 → 20 → 55 → 90 produces movement:
40 + 10 + 35 + 35 = 120 cylinders.

SSTF starts with 55, then 90, then 20, then 10:
5 + 35 + 70 + 10 = 120 cylinders.

Equal totals in this example do not mean the
algorithms are generally equivalent.`,
        diagram: ["10", "20", "50 (head)", "55", "90"]
      }
    ],
    connection: "Disk scheduling is included in the learning hub. TrafficOS does not currently provide a disk-head simulator.",
    reference: GFG
  }
];

/* ==========================================================
   Rendering utilities
   ========================================================== */

const $ = id => document.getElementById(id);

const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

function paragraphs(value) {
  return String(value || "")
    .trim()
    .split(/\n\s*\n/)
    .map(p => `<p>${escapeHTML(p.replace(/\s+/g, " ").trim())}</p>`)
    .join("");
}

function renderDiagram(items) {
  if (!items?.length) return "";

  return `
    <div class="learn-diagram" aria-label="Concept flow diagram">
      ${items.map((item, index) => `
        ${index ? '<span class="learn-arrow">→</span>' : ""}
        <span class="learn-diagram-node">${escapeHTML(item)}</span>
      `).join("")}
    </div>
  `;
}

function renderChapter(chapter, index) {
  return `
    <article class="learn-chapter" id="learn-chapter-${index}">
      <div class="learn-chapter-number">
        SECTION ${String(index + 1).padStart(2, "0")}
      </div>
      <h3>${escapeHTML(chapter.title)}</h3>
      ${paragraphs(chapter.content)}
      ${chapter.points?.length ? `
        <ul class="learn-points">
          ${chapter.points.map(p => `<li>${escapeHTML(p)}</li>`).join("")}
        </ul>
      ` : ""}
      ${renderDiagram(chapter.diagram)}
      ${chapter.code ? `
        <div class="learn-code-head">
          <strong>C Example</strong>
          <button type="button" data-copy="${index}">Copy Code</button>
        </div>
        <pre class="learn-code"><code>${escapeHTML(chapter.code)}</code></pre>
        ${chapter.codeNote
          ? `<p class="learn-code-note">${escapeHTML(chapter.codeNote)}</p>`
          : ""}
      ` : ""}
    </article>
  `;
}

/* ==========================================================
   Application state and views
   ========================================================== */

let activeLesson = null;
let searchTerm = "";

function getVisibleLessons() {
  const query = searchTerm.trim().toLowerCase();

  if (!query) return lessons;

  return lessons.filter(lesson => {
    const searchable = [
      lesson.title,
      lesson.category,
      lesson.summary,
      ...lesson.chapters.flatMap(ch => [
        ch.title, ch.content, ...(ch.points || [])
      ])
    ].join(" ").toLowerCase();

    return searchable.includes(query);
  });
}

function renderHome() {
  activeLesson = null;

  const reader = $("learnReader");
  const cards = $("learnCards");
  const breadcrumb = $("learnBreadcrumb");
  const stats = $("learnStats");

  reader.hidden = true;
  cards.hidden = false;
  breadcrumb.innerHTML = `<span>Home / All OS Topics</span>`;

  const visible = getVisibleLessons();
  const totalChapters = lessons.reduce(
    (sum, lesson) => sum + lesson.chapters.length, 0
  );

  stats.innerHTML = `
    <div><strong>${lessons.length}</strong><span>Topics</span></div>
    <div><strong>${totalChapters}</strong><span>Sections</span></div>
    <div><strong>${lessons.filter(l =>
      l.chapters.some(ch => ch.code)).length}</strong><span>Topics with C Code</span></div>
    <div><strong>${visible.length}</strong><span>Search Results</span></div>
  `;

  cards.innerHTML = visible.length
    ? visible.map(lesson => `
        <button type="button"
                class="learn-topic-card"
                data-lesson="${lesson.id}">
          <span class="learn-topic-icon">${lesson.icon}</span>
          <span class="learn-topic-category">${escapeHTML(lesson.category)}</span>
          <strong>${escapeHTML(lesson.title)}</strong>
          <span class="learn-topic-summary">${escapeHTML(lesson.summary)}</span>
          <span class="learn-topic-footer">
            <span>${lesson.chapters.length} sections</span>
            <span>Explore →</span>
          </span>
        </button>
      `).join("")
    : `<div class="learn-empty">
         No lessons found. Try a different search term.
       </div>`;
}

function openLesson(id) {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) return;

  activeLesson = lesson;

  $("learnCards").hidden = true;
  $("learnReader").hidden = false;

  $("learnBreadcrumb").innerHTML = `
    <button type="button" data-learn-home>All Topics</button>
    <span> / ${escapeHTML(lesson.title)}</span>
  `;

  $("learnStats").innerHTML = `
    <div><strong>${lesson.chapters.length}</strong><span>Sections</span></div>
    <div><strong>${lesson.chapters.filter(ch =>
      ch.code).length}</strong><span>C Examples</span></div>
    <div><strong>${lesson.chapters.filter(ch =>
      ch.diagram).length}</strong><span>Diagrams</span></div>
  `;

  $("learnReader").innerHTML = `
    <div class="learn-lesson-header">
      <div class="learn-lesson-icon">${lesson.icon}</div>
      <div>
        <span class="learn-eyebrow">${escapeHTML(lesson.category)}</span>
        <h2>${escapeHTML(lesson.title)}</h2>
        <p>${escapeHTML(lesson.summary)}</p>
      </div>
    </div>

    <div class="learn-document-layout">
      <aside class="learn-toc">
        <h3>On this page</h3>
        ${lesson.chapters.map((ch, i) => `
          <button type="button" data-chapter="${i}">
            ${i + 1}. ${escapeHTML(ch.title)}
          </button>
        `).join("")}
      </aside>

      <div class="learn-document">
        ${lesson.chapters.map(renderChapter).join("")}

        <section class="learn-connection">
          <h3>🚦 Connection to TrafficOS Pune</h3>
          ${paragraphs(lesson.connection)}
          ${lesson.demo ? `
            <button type="button" data-demo="${lesson.demo}">
              Open ${escapeHTML(lesson.demo)} simulation →
            </button>
          ` : `<p>This topic does not yet have a dedicated simulation.</p>`}
        </section>

        <section class="learn-reference">
          <h3>Further Reading</h3>
          <p>Continue studying with GeeksforGeeks OS tutorials.</p>
          <a href="${escapeHTML(lesson.reference)}"
             target="_blank"
             rel="noopener noreferrer">
            Open GeeksforGeeks ↗
          </a>
        </section>

        <button type="button"
                class="learn-back-button"
                data-learn-home>
          ← Back to all topics
        </button>
      </div>
    </div>
  `;

  $("page-concepts").scrollIntoView({
    behavior: "instant",
    block: "start"
  });
}

/* ==========================================================
   Event handling
   ========================================================== */

function initializeLearningHub() {
  const root = $("page-concepts");
  if (!root) return;

  $("learnSearch").addEventListener("input", event => {
    searchTerm = event.target.value;
    renderHome();
  });

  $("learnHome").addEventListener("click", () => {
    $("learnSearch").value = "";
    searchTerm = "";
    renderHome();
  });

  root.addEventListener("click", async event => {
    const target = event.target.closest(
      "[data-lesson], [data-learn-home], [data-chapter], " +
      "[data-copy], [data-demo]"
    );

    if (!target) return;

    if (target.hasAttribute("data-lesson")) {
      openLesson(target.dataset.lesson);
      return;
    }

    if (target.hasAttribute("data-learn-home")) {
      renderHome();
      return;
    }

    if (target.hasAttribute("data-chapter")) {
      const chapter = $("learn-chapter-" + target.dataset.chapter);
      chapter?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return;
    }

    if (target.hasAttribute("data-copy")) {
      const index = Number(target.dataset.copy);
      const code = activeLesson?.chapters[index]?.code;

      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        target.textContent = "Copied!";
      } catch {
        target.textContent = "Copy unavailable";
      }

      setTimeout(() => {
        if (target.isConnected) target.textContent = "Copy Code";
      }, 1500);

      return;
    }

    if (target.hasAttribute("data-demo")) {
      const page = target.dataset.demo;

      // Reuse the application's existing navigation handler.
      document.querySelector(
        `.sidebar [data-page="${page}"]`
      )?.click();
    }
  });

  renderHome();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeLearningHub,
    { once: true }
  );
} else {
  initializeLearningHub();
}

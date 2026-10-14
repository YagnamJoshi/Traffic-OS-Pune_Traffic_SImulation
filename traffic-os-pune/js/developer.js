
/* ==========================================================
   TrafficOS Pune — Developer Hub
   File: js/developer.js
   ========================================================== */

// EDIT THIS OBJECT TO CUSTOMIZE YOUR PROJECT

const developerConfig = {
  projectName: "TrafficOS Pune",
  version: "1.0.0",
  status: "In Development",

  github: "",

  
team: [
  {
    name: "Yagnam Sanket Joshi",
    role: "Project Lead & System Architect",
    initials: "YSJ",
    description:
      "Leads the overall design and development of TrafficOS Pune, " +
      "focusing on system architecture, core simulation logic, " +
      "module integration, and interactive traffic management. " +
      "Coordinates development to ensure a unified and functional system.",
    skills: [
      "System Architecture",
      "JavaScript",
      "Traffic Simulation",
      "Module Integration",
      "OS Concepts"
    ],
    github: "",
    linkedin: "",
    portfolio: ""
  },
  {
    name: "Aarush Shah",
    role: "Frontend & UI/UX Developer",
    initials: "AS",
    description:
      "Contributes to the design and development of the TrafficOS " +
      "interface, including responsive layouts, interactive dashboards, " +
      "visual components, and user experience. Helps make complex " +
      "operating-system concepts accessible through clear visualizations.",
    skills: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "UI/UX Design",
      "Data Visualization"
    ],
    github: "",
    linkedin: "",
    portfolio: ""
  },
  {
    name: "Sharath Krishna",
    role: "OS Algorithms & Simulation Developer",
    initials: "SK",
    description:
      "Contributes to the implementation and testing of operating-system " +
      "concepts, including process scheduling, memory management, " +
      "inter-process communication, and deadlock handling. " +
      "Supports simulation accuracy, testing, and technical documentation.",
    skills: [
      "CPU Scheduling",
      "Memory Management",
      "IPC",
      "Deadlock Handling",
      "Testing & Documentation"
    ],
    github: "",
    linkedin: "",
    portfolio: ""
  }
],


  technologies: [
    {
      icon: "🌐",
      name: "HTML5",
      description: "Semantic structure and interface components."
    },
    {
      icon: "🎨",
      name: "CSS3",
      description: "Responsive layouts, themes and animations."
    },
    {
      icon: "⚡",
      name: "JavaScript",
      description: "Simulation logic, controls and state management."
    },
    {
      icon: "🗺️",
      name: "Canvas 2D",
      description: "Rendering roads, junctions and vehicles."
    },
    {
      icon: "📦",
      name: "ES Modules",
      description: "Organizing the project into separate modules."
    },
    {
      icon: "📱",
      name: "PWA",
      description: "Manifest and service-worker-based offline support."
    }
  ],

  milestones: [
    {
      title: "Project Foundation",
      description:
        "Dashboard, navigation and basic OS simulation.",
      status: "complete"
    },
    {
      title: "Interactive Traffic Map",
      description:
        "2D road network, vehicles, signals and map interactions.",
      status: "complete"
    },
    {
      title: "OS Learning Hub",
      description:
        "Topic cards, documentation, C examples and references.",
      status: "complete"
    },
    {
      title: "Advanced Traffic Simulation",
      description:
        "Real lane movement, collision avoidance and incident handling.",
      status: "planned"
    },
    {
      title: "Advanced OS Demonstrations",
      description:
        "Deeper scheduling, memory, IPC and deadlock experiments.",
      status: "planned"
    },
    {
      title: "3D Visualization",
      description:
        "Optional three-dimensional traffic visualization.",
      status: "future"
    }
  ]
};

function escapeDevHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeDevURL(value) {
  if (!value) return "";

  try {
    const url = new URL(value);

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function renderDeveloperStats() {
  const root = document.getElementById("devStats");
  if (!root) return;

  const stats = [
    {
      value: developerConfig.team.length,
      label: "Team Members",
      icon: "👨‍💻"
    },
    {
      value: 9,
      label: "Application Sections",
      icon: "🧩"
    },
    {
      value: 12,
      label: "OS Learning Topics",
      icon: "📚"
    },
    {
      value: "2D",
      label: "Traffic Visualization",
      icon: "🗺️"
    }
  ];

  root.innerHTML = stats.map(stat => `
    <div class="dev-stat-card">
      <span class="dev-stat-icon">${stat.icon}</span>
      <strong>${escapeDevHTML(stat.value)}</strong>
      <span>${escapeDevHTML(stat.label)}</span>
    </div>
  `).join("");
}

function renderDeveloperTeam() {
  const root = document.getElementById("devTeam");
  if (!root) return;

  root.innerHTML = developerConfig.team.map(member => {
    const links = [
      ["GitHub", member.github],
      ["LinkedIn", member.linkedin],
      ["Portfolio", member.portfolio]
    ]
      .filter(([, url]) => safeDevURL(url))
      .map(([label, url]) => `
        <a href="${escapeDevHTML(safeDevURL(url))}"
           target="_blank"
           rel="noopener noreferrer">
          ${label} ↗
        </a>
      `).join("");

    return `
      <article class="dev-person-card">
        <div class="dev-person-top">
          <div class="dev-avatar">
            ${escapeDevHTML(member.initials)}
          </div>

          <div>
            <h4>${escapeDevHTML(member.name)}</h4>
            <span>${escapeDevHTML(member.role)}</span>
          </div>
        </div>

        <p>${escapeDevHTML(member.description)}</p>

        <div class="dev-skills">
          ${member.skills.map(skill => `
            <span>${escapeDevHTML(skill)}</span>
          `).join("")}
        </div>

        ${links ? `
          <div class="dev-social-links">${links}</div>
        ` : ""}
      </article>
    `;
  }).join("");
}

function renderDeveloperTech() {
  const root = document.getElementById("devTech");
  if (!root) return;

  root.innerHTML = developerConfig.technologies.map(tech => `
    <article class="dev-tech-card">
      <div class="dev-tech-icon">${tech.icon}</div>
      <h4>${escapeDevHTML(tech.name)}</h4>
      <p>${escapeDevHTML(tech.description)}</p>
    </article>
  `).join("");
}

function renderDeveloperRoadmap() {
  const root = document.getElementById("devRoadmap");
  if (!root) return;

  const labels = {
    complete: "Completed",
    planned: "Planned",
    future: "Future"
  };

  root.innerHTML = developerConfig.milestones.map((item, i) => `
    <article class="dev-roadmap-item">
      <div class="dev-roadmap-marker">
        ${item.status === "complete" ? "✓" : i + 1}
      </div>

      <div class="dev-roadmap-content">
        <div class="dev-roadmap-title">
          <h4>${escapeDevHTML(item.title)}</h4>
          <span class="dev-status dev-status-${item.status}">
            ${labels[item.status] || "Planned"}
          </span>
        </div>

        <p>${escapeDevHTML(item.description)}</p>
      </div>
    </article>
  `).join("");
}

function initializeDeveloperHub() {
  if (!document.getElementById("page-developer")) return;

  renderDeveloperStats();
  renderDeveloperTeam();
  renderDeveloperTech();
  renderDeveloperRoadmap();

  const navigate = page => {
    document.querySelector(
      `.sidebar [data-page="${page}"]`
    )?.click();
  };

  document.getElementById("devExploreSimulation")
    ?.addEventListener("click", () => navigate("simulation"));

  document.getElementById("devExploreConcepts")
    ?.addEventListener("click", () => navigate("concepts"));

  document.getElementById("devOpenDocs")
    ?.addEventListener("click", () => navigate("concepts"));

  const githubLink = document.getElementById("devGithubLink");
  const githubURL = safeDevURL(developerConfig.github);

  if (githubLink && githubURL) {
    githubLink.href = githubURL;
    githubLink.hidden = false;
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeDeveloperHub,
    { once: true }
  );
} else {
  initializeDeveloperHub();
}

/********************************************************************
 * TrafficOS Pune
 * app.js
 *
 * Main Application Bootstrap
 ********************************************************************/

import { state } from "./state.js";

import {
    initializeSimulation,
    simulationLoop,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    triggerEmergencyScenario,
    triggerDeadlockScenario,
    triggerFailureScenario,
    triggerRushHour
} from "./simulation.js";

import {
    initializeUI,
    renderUI
} from "./ui.js";

/********************************************************************
 * PAGE NAVIGATION
 ********************************************************************/

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            "[data-page]"
        );

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const page =
                    item.dataset.page;

                switchPage(page);
            }
        );

    });

}

function switchPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active"
            );

        });

    const page =
        document.getElementById(
            `page-${pageName}`
        );

    if (page) {

        page.classList.add(
            "active"
        );
    }

    state.currentPage =
        pageName;
}

/********************************************************************
 * CONTROLS
 ********************************************************************/

function initializeControls() {

    const btnStart =
        document.getElementById(
            "btnStart"
        );

    const btnPause =
        document.getElementById(
            "btnPause"
        );

    const btnReset =
        document.getElementById(
            "btnReset"
        );

    const btnEmergency =
        document.getElementById(
            "btnEmergency"
        );

    const btnDeadlock =
        document.getElementById(
            "btnDeadlock"
        );

    const btnFailure =
        document.getElementById(
            "btnFailure"
        );

    const btnRushHour =
        document.getElementById(
            "btnRushHour"
        );

    if (btnStart) {

        btnStart.addEventListener(
            "click",
            startSimulation
        );
    }

    if (btnPause) {

        btnPause.addEventListener(
            "click",
            pauseSimulation
        );
    }

    if (btnReset) {

        btnReset.addEventListener(
            "click",
            resetSimulation
        );
    }

    if (btnEmergency) {

        btnEmergency.addEventListener(
            "click",
            triggerEmergencyScenario
        );
    }

    if (btnDeadlock) {

        btnDeadlock.addEventListener(
            "click",
            triggerDeadlockScenario
        );
    }

    if (btnFailure) {

        btnFailure.addEventListener(
            "click",
            triggerFailureScenario
        );
    }

    if (btnRushHour) {

        btnRushHour.addEventListener(
            "click",
            triggerRushHour
        );
    }

}

/********************************************************************
 * SPEED CONTROLS
 ********************************************************************/

function initializeSpeedControls() {

    document
        .querySelectorAll(
            "[data-speed]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const speed =
                        Number(
                            button.dataset.speed
                        );

                    state.speed =
                        speed;

                    document
                        .querySelectorAll(
                            "[data-speed]"
                        )
                        .forEach(b => {

                            b.classList.remove(
                                "active"
                            );

                        });

                    button.classList.add(
                        "active"
                    );
                }
            );

        });

}

/********************************************************************
 * REALTIME UI LOOP
 ********************************************************************/

function startRenderLoop() {

    function renderFrame() {

        renderUI();

        requestAnimationFrame(
            renderFrame
        );
    }

    renderFrame();
}

/********************************************************************
 * BOOT SEQUENCE
 ********************************************************************/

function runBootSequence() {

    const boot =
        document.getElementById(
            "bootScreen"
        );

    const app =
        document.getElementById(
            "application"
        );

    const bootText =
        document.getElementById(
            "bootText"
        );

    const lines = [

        "Initializing Process Manager...OK",

        "Initializing Scheduler...OK",

        "Initializing Memory Manager...OK",

        "Initializing IPC Manager...OK",

        "Initializing Traffic Engine...OK",

        "Initializing Emergency Services...OK",

        "Loading Pune Network...OK",

        "System Ready"
    ];

    let index = 0;

    const interval =
        setInterval(() => {

            if (
                bootText
            ) {

                bootText.innerHTML +=
                    lines[index] +
                    "<br>";
            }

            index++;

            if (
                index >= lines.length
            ) {

                clearInterval(
                    interval
                );

                setTimeout(() => {

                    if (boot) {

                        boot.style.display =
                            "none";
                    }

                    if (app) {

                        app.style.display =
                            "flex";
                    }

                    initializeApplication();

                }, 1000);
            }

        }, 350);
}

/********************************************************************
 * MAIN INIT
 ********************************************************************/

function initializeApplication() {

    initializeSimulation();

    initializeUI();

    initializeNavigation();

    initializeControls();

    initializeSpeedControls();

    startSimulation();

    startRenderLoop();

    requestAnimationFrame(
        simulationLoop
    );

    console.log(
        "TrafficOS Pune started."
    );

}

/********************************************************************
 * DOM READY
 ********************************************************************/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        runBootSequence();

    }
);
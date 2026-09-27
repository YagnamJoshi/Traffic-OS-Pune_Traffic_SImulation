/*******************************************************************
 * TrafficOS Pune
 * traffic.js
 *
 * TRAFFIC ENGINE
 *
 * PART 1
 *
 * Contains:
 * - Junctions
 * - Roads
 * - Signals
 * - Weather
 * - Time Of Day
 * - Metro Stations
 * - Roadblocks
 * - Route Graph
 *
 *******************************************************************/

import {
    state,
    generateEvent
} from "./state.js";
import {
    createEmergencyProcess
} from "./processManager.js";

/*******************************************************************
 * TIME OF DAY
 *******************************************************************/

export const TIME_PERIODS = {

    EARLY_MORNING:
        "EARLY_MORNING",

    MORNING:
        "MORNING",

    AFTERNOON:
        "AFTERNOON",

    EVENING:
        "EVENING",

    NIGHT:
        "NIGHT"
};

/*******************************************************************
 * WEATHER
 *******************************************************************/

export const WEATHER = {

    CLEAR:
        "CLEAR",

    RAIN:
        "RAIN",

    FOG:
        "FOG"
};

state.traffic.timeOfDay =
    TIME_PERIODS.MORNING;

state.traffic.weather =
    WEATHER.CLEAR;

/*******************************************************************
 * JUNCTIONS
 *******************************************************************/

export function initializeJunctions() {

    state.traffic.junctions = [

        {
            id: "P01",

            name: "Deccan",

            x: 250,
            y: 180,

            load: 0,

            signal: "GREEN",

            signalTimer: 0
        },

        {
            id: "P02",

            name: "FC Road",

            x: 500,
            y: 180,

            load: 0,

            signal: "RED",

            signalTimer: 0
        },

        {
            id: "P03",

            name: "JM Road",

            x: 750,
            y: 180,

            load: 0,

            signal: "GREEN",

            signalTimer: 0
        },

        {
            id: "P04",

            name: "Shivajinagar",

            x: 1000,
            y: 180,

            load: 0,

            signal: "RED",

            signalTimer: 0
        },

        {
            id: "P05",

            name: "Kothrud",

            x: 250,
            y: 500,

            load: 0,

            signal: "GREEN",

            signalTimer: 0
        },

        {
            id: "P06",

            name: "Baner",

            x: 750,
            y: 500,

            load: 0,

            signal: "GREEN",

            signalTimer: 0
        },

        {
            id: "P07",

            name: "Hinjawadi",

            x: 1000,
            y: 500,

            load: 0,

            signal: "RED",

            signalTimer: 0
        },

        {
            id: "P08",

            name: "Kalyani Nagar",

            x: 500,
            y: 780,

            load: 0,

            signal: "GREEN",

            signalTimer: 0
        }
    ];

    generateEvent(
        "TRAFFIC",
        "MAP",
        "Junction network initialized.",
        "Pune-inspired city loaded.",
        "Traffic Network"
    );
}

/*******************************************************************
 * ROADS
 *******************************************************************/

export function initializeRoads() {

    state.traffic.roads = [

        {
            id: "R01",

            from: "P01",

            to: "P02",

            capacity: 18,

            congestion: 0
        },

        {
            id: "R02",

            from: "P02",

            to: "P03",

            capacity: 18,

            congestion: 0
        },

        {
            id: "R03",

            from: "P03",

            to: "P04",

            capacity: 15,

            congestion: 0
        },

        {
            id: "R04",

            from: "P01",

            to: "P05",

            capacity: 16,

            congestion: 0
        },

        {
            id: "R05",

            from: "P02",

            to: "P08",

            capacity: 20,

            congestion: 0
        },

        {
            id: "R06",

            from: "P03",

            to: "P06",

            capacity: 15,

            congestion: 0
        },

        {
            id: "R07",

            from: "P04",

            to: "P07",

            capacity: 12,

            congestion: 0
        },

        {
            id: "R08",

            from: "P05",

            to: "P06",

            capacity: 15,

            congestion: 0
        },

        {
            id: "R09",

            from: "P06",

            to: "P07",

            capacity: 14,

            congestion: 0
        }
    ];

}

/*******************************************************************
 * METRO STATIONS
 *******************************************************************/

export function initializeMetroStations() {

    state.traffic.metroStations = [

        {
            name: "Deccan Metro",

            x: 290,

            y: 140
        },

        {
            name:
                "Shivajinagar Metro",

            x: 1030,

            y: 140
        },

        {
            name:
                "Kalyani Metro",

            x: 560,

            y: 760
        }
    ];

}

/*******************************************************************
 * GRAPH
 *******************************************************************/

export function getConnectedJunctions(
    junctionId
) {

    const result = [];

    state.traffic.roads.forEach(
        road => {

            if (
                road.from ===
                junctionId
            ) {

                result.push(
                    road.to
                );
            }

            if (
                road.to ===
                junctionId
            ) {

                result.push(
                    road.from
                );
            }

        }
    );

    return result;
}

/*******************************************************************
 * PATHFINDER
 *******************************************************************/

export function findSimpleRoute(
    start,
    destination
) {

    if (
        start === destination
    ) {

        return [start];
    }

    const visited = new Set();

    const queue = [

        {
            node: start,

            path: [start]
        }
    ];

    while (
        queue.length > 0
    ) {

        const current =
            queue.shift();

        if (
            current.node ===
            destination
        ) {

            return current.path;
        }

        visited.add(
            current.node
        );

        const neighbors =
            getConnectedJunctions(
                current.node
            );

        neighbors.forEach(
            neighbor => {

                if (
                    !visited.has(
                        neighbor
                    )
                ) {

                    queue.push({

                        node:
                            neighbor,

                        path: [

                            ...current.path,

                            neighbor
                        ]
                    });
                }

            }
        );
    }

    return [start];
}

/*******************************************************************
 * SIGNAL ENGINE
 *******************************************************************/

export function updateSignals() {

    state.traffic.junctions
        .forEach(junction => {

            junction.signalTimer++;

            if (
                state.emergency.active
            ) {

                return;
            }

            if (
                junction.signalTimer > 280
            ) {

                junction.signal =
                    junction.signal ===
                    "GREEN"
                        ? "RED"
                        : "GREEN";

                junction.signalTimer = 0;

                state.statistics
                    .signalChanges++;

            }

        });

}

/*******************************************************************
 * GREEN CORRIDOR
 *******************************************************************/

export function activateGreenCorridor(
    route
) {

    route.forEach(
        junctionId => {

            const junction =
                state.traffic.junctions.find(
                    j =>
                        j.id ===
                        junctionId
                );

            if (
                junction
            ) {

                junction.signal =
                    "GREEN";
            }
        }
    );

    generateEvent(
        "TRAFFIC",
        "P07",
        "Green corridor activated.",
        "Traffic signals prepared for ambulance route.",
        "Emergency Traffic Management"
    );
}

/*******************************************************************
 * ROADBLOCKS
 *******************************************************************/

export function createRoadBlock(
    roadId
) {

    const road =
        state.traffic.roads.find(
            r =>
                r.id === roadId
        );

    if (!road)
        return;

    state.traffic.roadBlocks.push({

        roadId,

        createdAt:
            state.simulationTime
    });

    generateEvent(
        "TRAFFIC",
        roadId,
        "Roadblock created.",
        "Vehicles must reroute around blockage.",
        "Traffic Control"
    );
}

/*******************************************************************
 * REMOVE ROADBLOCK
 *******************************************************************/

export function removeRoadBlock(
    roadId
) {

    state.traffic.roadBlocks =
        state.traffic.roadBlocks.filter(
            r =>
                r.roadId !== roadId
        );

    generateEvent(
        "TRAFFIC",
        roadId,
        "Roadblock removed.",
        "Traffic restored.",
        "Traffic Recovery"
    );
}

/*******************************************************************
 * WEATHER
 *******************************************************************/

export function setWeather(type) {

    state.traffic.weather =
        type;

    generateEvent(
        "TRAFFIC",
        "Weather Engine",
        `Weather changed to ${type}`,
        "Traffic conditions updated.",
        "Environmental Effects"
    );
}

/*******************************************************************
 * SIMULATED WEATHER
 *******************************************************************/

export function weatherTick() {

    if (
        Math.random() < 0.0008
    ) {

        const types = [

            WEATHER.CLEAR,

            WEATHER.RAIN,

            WEATHER.FOG
        ];

        const randomWeather =
            types[
                Math.floor(
                    Math.random() *
                    types.length
                )
            ];

        setWeather(
            randomWeather
        );
    }
}

/*******************************************************************
 * TIME SYSTEM
 *******************************************************************/

export function updateTimeOfDay() {

    const currentHour =
        Math.floor(
            (state.simulationTime / 60)
            % 24
        );

    if (
        currentHour >= 6 &&
        currentHour < 11
    ) {

        state.traffic.timeOfDay =
            TIME_PERIODS.MORNING;

    } else if (

        currentHour < 17

    ) {

        state.traffic.timeOfDay =
            TIME_PERIODS.AFTERNOON;

    } else if (

        currentHour < 21

    ) {

        state.traffic.timeOfDay =
            TIME_PERIODS.EVENING;

    } else {

        state.traffic.timeOfDay =
            TIME_PERIODS.NIGHT;
    }

}

/*******************************************************************
 * CITY INITIALIZATION
 *******************************************************************/

export function initializeTrafficSystem() {

    initializeJunctions();

    initializeRoads();

    initializeMetroStations();

    generateEvent(
        "SYSTEM",
        "Traffic Engine",
        "Traffic network ready.",
        "Roads, signals and metro infrastructure online.",
        "Traffic Management"
    );
}

/*******************************************************************
 * PART 2
 *
 * Vehicles
 * Ambulances
 * Congestion
 * Spawning
 * Road Capacity
 * Traffic Statistics
 * Traffic Tick
 *******************************************************************/


/*******************************************************************
 * VEHICLE TYPES
 *******************************************************************/

export const VEHICLE_TYPES = {

    CAR: "CAR",

    AUTO: "AUTO",

    BUS: "BUS",

    AMBULANCE: "AMBULANCE"
};

let vehicleCounter = 1;

/*******************************************************************
 * VEHICLE ID
 *******************************************************************/

function createVehicleId() {

    const id =
        "V" +
        String(vehicleCounter)
            .padStart(5, "0");

    vehicleCounter++;

    return id;
}

/*******************************************************************
 * VEHICLE SPEED
 *******************************************************************/

function getVehicleSpeed(type) {

    let speed = 2;

    switch (type) {

        case VEHICLE_TYPES.AUTO:

            speed = 1.5;
            break;

        case VEHICLE_TYPES.BUS:

            speed = 1.2;
            break;

        case VEHICLE_TYPES.AMBULANCE:

            speed = 4;
            break;
    }

    if (
        state.traffic.weather === "RAIN"
    ) {

        speed *= 0.75;
    }

    if (
        state.traffic.weather === "FOG"
    ) {

        speed *= 0.65;
    }

    return speed;
}

/*******************************************************************
 * RANDOM JUNCTION
 *******************************************************************/

function randomJunction() {

    return state.traffic.junctions[
        Math.floor(
            Math.random() *
            state.traffic.junctions.length
        )
    ];
}

/*******************************************************************
 * CREATE VEHICLE
 *******************************************************************/

export function spawnVehicle(
    type = VEHICLE_TYPES.CAR
) {

    let start =
        randomJunction();

    let destination =
        randomJunction();

    while (
        destination.id === start.id
    ) {

        destination =
            randomJunction();
    }

    const route =
        findSimpleRoute(
            start.id,
            destination.id
        );

    const vehicle = {

        id: createVehicleId(),

        type,

        x: start.x,

        y: start.y,

        currentNode: 0,

        route,

        speed:
            getVehicleSpeed(type),

        waitingTime: 0,

        journeyTime: 0,

        completed: false,

        destination:
            destination.id
    };

    state.traffic.vehicles.push(
        vehicle
    );

    state.statistics
        .vehiclesSpawned++;

    return vehicle;
}

/*******************************************************************
 * SPAWN AUTO
 *******************************************************************/

export function spawnAuto() {

    return spawnVehicle(
        VEHICLE_TYPES.AUTO
    );
}

/*******************************************************************
 * SPAWN BUS
 *******************************************************************/

export function spawnBus() {

    return spawnVehicle(
        VEHICLE_TYPES.BUS
    );
}

/*******************************************************************
 * SPAWN AMBULANCE
 *******************************************************************/

export function spawnAmbulance() {

    const origin =
        "P01";

    const destination =
        "P04";

    const route =
        findSimpleRoute(
            origin,
            destination
        );

    const start =
        state.traffic.junctions.find(
            j => j.id === origin
        );

    if (
        !start ||
        route.length === 0
    ) {
        return null;
    }

    const ambulance = {

        id: "AMB-1",

        type:
            VEHICLE_TYPES.AMBULANCE,

        x: start.x,

        y: start.y,

        currentNode: 0,

        route,

        speed: 4,

        emergency: true,

        completed: false
    };

    state.emergency.active =
        true;

    state.emergency.route =
        route;

    state.traffic.vehicles.push(
        ambulance
    );

    createEmergencyProcess();

    activateGreenCorridor(
        route
    );

    generateEvent(
        "EMERGENCY",
        "P07",
        "Ambulance dispatched.",
        "Emergency service activated.",
        "Priority Scheduling"
    );

    return ambulance;
}

/*******************************************************************
 * ROAD CAPACITY
 *******************************************************************/

export function updateRoadCapacity() {

    state.traffic.roads.forEach(
        road => {

            road.congestion = 0;
        }
    );

    state.traffic.vehicles.forEach(
        vehicle => {

            if (
                vehicle.route.length < 2
            ) return;

            const from =
                vehicle.route[
                    vehicle.currentNode
                ];

            const to =
                vehicle.route[
                    vehicle.currentNode + 1
                ];

            const road =
                state.traffic.roads.find(

                    r =>
                        (
                            r.from === from &&
                            r.to === to
                        ) ||

                        (
                            r.to === from &&
                            r.from === to
                        )
                );

            if (road) {

                road.congestion++;
            }
        }
    );
}

/*******************************************************************
 * VEHICLE MOVEMENT
 *******************************************************************/

function moveVehicle(vehicle) {

    if (
        vehicle.completed
    ) return;

    if (
        vehicle.currentNode >=
        vehicle.route.length - 1
    ) {

        vehicle.completed = true;

        state.statistics
            .vehiclesCompleted++;

        generateEvent(
            "TRAFFIC",
            vehicle.id,
            `${vehicle.id} completed route`,
            "Vehicle reached destination.",
            "Traffic Flow"
        );

        return;
    }

    const current =
        state.traffic.junctions.find(
            j =>
                j.id ===
                vehicle.route[
                    vehicle.currentNode
                ]
        );

    const target =
        state.traffic.junctions.find(
            j =>
                j.id ===
                vehicle.route[
                    vehicle.currentNode + 1
                ]
        );

    if (
        !current ||
        !target
    ) return;

    const dx =
        target.x - vehicle.x;

    const dy =
        target.y - vehicle.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (
        distance < 10
    ) {

        vehicle.currentNode++;

        return;
    }

    let speed =
        vehicle.speed;

    if (
        target.signal === "RED" &&
        vehicle.type !==
        VEHICLE_TYPES.AMBULANCE
    ) {

        vehicle.waitingTime++;

        return;
    }

    vehicle.x +=
        (dx / distance) *
        speed;

    vehicle.y +=
        (dy / distance) *
        speed;

    vehicle.journeyTime++;
}

/*******************************************************************
 * REMOVE FINISHED
 *******************************************************************/

function cleanupVehicles() {

    state.traffic.vehicles =
        state.traffic.vehicles.filter(
            v => !v.completed
        );
}

/*******************************************************************
 * CONGESTION
 *******************************************************************/

export function calculateCongestion() {

    let totalCapacity = 0;

    let totalUsage = 0;

    state.traffic.roads.forEach(
        road => {

            totalCapacity +=
                road.capacity;

            totalUsage +=
                road.congestion;
        }
    );

    state.traffic.congestionPercent =
        totalCapacity > 0
            ? Math.min(
                100,
                Math.floor(
                    (
                        totalUsage /
                        totalCapacity
                    ) * 100
                )
            )
            : 0;

    if (
        state.traffic
            .congestionPercent > 70
    ) {

        generateEvent(
            "TRAFFIC",
            "Network",
            "High congestion detected.",
            "Road network heavily loaded.",
            "Traffic Congestion"
        );
    }
}

/*******************************************************************
 * AUTO SPAWNER
 *******************************************************************/

export function automaticVehicleSpawner() {

    let chance = 0.03;

    switch (
        state.traffic.timeOfDay
    ) {

        case TIME_PERIODS.MORNING:

            chance = 0.08;
            break;

        case TIME_PERIODS.EVENING:

            chance = 0.06;
            break;

        case TIME_PERIODS.NIGHT:

            chance = 0.01;
            break;
    }

    if (
        Math.random() < chance
    ) {

        const rand =
            Math.random();

        if (
            rand > 0.9
        ) {

            spawnBus();

        } else if (
            rand > 0.7
        ) {

            spawnAuto();

        } else {

            spawnVehicle();
        }
    }
}

/*******************************************************************
 * TRAFFIC ANALYTICS
 *******************************************************************/

export function updateTrafficAnalytics() {

    const count =
        state.traffic.vehicles.length;

    state.charts.vehicleHistory.push(
        count
    );

    if (
        state.charts
            .vehicleHistory.length > 100
    ) {

        state.charts
            .vehicleHistory.shift();
    }

    state.charts
        .congestionHistory.push(

            state.traffic
                .congestionPercent
        );

    if (
        state.charts
            .congestionHistory.length > 100
    ) {

        state.charts
            .congestionHistory.shift();
    }
}

/*******************************************************************
 * TRAFFIC TICK
 *******************************************************************/

export function trafficTick() {

    updateSignals();

    updateTimeOfDay();

    weatherTick();

    automaticVehicleSpawner();

    state.traffic.vehicles.forEach(
        moveVehicle
    );

    cleanupVehicles();

    updateRoadCapacity();

    calculateCongestion();

    updateTrafficAnalytics();
}
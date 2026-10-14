const CACHE_NAME = "trafficos-v10";

const FILES_TO_CACHE = [

    "./",
    "./index.html",

    "./css/style.css",

    "./js/app.js",
    "./js/state.js",
    "./js/processManager.js",
    "./js/scheduler.js",
    "./js/memoryManager.js",
    "./js/ipcManager.js",
    "./js/traffic.js",
    "./js/simulation.js",
    "./js/ui.js",
    "./js/developer.js",
    "./js/processHub.js",
    "./js/schedulerLab.js",
    "./js/memoryLab.js",
    "./js/ipcCenter.js",
    "./js/osConcepts.js"
];

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        FILES_TO_CACHE
                    );

                })
        );

    }
);

self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )
            .then(response => {

                return (
                    response ||
                    fetch(event.request)
                );

            })
        );

    }
);

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(names => {

                    return Promise.all(

                        names
                            .filter(
                                name =>
                                name !== CACHE_NAME
                            )
                            .map(
                                name =>
                                caches.delete(name)
                            )

                    );

                })
        );

    }
);
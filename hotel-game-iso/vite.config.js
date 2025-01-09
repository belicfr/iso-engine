import {defineConfig} from "vite";

export default defineConfig({
    resolve: {
        alias: {
            "pixi.js": "/node_modules/pixi.js/dist/pixi.mjs",
        },
    },
    server: {
        port: 3000,
    },
});
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as path from "node:path";
import * as fs from "node:fs";
import {fileURLToPath} from "url";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crée un serveur HTTP de base
const httpServer = createServer();

// Initialise Socket.IO sur ce serveur
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",  // Autorise les connexions depuis ce domaine
        methods: ["GET", "POST"]
    }
});

const furnisDir = path.join(__dirname, "../public/assets/medium_furnis/env_furni");

// Écoute l'événement de connexion
io.on('connection', (socket) => {
    console.log(`Connected : ${socket.id}`);

    socket.on("get furnis", () => {
        console.log("Attempt: Get Furnis");

        fs.readdir(furnisDir, (err, files) => {
            if (err) {
                console.error("Error on Furni Loading:", err);
                return;
            }

            config(furnisConfig => {
                console.log("Processed Furnis Config:", furnisConfig);

                const furniSource = files.filter(file => {
                    const furniPath = path.join(furnisDir, file);

                    return fs.statSync(furniPath).isDirectory()
                        && furnisConfig.load.includes(file)
                        && file.endsWith(".furni");
                }).map(file => {
                    const furniPath = path.join(furnisDir, file);
                    const furniFiles = fs.readdirSync(furniPath);

                    return {
                        directory: path.join("/assets/medium_furnis/env_furni", file),
                        files: furniFiles.map(f => path.join("/assets/medium_furnis/env_furni", file, f))
                    };
                });

                socket.emit("retrieve furnis", furniSource);
            });
        });
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Disconnected : ${socket.id}`);
    });

    function config(cb) {
        const configPath = path.join(furnisDir, "furnis.json");

        fs.access(configPath, fs.constants.F_OK,err => {
            if (err) {
                console.error("Error on Furni configuration loading:", err);
                return;
            }

            fs.readFile(configPath, 'utf8', (err, data) => {
                cb(JSON.parse(data));
            });
        });
    }
});

// Le serveur écoute sur le port 4000
httpServer.listen(4000, () => {
    console.log('Serveur Socket.IO lancé sur http://localhost:4000');
});

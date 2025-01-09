import {Application, Assets, Polygon, SCALE_MODES, Sprite} from './libs/pixi.mjs';

import Navigation from "./navigation/Navigation.js";
import Inventory from "./navigation/Inventory.js";

import './libs/socket.io.js';
export const io = window.io;

(async () => {
    const socket = io('http://localhost:4000');

    const app = new Application();

    await app.init({
        resizeTo: window,
        antialias: false,
        resolution: 1,
    });

    document.body.appendChild(app.canvas);

    // TILES
    const tileSize = { width: 72, height: 36 };
    const gridSize = { rows: 5, cols: 5 };

    const tiles = [];
    const occupiedTiles = [];

    let hoverTile;
    let scaleFactor = 1;

    let isDragging = false;
    let hasMoved = false;
    let dragStart = { x: 0, y: 0 };
    let stageStart = { x: 0, y: 0 };

    let isFurnisLoaded = false;
    let selectedFurni = null;


    /*
     * Floor Assets
     */

    (await Assets.load('/assets/medium_tiles/floor_tile/floor_tile.png'))
        .baseTexture.scaleMode = "nearest";

    (await Assets.load('/assets/medium_tiles/hover_tile/hover_tile.png'))
        .baseTexture.scaleMode = "nearest";


    /*
     * Furnis Assets
     */

    socket.on("retrieve furnis", source => {
        console.log("Retrieved Furni Source:", source);

        source.forEach(furniSource => {
            Navigation.furnis.push(furniSource);
        });
    });

    loadFurnis();


    Navigation.initializeNavigation();


    // Décalage initial pour centrer la grille
    const gridWidth = (gridSize.cols + gridSize.rows) * (tileSize.width / 4);
    const gridHeight = (gridSize.cols + gridSize.rows) * (tileSize.height / 2);

    app.stage.x = (app.renderer.width / 2) - (gridWidth / 4);
    app.stage.y = (app.renderer.height / 2) - (gridHeight / 2);

    createHoverTile();

    for (let y = 0; y < gridSize.rows; y++) {
        for (let x = 0; x < gridSize.cols; x++) {
            const isoX = (x - y) * (tileSize.width / 2);
            const isoY = (x + y) * (tileSize.height / 2);

            const tile = new Sprite(
                Assets.get("/assets/medium_tiles/floor_tile/floor_tile.png")
            );

            tile.hitArea = new Polygon([
                0, tileSize.height / 2,
                tileSize.width / 2, 0,
                tileSize.width, tileSize.height / 2,
                tileSize.width / 2, tileSize.height
            ]);

            tile.anchor.set(0.5, 0.5);  // Centre la tuile
            tile.x = isoX;
            tile.y = isoY;
            tile.alpha = 1;
            tile.interactive = true;

            tile.gridX = x;
            tile.gridY = y;

            app.stage.addChild(tile);
            tiles.push(tile);
        }
    }

    app.stage.eventMode = 'static';
    app.stage.interactiveChildren = true;



    class IsoObject {
        constructor(texture, gridX, gridY, width, height, offsetX = 0, offsetY = 0) {
            this.sprite = new Sprite(texture);
            this.gridX = gridX;   // Position de base en X
            this.gridY = gridY;   // Position de base en Y
            this.width = width;   // Largeur en tuiles
            this.height = height; // Hauteur en tuiles
            this.offsetX = offsetX;
            this.offsetY = (this.sprite.height / 4) + offsetY;

            this.sprite.anchor.set(0.5, 1);  // Centre bas
            this.updatePosition();
        }

        // Met à jour la position sur la grille
        updatePosition() {
            const isoPos = isoToScreen(this.gridX, this.gridY, tileSize);
            this.sprite.x = isoPos.isoX + this.offsetX;
            this.sprite.y = isoPos.isoY + this.offsetY;   // FIXME: custom offset y always mid y
            console.log(this.sprite.y);
            this.sprite.zIndex = this.gridY + this.gridX;  // Empilement correct
        }
    }



    // Zoom avec la molette
    app.canvas.addEventListener('wheel', (event) => {
        const zoomSpeed = 0.1;
        const scrollThreshold = 5;

        if (Math.abs(event.deltaY) > scrollThreshold) {
            const oldScale = scaleFactor;

            if (event.deltaY < 0) {
                scaleFactor += zoomSpeed;
            } else {
                scaleFactor -= zoomSpeed;
            }

            scaleFactor = Math.max(0.5, Math.min(5, scaleFactor));

            const mousePosition = app.renderer.events.pointer.global;

            const newX = mousePosition.x - (mousePosition.x - app.stage.x) * (scaleFactor / oldScale);
            const newY = mousePosition.y - (mousePosition.y - app.stage.y) * (scaleFactor / oldScale);

            app.stage.scale.set(scaleFactor);
            app.stage.position.set(newX, newY);
        }
        event.preventDefault();
    });

    // Gestion des déplacements du stage
    app.stage.on('pointermove', (event) => {
        if (isDragging) {
            onDragMove(event);
        }

        const { x, y } = event.data.global;
        const gridPos = screenToIso(x, y, tileSize, app);

        updateHoverTile(gridPos.x, gridPos.y);
    });

    app.stage.on('pointerdown', (event) => {
        onDragStart(event);
    });

    app.stage.on('pointerup', (event) => {
        if (!hasMoved) {
            const { x, y } = event.data.global;
            const gridPos = screenToIso(x, y, tileSize, app);
            // placeTile(gridPos.x, gridPos.y);

            console.log(Inventory.selectedFurni, Assets.get(Inventory.selectedFurni));

            const furni = new IsoObject(
                Assets.get(Inventory.selectedFurni),
                gridPos.x, gridPos.y,
                1, 1,
                0, 0
            );

            placeObject(furni);
        }

        onDragEnd();
    });

    app.stage.on("pointerupoutside", onDragEnd);




    function updateHoverTile(gridX, gridY) {
        gridX = Math.max(0, Math.min(gridSize.cols - 1, gridX));
        gridY = Math.max(0, Math.min(gridSize.rows - 1, gridY));

        const { isoX, isoY } = isoToScreen(gridX, gridY, tileSize);

        hoverTile.x = isoX;
        hoverTile.y = isoY;
        hoverTile.zIndex = gridY + gridX;
    }

    function placeTile(gridX, gridY) {
        gridX = Math.max(0, Math.min(gridSize.cols - 1, gridX));
        gridY = Math.max(0, Math.min(gridSize.rows - 1, gridY));

        const { isoX, isoY } = isoToScreen(gridX, gridY, tileSize);

        const tile = new Sprite(Assets.get("/assets/blue_tile/blue_tile.png"));

        tile.anchor.set(0.5, 0.5);
        tile.x = isoX;
        tile.y = isoY;
        tile.gridX = gridX;
        tile.gridY = gridY;

        tile.hitArea = new Polygon([
            0, tileSize.height / 2,
            tileSize.width / 2, 0,
            tileSize.width, tileSize.height / 2,
            tileSize.width / 2, tileSize.height
        ]);

        app.stage.addChild(tile);
    }

    function placeObject(object) {
        // Vérifie si l'espace est libre
        for (let y = 0; y < object.height; y++) {
            for (let x = 0; x < object.width; x++) {
                const tileKey = `${object.gridX + x},${object.gridY + y}`;

                if (occupiedTiles[tileKey]) {
                    console.log("Tuile occupée à", tileKey);
                    return false;
                }
            }
        }

        // Marque les tuiles comme occupées
        for (let y = 0; y < object.height; y++) {
            for (let x = 0; x < object.width; x++) {
                const tileKey = `${object.gridX + x},${object.gridY + y}`;
                occupiedTiles[tileKey] = object;
            }
        }

        // Ajoute l'objet sur la scène
        app.stage.addChild(object.sprite);
        console.log(`Objet placé à ${object.gridX},${object.gridY}`);
        return true;
    }

    function screenToIso(screenX, screenY, tileSize, app) {
        const scale = app.stage.scale.x;
        const stageX = (screenX - app.stage.x) / scale;
        const stageY = (screenY - app.stage.y) / scale;

        let targetTile = null;

        // Parcourt toutes les tiles pour voir où la souris est
        for (let tile of tiles) {
            const offsetX = tile.x - tileSize.width / 2;
            const offsetY = tile.y - tileSize.height / 2;

            if (tile.containsPoint({ x: stageX, y: stageY })) {
                targetTile = tile;
                break;
            }
        }

        if (!targetTile) {
            let gridX = Math.round((stageX / (tileSize.width / 2) + stageY / (tileSize.height / 2)) / 2);
            let gridY = Math.round((stageY / (tileSize.height / 2) - stageX / (tileSize.width / 2)) / 2);
            return { x: gridX, y: gridY };
        }

        return { x: targetTile.gridX, y: targetTile.gridY };
    }

    function isoToScreen(gridX, gridY, tileSize) {
        const isoX = (gridX - gridY) * (tileSize.width / 2);
        const isoY = (gridX + gridY) * (tileSize.height / 2);
        return { isoX, isoY };
    }

    function createHoverTile() {
        const texture = Assets.get("/assets/medium_tiles/hover_tile/hover_tile.png");
        hoverTile = new Sprite(texture);
        hoverTile.alpha = 1;
        hoverTile.anchor.set(0.5, 0.5);

        // hoverTile.zIndex = 100;
        app.stage.addChild(hoverTile);
    }

    function onDragStart(event) {
        isDragging = true;
        dragStart = event.data.global.clone();
        stageStart = { x: app.stage.x, y: app.stage.y };
        hasMoved = false;
    }

    function onDragMove(event) {
        const newPosition = event.data.global;
        app.stage.x = stageStart.x + (newPosition.x - dragStart.x);
        app.stage.y = stageStart.y + (newPosition.y - dragStart.y);
        hasMoved = true;
    }

    function onDragEnd() {
        isDragging = false;
        hasMoved = false;
    }

    /* INVENTORY MANAGEMENT */

    function selectFurniFromInventory(e) {
        selectedFurni = e.currentTarget.getAttribute("data-furni");
    }


    /*
     * Server-side caller functions
     */

    function loadFurnis() {
        if (!isFurnisLoaded) {
            socket.emit("get furnis");
            isFurnisLoaded = true;
        }
    }





    socket.on('connect', () => {
        console.log('Connecté au serveur avec ID :', socket.id);

        loadFurnis();
    });
})();

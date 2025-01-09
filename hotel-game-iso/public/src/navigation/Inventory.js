import Window from "./Window.js";
import Navigation from "./Navigation.js";
import {Assets} from "../libs/pixi.mjs";

export default class Inventory {
    static selectedFurni;
    static #localSelectedFurni;

    static open() {
        const container = $("#windows");
        const isAlreadyOpened = container.children("#inventory").length;

        if (!isAlreadyOpened) {
            console.log(Navigation.furnis);

            let furnisSelection = "";

            Navigation.furnis.forEach(source => {
                source.files.forEach(async furni => {
                    furnisSelection += `
                    <div class="furni" game-furni="${furni}">
                        <img src="${furni}" alt="${furni}" />
                    </div>
                    `;
                });
            });

            container.html(container.html() + Window.create("inventory", "My Inventory", `
            <main>
                ${furnisSelection}
            </main>
            
            <aside>
                <div class="furni-preview"></div>
                
                <div class="actions">
                    <button game-action="use furni" class="button-primary" disabled>Use</button>                
                </div>
            </aside>
            `, {
                width: "800px",
                height: "500px",
            }));

            const inventory = container.children("#inventory");

            $("#inventory main > .furni").on("click", e => {
                const asset = $(e.currentTarget).attr("game-furni");

                Inventory.#localSelectedFurni = asset;
                Inventory.#previewFurni();
            });

            inventory.draggable({
                containment: "body"
            });
        } else {
            container
                .children("#inventory")
                .remove();
        }
    };

    static #previewFurni() {
        const previewContainer = $("#inventory aside > .furni-preview");
        const useButton = $("#inventory button[game-action='use furni']");

        if (previewContainer.length) {
            previewContainer.html(`
            <img game-asset="${Inventory.#localSelectedFurni}" 
                 src="${Inventory.#localSelectedFurni}"
                 alt="${Inventory.#localSelectedFurni}" />
            `);

            if (useButton.length) {
                useButton
                    .removeAttr("disabled")
                    .on("click", Inventory.#useLocalSelectedFurni);
            }
        }
    };

    static #useLocalSelectedFurni() {
        Inventory.selectedFurni = Inventory.#localSelectedFurni;

        Assets
            .load(Inventory.selectedFurni)
            .then(furni => furni.baseTexture.scaleMode = "nearest");

        Inventory.close();
    };

    static close() {
        const inventory = $("#inventory");

        inventory.remove();
    };

    static loadInventory() {
        const inventoryContainer = document.querySelector("#inventory");

        // TODO
    };
};
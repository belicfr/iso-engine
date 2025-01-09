import Inventory from "./Inventory.js";

export default class Navigation {
    static furnis = [];

    static initializeNavigation() {
        const navigation = $("#navigation");
        const inventoryButton
            = navigation.children("[game-action='open inventory']");

        inventoryButton.on("click", Inventory.open);
    }
};
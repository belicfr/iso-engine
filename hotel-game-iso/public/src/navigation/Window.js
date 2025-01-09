export default class Window {
    static create(id, title, slot, sizes = {}) {
        const width = sizes?.width ?? "auto";
        const height = sizes?.height ?? "auto";

        return `
        <div id="${id}" 
             class="window" 
             style="width: ${width}; height: ${height};">
             
            <header>${title}</header>
            <div class="slot">${slot}</div>
        </div>
        `;
    };
};
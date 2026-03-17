// === DOSYA: frontend/components/layer-map.js ===
import { state, subscribe, notify } from "../state.js";

const BOSS_IDS = new Set(["gabriel", "minos_prime", "sisyphus_prime"]);

const LOCK_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`;

const TEMPLATE = `
<style>
    :host {
        display: block;
        height: 100%;
        overflow-y: auto;
    }
    .map-header {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.7em;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 3px;
        padding: 14px 14px 8px;
        border-bottom: 1px solid #333;
    }
    .layer-list {
        display: flex;
        flex-direction: column;
        padding: 8px;
        gap: 2px;
    }
    .act-label {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.65em;
        color: #444;
        text-transform: uppercase;
        letter-spacing: 2px;
        padding: 10px 8px 4px;
    }
    .layer-item {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.85em;
        padding: 8px 10px;
        border: 1px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.1s, border-color 0.1s;
        color: #666;
    }
    .layer-item:hover {
        background: rgba(255,255,255, 0.03);
    }
    .layer-item.unlocked {
        color: #c8c8c8;
    }
    .layer-item.active {
        color: #00ff41;
        border-color: #00ff41;
        background: rgba(0, 255, 65, 0.05);
    }
    .layer-item.completed {
        color: #8a0303;
        text-decoration: line-through;
    }
    .layer-item.locked {
        opacity: 0.4;
        cursor: default;
    }
    .layer-item.boss {
        font-weight: bold;
        color: #ffd700;
        border-left: 3px solid #ffd700;
        padding-left: 7px;
    }
    .layer-item.boss.locked {
        color: #665500;
    }
    .layer-item.boss.active {
        color: #ffd700;
        border-color: #ffd700;
        background: rgba(255, 215, 0, 0.05);
    }
    .lock-icon {
        display: inline-flex;
        flex-shrink: 0;
    }
    .layer-name {
        flex: 1;
    }

    :host::-webkit-scrollbar { width: 4px; }
    :host::-webkit-scrollbar-track { background: #1a1a1a; }
    :host::-webkit-scrollbar-thumb { background: #2d1a1a; }
</style>
<div class="map-header">Layers of Hell</div>
<div class="layer-list" id="list"></div>
`;

class LayerMap extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = TEMPLATE;
        this._list = this.shadowRoot.getElementById("list");
    }

    connectedCallback() {
        subscribe("layers", () => this._render());
        subscribe("activeLayer", () => this._updateActive());
        // render when data available
        if (state.layers && state.layers.length > 0) {
            this._render();
        } else {
            // wait for data
            const check = setInterval(() => {
                if (state.layers && state.layers.length > 0) {
                    clearInterval(check);
                    this._render();
                }
            }, 200);
        }
    }

    _render() {
        const layers = state.layers || [];
        this._list.innerHTML = "";

        let currentAct = null;

        layers.forEach((layer) => {
            // Act label separator
            if (layer.act !== currentAct) {
                currentAct = layer.act;
                const actLabel = document.createElement("div");
                actLabel.className = "act-label";
                actLabel.textContent = currentAct;
                this._list.appendChild(actLabel);
            }

            const el = document.createElement("div");
            el.className = "layer-item";
            el.dataset.layerId = layer.id;

            const isBoss = BOSS_IDS.has(layer.id);
            const isUnlocked = layer.unlocked;
            const isCompleted = layer.completed;
            const isActive = layer.id === state.activeLayer;

            if (isBoss) el.classList.add("boss");
            if (isUnlocked) el.classList.add("unlocked");
            if (isCompleted) el.classList.add("completed");
            if (isActive) el.classList.add("active");
            if (!isUnlocked) el.classList.add("locked");

            el.innerHTML = `
                ${!isUnlocked ? '<span class="lock-icon">' + LOCK_ICON + "</span>" : ""}
                <span class="layer-name">${this._esc(layer.name)}</span>
            `;

            if (isUnlocked) {
                el.addEventListener("click", () => {
                    state.activeLayer = layer.id;
                });
            }

            this._list.appendChild(el);
        });
    }

    _updateActive() {
        const items = this.shadowRoot.querySelectorAll(".layer-item");
        items.forEach((item) => {
            if (item.dataset.layerId === state.activeLayer) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
    }

    _esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }
}

customElements.define("layer-map", LayerMap);

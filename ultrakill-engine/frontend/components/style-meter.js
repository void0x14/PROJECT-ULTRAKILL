// === DOSYA: frontend/components/style-meter.js ===
import { state, subscribe } from "../state.js";

const RANK_COLORS = {
    D:   "#555555",
    C:   "#aaaaaa",
    B:   "#00bfff",
    A:   "#32cd32",
    S:   "#ffd700",
    SS:  "#ff8c00",
    SSS: "#ff4500",
};

const RANK_LABELS = {
    D:   "DULL",
    C:   "CALM",
    B:   "BADASS",
    A:   "ANARCHIC",
    S:   "SUPREME",
    SS:  "SSADISTIC",
    SSS: "SSENSATIONAL",
};

const TEMPLATE = `
<style>
    :host {
        display: block;
        width: 100%;
    }
    .meter-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    .meter-label {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.65em;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 3px;
    }
    .meter-rank {
        font-family: 'Courier New', Courier, monospace;
        font-size: 4em;
        font-weight: bold;
        font-style: italic;
        line-height: 1;
        transition: color 0.2s;
    }
    .meter-rank.pop {
        animation: rankPop 0.3s ease;
    }
    .meter-desc {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.75em;
        letter-spacing: 2px;
        text-transform: uppercase;
        transition: color 0.2s;
    }
    .meter-bar {
        width: 100%;
        height: 3px;
        margin-top: 8px;
        transition: background 0.3s;
    }
    @keyframes rankPop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.6); }
        100% { transform: scale(1); }
    }
</style>
<div class="meter-container">
    <div class="meter-label">STYLE</div>
    <div class="meter-rank" id="rank">D</div>
    <div class="meter-desc" id="desc">DULL</div>
    <div class="meter-bar" id="bar"></div>
</div>
`;

class StyleMeter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = TEMPLATE;
        this._rank = this.shadowRoot.getElementById("rank");
        this._desc = this.shadowRoot.getElementById("desc");
        this._bar = this.shadowRoot.getElementById("bar");
        this._currentRank = "D";
    }

    connectedCallback() {
        subscribe("styleRank", (r) => this._update(r));
        this._update(state.styleRank);
    }

    _update(rank) {
        const color = RANK_COLORS[rank] || RANK_COLORS.D;
        const label = RANK_LABELS[rank] || "DULL";

        this._rank.textContent = rank;
        this._rank.style.color = color;
        if (["S", "SS", "SSS"].includes(rank)) {
            this._rank.style.textShadow = "0 0 20px " + color;
        } else {
            this._rank.style.textShadow = "none";
        }

        this._desc.textContent = label;
        this._desc.style.color = color;
        this._bar.style.background = color;

        if (rank !== this._currentRank) {
            this._rank.classList.remove("pop");
            void this._rank.offsetWidth; // force reflow
            this._rank.classList.add("pop");
            this._currentRank = rank;
        }
    }
}

customElements.define("style-meter", StyleMeter);

// === DOSYA: frontend/components/blood-bar.js ===
import { state, subscribe } from "../state.js";

const TEMPLATE = `
<style>
    :host {
        display: block;
        width: 100%;
        flex-shrink: 0;
    }
    .bar-outer {
        background: #1a1a1a;
        border: 2px solid #2d1a1a;
        height: 32px;
        position: relative;
        overflow: hidden;
    }
    .bar-fill {
        background: linear-gradient(90deg, #8a0303, #b00505);
        height: 100%;
        width: 100%;
        transition: width 0.3s ease;
        position: relative;
    }
    .bar-fill::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 30px;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1));
    }
    .bar-fill.danger {
        background: linear-gradient(90deg, #5a0000, #8a0303);
        animation: dangerPulse 0.8s infinite;
    }
    .bar-fill.critical {
        background: linear-gradient(90deg, #3a0000, #5a0000);
        animation: criticalPulse 0.5s infinite;
    }
    .bar-text {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
        font-size: 0.85em;
        color: #fff;
        text-shadow: 1px 1px 2px #000;
        letter-spacing: 2px;
        z-index: 1;
    }
    .label {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.7em;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-bottom: 3px;
    }
    @keyframes dangerPulse {
        0%   { filter: brightness(1); }
        50%  { filter: brightness(0.6); }
        100% { filter: brightness(1); }
    }
    @keyframes criticalPulse {
        0%   { filter: brightness(1); }
        50%  { filter: brightness(1.4); }
        100% { filter: brightness(1); }
    }
</style>
<div class="label">BLOOD IS FUEL</div>
<div class="bar-outer">
    <div class="bar-fill" id="fill"></div>
    <div class="bar-text" id="text">100 / 100</div>
</div>
`;

class BloodBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = TEMPLATE;
        this._fill = this.shadowRoot.getElementById("fill");
        this._text = this.shadowRoot.getElementById("text");
    }

    connectedCallback() {
        subscribe("blood", (b) => this._update(b));
        this._update(state.blood);
    }

    _update(blood) {
        const pct = (blood.current / blood.max) * 100;
        this._fill.style.width = Math.max(0, pct) + "%";
        this._text.textContent = Math.floor(blood.current) + " / " + blood.max;

        this._fill.classList.remove("danger", "critical");
        if (pct <= 10) {
            this._fill.classList.add("critical");
        } else if (pct <= 30) {
            this._fill.classList.add("danger");
        }
    }
}

customElements.define("blood-bar", BloodBar);

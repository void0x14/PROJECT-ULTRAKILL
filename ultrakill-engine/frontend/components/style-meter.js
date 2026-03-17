// === DOSYA: frontend/components/style-meter.js ===
import { state, subscribe } from '../state.js';

class StyleMeter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .meter-box {
                    background: var(--metal);
                    border: 2px solid var(--rust);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 150px;
                    font-size: 5em;
                    font-weight: bold;
                    font-style: italic;
                    transition: transform 0.2s;
                }
                .meter-box.animate {
                    transform: scale(1.5);
                }
                .rank-D { color: gray; }
                .rank-C { color: white; }
                .rank-B { color: #00bfff; }
                .rank-A { color: #32cd32; }
                .rank-S { color: #ffd700; text-shadow: 0 0 10px #ffd700; }
                .rank-SS { color: #ff8c00; text-shadow: 0 0 15px #ff8c00; }
                .rank-SSS { color: var(--rank-sss); text-shadow: 0 0 20px var(--rank-sss); }
            </style>
            <div class="meter-box rank-D" id="meter">D</div>
        `;
        this.meter = this.shadowRoot.getElementById('meter');
    }

    connectedCallback() {
        subscribe('styleRank', rank => this.updateRank(rank));
    }

    updateRank(rank) {
        this.meter.innerText = rank;
        this.meter.className = `meter-box rank-${rank}`;
        this.meter.classList.add('animate');
        setTimeout(() => this.meter.classList.remove('animate'), 200);
    }
}
customElements.define('style-meter', StyleMeter);

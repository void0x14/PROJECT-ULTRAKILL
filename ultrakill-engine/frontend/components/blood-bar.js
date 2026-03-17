// === DOSYA: frontend/components/blood-bar.js ===
import { state, subscribe } from '../state.js';

class BloodBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; width: 100%; }
                .bar-container {
                    background: var(--metal);
                    height: 30px;
                    border: 2px solid var(--rust);
                    position: relative;
                }
                .bar-fill {
                    background: var(--blood);
                    height: 100%;
                    width: 100%;
                    transition: width 0.3s ease;
                }
                .bar-fill.danger {
                    background: #5a0000;
                    animation: bloodPulse 1s infinite;
                }
                .text {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    text-shadow: 1px 1px 0 black;
                }
                @keyframes bloodPulse {
                    0% { filter: brightness(1); }
                    50% { filter: brightness(1.5); }
                    100% { filter: brightness(1); }
                }
            </style>
            <div class="bar-container">
                <div class="bar-fill" id="fill"></div>
                <div class="text" id="text">100 / 100</div>
            </div>
        `;
        this.fill = this.shadowRoot.getElementById('fill');
        this.text = this.shadowRoot.getElementById('text');
    }

    connectedCallback() {
        subscribe('blood', blood => this.update(blood));
        this.update(state.blood);
    }

    update(blood) {
        const percent = (blood.current / blood.max) * 100;
        this.fill.style.width = `${Math.max(0, percent)}%`;
        this.text.innerText = `${Math.floor(blood.current)} / ${blood.max}`;
        if (percent < 30) {
            this.fill.classList.add('danger');
        } else {
            this.fill.classList.remove('danger');
        }
    }
}
customElements.define('blood-bar', BloodBar);

// === DOSYA: frontend/components/layer-map.js ===
import { state, subscribe } from '../state.js';

class LayerMap extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .layer-list {
                    background: var(--metal);
                    border: 2px solid var(--rust);
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .layer-item {
                    padding: 10px;
                    border: 1px solid var(--rust);
                    opacity: 0.5;
                }
                .layer-item.active {
                    opacity: 1;
                    border-color: var(--terminal);
                    background: rgba(0, 255, 65, 0.1);
                }
                .layer-item.completed {
                    text-decoration: line-through;
                    color: var(--blood);
                    opacity: 0.8;
                }
                .boss { font-weight: bold; color: yellow; }
            </style>
            <div class="layer-list" id="list"></div>
        `;
        this.list = this.shadowRoot.getElementById('list');
    }

    connectedCallback() {
        this.render([
            { id: 'prelude', name: 'Prelude' },
            { id: 'limbo', name: 'Limbo' },
            { id: 'lust', name: 'Lust' },
            { id: 'gluttony', name: 'Gluttony' },
            { id: 'greed', name: 'Greed' },
            { id: 'wrath', name: 'Wrath' },
            { id: 'heresy', name: 'Heresy' },
            { id: 'violence', name: 'Violence' },
            { id: 'fraud', name: 'Fraud' },
            { id: 'treachery', name: 'Treachery' },
        ]);
        subscribe('activeLayer', () => this.updateActive());
    }

    render(layers) {
        this.list.innerHTML = '';
        layers.forEach(layer => {
            const el = document.createElement('div');
            el.className = 'layer-item';
            el.dataset.id = layer.id;
            el.innerText = layer.name;
            if (['gluttony', 'heresy'].includes(layer.id)) {
                el.classList.add('boss');
                el.innerText += ' [BOSS]';
            }
            this.list.appendChild(el);
        });
        this.updateActive();
    }

    updateActive() {
        const items = this.shadowRoot.querySelectorAll('.layer-item');
        items.forEach(item => {
            if (item.dataset.id === state.activeLayer) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}
customElements.define('layer-map', LayerMap);

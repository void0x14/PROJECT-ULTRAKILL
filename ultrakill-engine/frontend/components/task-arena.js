// === DOSYA: frontend/components/task-arena.js ===
import { state, subscribe } from "../state.js";
import { completeTask } from "../engine.js";

const ARENA_STYLES = `
<style>
    :host {
        display: block;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .arena-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
        padding: 4px;
    }
    .arena-empty {
        color: #555;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.9em;
        text-align: center;
        padding: 40px 20px;
        border: 1px dashed #333;
        grid-column: 1 / -1;
    }
    [data-task-card] {
        background: #1a1a1a;
        border: 2px solid #2d1a1a;
        padding: 14px;
        cursor: pointer;
        user-select: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: border-color 0.15s, transform 0.1s;
        animation: cardIn 0.25s ease;
    }
    [data-task-card]:hover {
        border-color: #00ff41;
        transform: translateY(-1px);
    }
    [data-task-card].active {
        border-color: #ffd700;
        background: #1c1c10;
    }
    [data-task-card].completed {
        border-color: #00ff41;
        opacity: 0.5;
        pointer-events: none;
    }
    .card-title {
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
        font-size: 1em;
        color: #c8c8c8;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .card-meta {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.8em;
        color: #666;
        display: flex;
        justify-content: space-between;
    }
    .card-timer {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.85em;
        color: #ffd700;
        min-height: 1.2em;
    }
    .card-rank {
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
        font-size: 1.1em;
        text-align: right;
    }
    .scrambling {
        animation: scrambleShake 0.1s infinite, glitch 0.3s infinite;
        border-color: #00ff41 !important;
    }
    @keyframes cardIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glitch {
        0%   { clip-path: inset(10% 0 10% 0); transform: translateX(-2px); }
        20%  { clip-path: inset(80% 0 5% 0);  transform: translateX(2px); }
        40%  { clip-path: inset(40% 0 40% 0); transform: translateX(-1px); }
        60%  { clip-path: inset(20% 0 60% 0); transform: translateX(3px); }
        80%  { clip-path: inset(60% 0 20% 0); transform: translateX(-2px); }
        100% { clip-path: inset(10% 0 10% 0); transform: translateX(0); }
    }
    @keyframes scrambleShake {
        0%   { transform: translate(1px, 1px) rotate(0deg); }
        25%  { transform: translate(-1px, -2px) rotate(-1deg); }
        50%  { transform: translate(-3px, 0px) rotate(1deg); }
        75%  { transform: translate(2px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -1px) rotate(0deg); }
    }
    :host::-webkit-scrollbar { width: 4px; }
    :host::-webkit-scrollbar-track { background: #0a0a0a; }
    :host::-webkit-scrollbar-thumb { background: #2d1a1a; }
</style>
`;

class TaskArena extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = ARENA_STYLES + '<div class="arena-grid" id="grid"></div>';
        this._grid = this.shadowRoot.getElementById("grid");
        this._activeTimers = new Map(); // taskId → startTimestamp
        this._timerIntervals = new Map(); // taskId → intervalId
    }

    connectedCallback() {
        subscribe("tasks", () => this._render());
        subscribe("activeLayer", () => this._render());
        subscribe("grindActive", (active) => {
            if (!active) this._removeScrambleClasses();
        });
        this._render();
    }

    _render() {
        const layer = state.activeLayer;
        const tasks = (state.tasks || []).filter(
            (t) => t.layer_id === layer && t.status !== "completed"
        );

        this._grid.innerHTML = "";

        if (tasks.length === 0) {
            const empty = document.createElement("div");
            empty.className = "arena-empty";
            empty.textContent = "NO ACTIVE MISSIONS — DEPLOY A NEW TASK";
            this._grid.appendChild(empty);
            return;
        }

        tasks.forEach((task) => {
            const card = document.createElement("div");
            card.setAttribute("data-task-card", task.id);
            card.dataset.taskId = task.id;

            const isActive = this._activeTimers.has(task.id);

            card.innerHTML = `
                <div class="card-title">${this._esc(task.title)}</div>
                <div class="card-meta">
                    <span>BLOOD +${task.blood_reward}</span>
                    <span>${task.deadline_seconds}s</span>
                </div>
                <div class="card-timer" data-timer="${task.id}">${isActive ? "IN PROGRESS..." : "CLICK TO ENGAGE"}</div>
            `;

            if (isActive) card.classList.add("active");

            card.addEventListener("click", () => this._handleClick(task));
            this._grid.appendChild(card);

            // restore timer display if active
            if (isActive) {
                this._startTimerDisplay(task.id);
            }
        });
    }

    async _handleClick(task) {
        if (!this._activeTimers.has(task.id)) {
            // Start task
            this._activeTimers.set(task.id, Date.now());
            const card = this.shadowRoot.querySelector(`[data-task-id="${task.id}"]`);
            if (card) card.classList.add("active");
            this._startTimerDisplay(task.id);
        } else {
            // Complete task
            const startTime = this._activeTimers.get(task.id);
            const elapsed = Date.now() - startTime;
            this._activeTimers.delete(task.id);
            this._stopTimerDisplay(task.id);
            await completeTask(task.id, elapsed);
        }
    }

    _startTimerDisplay(taskId) {
        if (this._timerIntervals.has(taskId)) return;
        const update = () => {
            const start = this._activeTimers.get(taskId);
            if (start == null) return;
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            const el = this.shadowRoot.querySelector(`[data-timer="${taskId}"]`);
            if (el) el.textContent = elapsed + "s — CLICK TO COMPLETE";
        };
        update();
        this._timerIntervals.set(taskId, setInterval(update, 100));
    }

    _stopTimerDisplay(taskId) {
        const iv = this._timerIntervals.get(taskId);
        if (iv) clearInterval(iv);
        this._timerIntervals.delete(taskId);
    }

    _removeScrambleClasses() {
        const cards = this.shadowRoot.querySelectorAll("[data-task-card]");
        cards.forEach((c) => {
            c.style.order = "";
            c.classList.remove("scrambling");
        });
        const grid = this.shadowRoot.querySelector(".arena-grid");
        if (grid) grid.style.gridTemplateColumns = "";
    }

    _esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }
}

customElements.define("task-arena", TaskArena);

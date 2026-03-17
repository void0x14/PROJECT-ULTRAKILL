// === DOSYA: frontend/components/task-arena.js ===
import { state, subscribe } from '../state.js';
import { clearCyberGrind, triggerCyberGrind } from '../engine.js';

class TaskArena extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .arena-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                }
                .task-card {
                    background: var(--rust);
                    border: 2px solid var(--blood);
                    padding: 15px;
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    flex-direction: column;
                }
                .task-card:hover { border-color: var(--terminal); }
                .task-title { font-weight: bold; font-size: 1.2em; margin-bottom: 10px; }
                .task-meta { font-size: 0.9em; color: var(--text); opacity: 0.8; }
                .scrambling {
                    animation: scrambleShake 0.1s infinite, glitch 0.3s infinite;
                    border-color: var(--terminal) !important;
                }
                @keyframes glitch {
                    0% { clip-path: inset(10% 0 10% 0); transform: translateX(-2px); }
                    20% { clip-path: inset(80% 0 5% 0); transform: translateX(2px); }
                    40% { clip-path: inset(40% 0 40% 0); transform: translateX(-2px); }
                    60% { clip-path: inset(20% 0 60% 0); transform: translateX(2px); }
                    80% { clip-path: inset(60% 0 20% 0); transform: translateX(-2px); }
                    100% { clip-path: inset(10% 0 10% 0); transform: translateX(0); }
                }
                @keyframes scrambleShake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    25% { transform: translate(-1px, -2px) rotate(-1deg); }
                    50% { transform: translate(-3px, 0px) rotate(1deg); }
                    75% { transform: translate(2px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -1px) rotate(0deg); }
                }
            </style>
            <div class="arena-container" id="container"></div>
        `;
        this.container = this.shadowRoot.getElementById('container');
        this.activeTimers = new Map();
    }

    connectedCallback() {
        this.layer = this.getAttribute('layer') || 'limbo';
        subscribe('tasks', tasks => this.render(tasks));
        this.render(state.tasks);
    }

    render(tasks) {
        const layerTasks = tasks.filter(t => t.layer_id === this.layer && t.status !== 'completed');
        this.container.innerHTML = '';
        layerTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.taskId = task.id;
            card.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div class="task-meta">Blood: +${task.blood_reward}</div>
                <div class="task-meta timer">Deadline: ${task.deadline_seconds}s</div>
            `;
            
            card.addEventListener('click', () => this.handleTaskClick(task, card));
            this.container.appendChild(card);
        });
    }

    async handleTaskClick(task, card) {
        if (!this.activeTimers.has(task.id)) {
            // Start task
            this.activeTimers.set(task.id, Date.now());
            card.style.borderColor = 'yellow';
            card.querySelector('.timer').innerText = 'IN PROGRESS...';
        } else {
            // Complete task
            const startTime = this.activeTimers.get(task.id);
            const completionTimeMs = Date.now() - startTime;
            this.activeTimers.delete(task.id);
            
            try {
                const res = await fetch('/api/task/complete', {
                    method: 'POST',
                    body: JSON.stringify({ task_id: task.id, completion_time_ms: completionTimeMs }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    state.styleRank = data.style_rank;
                    state.blood = { ...state.blood, current: Math.min(state.blood.max, state.blood.current + data.blood_added) };
                    card.remove();
                    
                    if (state.grindActive) {
                        clearCyberGrind();
                    }
                }
            } catch (e) { console.error(e); }
        }
    }
}
customElements.define('task-arena', TaskArena);

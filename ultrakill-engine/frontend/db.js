// === DOSYA: frontend/db.js ===
const DB_NAME = 'UltrakillDB';
const DB_VERSION = 1;

export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('tasks')) {
                db.createObjectStore('tasks', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('layers')) {
                db.createObjectStore('layers', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('grind_state')) {
                db.createObjectStore('grind_state', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('session_log')) {
                db.createObjectStore('session_log', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getTasks(layer_id) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('tasks', 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.getAll();
            request.onsuccess = () => {
                const tasks = request.result;
                resolve(layer_id ? tasks.filter(t => t.layer_id === layer_id) : tasks);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) { console.error(e); return []; }
}

export async function saveTask(task) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('tasks', 'readwrite');
            const store = transaction.objectStore('tasks');
            const request = store.put(task);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) { console.error(e); }
}

export async function getGrindState() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('grind_state', 'readonly');
            const store = transaction.objectStore('grind_state');
            const request = store.get('current');
            request.onsuccess = () => resolve(request.result || { active: false, seed: null });
            request.onerror = () => reject(request.error);
        });
    } catch (e) { console.error(e); return { active: false, seed: null }; }
}

export async function saveGrindState(state) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('grind_state', 'readwrite');
            const store = transaction.objectStore('grind_state');
            const request = store.put({ id: 'current', ...state });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) { console.error(e); }
}

export async function logSession(entry) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('session_log', 'readwrite');
            const store = transaction.objectStore('session_log');
            const request = store.add(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) { console.error(e); }
}

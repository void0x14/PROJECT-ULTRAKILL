// === DOSYA: frontend/db.js ===
const DB_NAME = "UltrakillDB";
const DB_VERSION = 1;

let _db = null;

export async function initDB() {
    if (_db) return _db;
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("tasks")) {
                db.createObjectStore("tasks", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("layers")) {
                db.createObjectStore("layers", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("grind_state")) {
                db.createObjectStore("grind_state", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("session_log")) {
                db.createObjectStore("session_log", { keyPath: "id", autoIncrement: true });
            }
        };
        req.onsuccess = () => {
            _db = req.result;
            resolve(_db);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getTasks(layerId) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("tasks", "readonly");
            const store = tx.objectStore("tasks");
            const r = store.getAll();
            r.onsuccess = () => {
                const all = r.result || [];
                resolve(layerId ? all.filter((t) => t.layer_id === layerId) : all);
            };
            r.onerror = () => reject(r.error);
        });
    } catch (e) {
        console.error("[db] getTasks:", e);
        return [];
    }
}

export async function saveTask(task) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("tasks", "readwrite");
            const store = tx.objectStore("tasks");
            const r = store.put(task);
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
        });
    } catch (e) {
        console.error("[db] saveTask:", e);
    }
}

export async function saveTasks(tasks) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("tasks", "readwrite");
            const store = tx.objectStore("tasks");
            for (const task of tasks) {
                store.put(task);
            }
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("[db] saveTasks:", e);
    }
}

export async function getGrindState() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("grind_state", "readonly");
            const store = tx.objectStore("grind_state");
            const r = store.get("current");
            r.onsuccess = () => resolve(r.result || { active: false, seed: null });
            r.onerror = () => reject(r.error);
        });
    } catch (e) {
        console.error("[db] getGrindState:", e);
        return { active: false, seed: null };
    }
}

export async function saveGrindState(gs) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("grind_state", "readwrite");
            const store = tx.objectStore("grind_state");
            const r = store.put({ id: "current", ...gs });
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
        });
    } catch (e) {
        console.error("[db] saveGrindState:", e);
    }
}

export async function logSession(entry) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction("session_log", "readwrite");
            const store = tx.objectStore("session_log");
            const r = store.add(entry);
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
        });
    } catch (e) {
        console.error("[db] logSession:", e);
    }
}

export async function syncFromServer() {
    try {
        const res = await fetch("/api/state");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.tasks) await saveTasks(data.tasks);
        return data;
    } catch (e) {
        console.error("[db] syncFromServer:", e);
        return null;
    }
}

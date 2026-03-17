// === DOSYA: frontend/state.js ===
const subscribers = new Map();

function createStore(initialState) {
    const handler = {
        set(target, property, value) {
            target[property] = value;
            if (subscribers.has(property)) {
                subscribers.get(property).forEach(callback => callback(value));
            }
            return true;
        }
    };
    return new Proxy(initialState, handler);
}

export const state = createStore({
    blood: { current: 100, max: 100 },
    activeLayer: 'limbo',
    tasks: [],
    styleRank: 'D',
    grindActive: false,
    grindSeed: null
});

export function subscribe(key, callback) {
    if (!subscribers.has(key)) {
        subscribers.set(key, []);
    }
    subscribers.get(key).push(callback);
}

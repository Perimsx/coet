// Global State
export const store = {
    talks: [],
    todos: [],
    anniversaries: [],
    currentTagFilter: null,
    currentDateFilter: null,
    settings: {},
    userProfile: {
        name: "Chen",
        avatar: "https://ui-avatars.com/api/?name=Chen&background=0984e3&color=fff&size=128",
        verified: true,
        badgeIcon: "fas fa-check-circle",
        badgeColor: "#0984e3"
    }
};

export function setTalks(data) { store.talks = data; }
export function setTodos(data) { store.todos = data; }
export function setAnniversaries(data) { store.anniversaries = data; }
export function setTagFilter(tag) { store.currentTagFilter = tag; }
export function setDateFilter(dateStr) { store.currentDateFilter = dateStr; }
export function setSettings(data) { store.settings = data; }

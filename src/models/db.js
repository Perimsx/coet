const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/db.json');

// Initialize DB and ensure Admin exists
const ensureDb = () => {
    let data = {};
    if (fs.existsSync(DB_PATH)) {
        try {
            const content = fs.readFileSync(DB_PATH, 'utf8');
            data = content ? JSON.parse(content) : {};
        } catch (e) {
            console.error("DB Read Error", e);
            data = {};
        }
    } else {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }

    let changed = false;
    if (!data.users || !Array.isArray(data.users)) {
        data.users = [];
        changed = true;
    }

    // Check for admin
    const adminExists = data.users.find(u => u.username === 'admin');
    if (!adminExists) {
        data.users.push({
            id: "admin",
            username: "admin",
            // Hash for 'admin'
            password: "$2b$10$XlCxqQ/XLAlATrGLEsfzIuDJfFjEZTY9uP/ho8aAYxCIwS6jgT6dm"
        });
        changed = true;
    }

    // Ensure other collections exist
    ['talks', 'todos', 'anniversaries', 'favorites'].forEach(key => {
        if (!data[key]) {
            data[key] = [];
            changed = true;
        }
    });

    // Ensure settings (Object)
    if (!data.settings) {
        data.settings = {
            siteTitle: "Perimsx",
            siteIcon: "fas fa-meteor",
            userNickname: "Perimsx",
            userAvatar: "https://cdn-visitor-eo.7moor-fs2.com/im/1cf621c0-5c37-11e9-9460-658dbd81beae/2026-01-13-13:23:41/1768281821670/621f50a2-cb95-4e17-b82d-65408f3822b6.png",
            badgeIcon: "ri-verified-badge-fill",
            badgeColor: "#1da1f2",
            verified: true,
            siteFavicon: "https://cdn-visitor-eo.7moor-fs2.com/im/1cf621c0-5c37-11e9-9460-658dbd81beae/2026-01-29-20:09:24/1769688564038/a1f6d7df-cb4a-4420-96c6-2f50078dd79e.png",
            primaryColor: "#5c8df0",
            userBio: ""
        };
        changed = true;
    }

    if (changed || !fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }
};

ensureDb();

class DB {
    constructor() {
        this.path = DB_PATH;
        this.data = this.read();
    }

    read() {
        try {
            if (!fs.existsSync(this.path)) return {}; // Safety
            const content = fs.readFileSync(this.path, 'utf8');
            return content ? JSON.parse(content) : {};
        } catch (e) {
            console.error("DB Read Error", e);
            return {};
        }
    }

    write(data) {
        fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
        this.data = data;
    }

    get(collection) {
        this.data = this.read(); // Always pull fresh
        return this.data[collection] || [];
    }

    set(collection, items) {
        const data = this.read();
        data[collection] = items;
        this.write(data);
    }

    // Backup helper
    getRawData() {
        return this.read();
    }

    replaceRawData(newData) {
        this.write(newData);
    }
}

module.exports = new DB();

const db = require('../models/db');
const fs = require('fs');
const path = require('path');

// Calculate Stats
exports.getStats = (req, res) => {
    const talks = db.get('talks');

    // Total Talks
    const talkCount = talks.length;

    // Media Count
    let mediaCount = 0;
    talks.forEach(t => {
        if (t.images) mediaCount += t.images.length;
        if (t.video) mediaCount += 1;
    });

    // Tag Count (Unique tags)
    const tags = new Set();
    talks.forEach(t => {
        if (t.tags) t.tags.forEach(tag => tags.add(tag));
    });

    // Running Days (Based on oldest talk or hardcoded start)
    // If no talks, 0. If talks, diff from first talk? Or Server Start?
    // Let's use the oldest talk as "start of memory"
    let runningDays = 0;
    if (talks.length > 0) {
        const sorted = [...talks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const start = new Date(sorted[0].createdAt);
        const now = new Date();
        const diff = now - start;
        runningDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    res.json({
        talkCount,
        mediaCount,
        tagCount: tags.size,
        runningDays
    });
};

// Get All Tags with counts
exports.getTags = (req, res) => {
    const talks = db.get('talks');
    const tagMap = {}; // { tagName: count }

    talks.forEach(t => {
        if (t.tags && Array.isArray(t.tags)) {
            t.tags.forEach(tag => {
                tagMap[tag] = (tagMap[tag] || 0) + 1;
            });
        }
    });

    // Convert to array
    const tagList = Object.keys(tagMap).map(k => ({ name: k, count: tagMap[k] }));
    tagList.sort((a, b) => b.count - a.count);

    res.json(tagList);
};

// Backup - Export
exports.exportData = (req, res) => {
    try {
        const data = db.getRawData();

        // Remove sensitive data (password hashes)
        const safeData = {
            talks: data.talks || [],
            todos: data.todos || [],
            anniversaries: data.anniversaries || [],
            favorites: data.favorites || [],
            settings: data.settings || {},
            // Do NOT include users/passwords in backup
            _meta: {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                source: 'coet-personal-space'
            }
        };

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `backup-${timestamp}.json`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(safeData, null, 2));
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: '导出失败: ' + error.message });
    }
};

// Backup - Import
exports.importData = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "未选择文件" });
    }

    try {
        // Validate file type
        if (!req.file.originalname.endsWith('.json')) {
            throw new Error("只支持 JSON 格式文件");
        }

        // Read and parse file
        const content = fs.readFileSync(req.file.path, 'utf8');
        let data;
        try {
            data = JSON.parse(content);
        } catch (parseError) {
            throw new Error("JSON 格式错误");
        }

        // Validate structure
        const requiredKeys = ['talks', 'todos', 'anniversaries', 'settings'];
        const missingKeys = requiredKeys.filter(key => !data.hasOwnProperty(key));
        if (missingKeys.length > 0) {
            throw new Error(`缺少必需字段: ${missingKeys.join(', ')}`);
        }

        // Validate data types
        if (!Array.isArray(data.talks)) {
            throw new Error("talks 必须是数组");
        }
        if (!Array.isArray(data.todos)) {
            throw new Error("todos 必须是数组");
        }
        if (!Array.isArray(data.anniversaries)) {
            throw new Error("anniversaries 必须是数组");
        }
        if (typeof data.settings !== 'object' || data.settings === null) {
            throw new Error("settings 必须是对象");
        }

        // Backup current data before importing
        const currentData = db.getRawData();
        const backupDir = path.join(__dirname, '../../data/backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupFile = path.join(backupDir, `backup-before-import-${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(currentData, null, 2));

        // Preserve users (don't overwrite from import)
        data.users = currentData.users || [];

        // Import data
        db.replaceRawData(data);

        // Cleanup temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            message: "数据导入成功",
            backedUp: true,
            backupFile: backupFile
        });
    } catch (error) {
        console.error('Import error:', error);

        // Cleanup temp file on error
        if (fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }

        res.status(500).json({ message: "导入失败: " + error.message });
    }
};

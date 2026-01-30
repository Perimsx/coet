const db = require('../models/db');

// Get Settings
exports.getSettings = (req, res) => {
    const rawData = db.getRawData();
    // Return settings or default if not set (though db.js should set it)
    const settings = rawData.settings || {
        siteTitle: "我的空间",
        siteIcon: "fas fa-rocket",
        siteFavicon: "/favicon.svg",
        userNickname: "Chen",
        userAvatar: "https://ui-avatars.com/api/?name=Chen&background=0984e3&color=fff&size=128",
        badgeIcon: "fas fa-check-circle",
        badgeColor: "#0984e3",
        verified: true
    };
    res.json(settings);
};

// Update Settings
exports.updateSettings = (req, res) => {
    const data = db.getRawData();
    const newSettings = req.body;

    // Merge existing with new
    data.settings = { ...data.settings, ...newSettings };

    db.replaceRawData(data);

    res.json({ message: "Settings updated", settings: data.settings });
};

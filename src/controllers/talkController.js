const db = require('../models/db');
const path = require('path');
const fs = require('fs');

exports.getTalks = (req, res) => {
    let talks = db.get('talks');
    // Sort: Pinned first, then by date desc
    talks.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(talks);
};

exports.createTalk = (req, res) => {
    // Media handled by multer middleware, file paths in req.files
    const { title, content, tags, location, imageUrls, videoUrl } = req.body;

    let finalImages = [];
    if (imageUrls) {
        finalImages = imageUrls.split(',').map(s => s.trim()).filter(s => s);
    }
    if (req.files && req.files['images']) {
        req.files['images'].forEach(f => finalImages.push(`/uploads/${f.filename}`));
    }

    let finalVideo = videoUrl || null;
    if (req.files && req.files['video']) {
        finalVideo = `/uploads/${req.files['video'][0].filename}`;
    }

    const newTalk = {
        id: Date.now().toString(),
        title: title || '',
        content: content || '',
        tags: tags ? JSON.parse(tags) : [],
        location: location || '',
        images: finalImages,
        video: finalVideo,
        isPinned: false,
        isFavorite: false,
        createdAt: new Date().toISOString()
    };

    const talks = db.get('talks');
    talks.push(newTalk);
    db.set('talks', talks);

    res.json(newTalk);
};

exports.deleteTalk = (req, res) => {
    const { id } = req.params;
    let talks = db.get('talks');
    const talk = talks.find(t => t.id === id);
    if (!talk) return res.status(404).json({ message: "Not found" });

    // Optional: Delete files from disk to save space
    // ...

    talks = talks.filter(t => t.id !== id);
    db.set('talks', talks);
    res.json({ message: "Deleted" });
};

exports.togglePin = (req, res) => {
    const { id } = req.params;
    let talks = db.get('talks');
    const talk = talks.find(t => t.id === id);
    if (!talk) return res.status(404).json({ message: "Not found" });

    talk.isPinned = !talk.isPinned;
    db.set('talks', talks);
    res.json(talk);
};

exports.toggleFavorite = (req, res) => {
    const { id } = req.params;
    let talks = db.get('talks');
    const talk = talks.find(t => t.id === id);
    if (!talk) return res.status(404).json({ message: "Not found" });

    talk.isFavorite = !talk.isFavorite;
    db.set('talks', talks);
    res.json(talk);
};

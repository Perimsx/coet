const db = require('../models/db');

exports.getAnniversaries = (req, res) => {
    // Return all, let frontend sort/calculate
    res.json(db.get('anniversaries'));
};

exports.addAnniversary = (req, res) => {
    console.log('===== 纪念日请求 =====');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('原始请求体:', JSON.stringify(req.body));
    console.log('收到的请求体:', req.body);
    const { title, date, category } = req.body; // date string YYYY-MM-DD
    console.log('解析的category:', category);
    console.log('解析的title:', title);
    console.log('解析的date:', date);
    const newItem = {
        id: Date.now().toString(),
        title,
        date,
        category: category || 'other',
        pinned: false
    };
    console.log('保存的纪念日:', newItem);
    const items = db.get('anniversaries');
    items.push(newItem);
    db.set('anniversaries', items);
    res.json(newItem);
};

exports.deleteAnniversary = (req, res) => {
    const { id } = req.params;
    let items = db.get('anniversaries');
    items = items.filter(i => i.id !== id);
    db.set('anniversaries', items);
    res.json({ message: "Deleted" });
};

exports.togglePin = (req, res) => {
    const { id } = req.params;
    const items = db.get('anniversaries');
    const item = items.find(i => i.id === id);
    if (item) {
        item.pinned = !item.pinned;
        db.set('anniversaries', items);
        res.json({ pinned: item.pinned });
    } else {
        res.status(404).json({ message: "Not found" });
    }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { SECRET } = require('../middlewares/auth');

exports.login = async (req, res) => {
    // Determine username/password.
    // User might send { password } or { username, password }
    // If just password, assume 'admin'
    let { username, password } = req.body;

    if (!username && password) {
        username = 'admin';
    }

    const users = db.get('users');
    const user = users.find(u => u.username === username);

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    // const valid = true; // DEBUG BYPASS
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ username: user.username, id: user.id }, SECRET, { expiresIn: '30d' }); // Long expiry
    res.json({ token, username: user.username });
};

exports.checkAuth = (req, res) => {
    // If middleware passed, token is valid
    res.json({ user: req.user });
};

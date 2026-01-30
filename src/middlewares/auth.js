const jwt = require('jsonwebtoken');

const SECRET = 'YOUR_SUPER_SECRET_KEY_CHANGE_THIS'; // In prod, use env var

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken, SECRET };

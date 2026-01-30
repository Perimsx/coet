const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for easier media loading in dev, or configure strictly
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect .html to clean URLs
app.use((req, res, next) => {
    if (req.path.endsWith('.html') && req.path !== '/index.html') {
        const newPath = req.path.slice(0, -5);
        return res.redirect(301, newPath);
    }
    next();
});

// Static Files
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for SPA (if we were using a framework, but here we likely stick to simple pages)
// But for now, we just serve index.html on root.

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

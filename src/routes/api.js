const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');

const authController = require('../controllers/authController');
const talkController = require('../controllers/talkController');
const todoController = require('../controllers/todoController');
const anniversaryController = require('../controllers/anniversaryController');
const systemController = require('../controllers/systemController');
const settingController = require('../controllers/settingController');

// Auth
router.post('/auth/login', authController.login);
router.get('/auth/check', authenticateToken, authController.checkAuth);

// Talks
router.get('/talks', talkController.getTalks); // Public read? Or private? Usually personal website is read-public, write-private.
router.post('/talks', authenticateToken, upload.fields([{ name: 'images', maxCount: 9 }, { name: 'video', maxCount: 1 }]), talkController.createTalk);
router.delete('/talks/:id', authenticateToken, talkController.deleteTalk);
router.put('/talks/:id/pin', authenticateToken, talkController.togglePin);
router.put('/talks/:id/favorite', authenticateToken, talkController.toggleFavorite);

// Todos
router.get('/todos', authenticateToken, todoController.getTodos); // Todos are private
router.post('/todos', authenticateToken, todoController.addTodo);
router.put('/todos/:id', authenticateToken, todoController.toggleTodo);
router.delete('/todos/clear-completed', authenticateToken, todoController.clearCompleted);
router.delete('/todos/:id', authenticateToken, todoController.deleteTodo);

// Anniversaries
router.get('/anniversaries', anniversaryController.getAnniversaries); // Public?
router.post('/anniversaries', authenticateToken, anniversaryController.addAnniversary);
router.delete('/anniversaries/:id', authenticateToken, anniversaryController.deleteAnniversary);
router.put('/anniversaries/:id/pin', authenticateToken, anniversaryController.togglePin);

// Settings
router.get('/settings', settingController.getSettings);
router.put('/settings', authenticateToken, settingController.updateSettings);

// System
router.get('/stats', systemController.getStats);
router.get('/tags', systemController.getTags);
router.get('/backup/export', authenticateToken, systemController.exportData);
router.post('/backup/import', authenticateToken, upload.single('file'), systemController.importData);

module.exports = router;

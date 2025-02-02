const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Initialize or get active chat session
router.get('/session', auth, chatController.initializeSession);

// Send message and get AI response
router.post('/message', auth, chatController.sendMessage);

// Get chat history
router.get('/history', auth, chatController.getChatHistory);

// Close chat session
router.patch('/session/:sessionId/close', auth, chatController.closeSession);

module.exports = router; 
import express from 'express';
import { sendMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: /api/conversations/:id/messages
router.post('/:id/messages', authenticateToken, sendMessage);

export default router;
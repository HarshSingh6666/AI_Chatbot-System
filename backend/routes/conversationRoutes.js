import express from 'express';
import { 
  getConversations, 
  createConversation, 
  getConversationById, 
  updateConversation, 
  deleteConversation, 
  deleteAllConversations,
  exportConversations // 🔹 1. Import added here
} from '../controllers/conversationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken); // Protect all conversation routes

router.get('/', getConversations);
router.post('/', createConversation);
router.delete('/', deleteAllConversations); 

// 🔹 2. Export route must be placed BEFORE /:id route
router.get('/export', exportConversations); 

router.get('/:id', getConversationById);
router.put('/:id', updateConversation);
router.delete('/:id', deleteConversation);

export default router;
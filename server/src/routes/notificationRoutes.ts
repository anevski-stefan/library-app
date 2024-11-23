import express from 'express';
import { auth } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController';

const router = express.Router();

router.get('/', auth(), getNotifications);
router.put('/:id/read', auth(), markAsRead);
router.put('/read-all', auth(), markAllAsRead);

export default router; 
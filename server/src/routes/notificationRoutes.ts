import express from 'express';
import { auth } from '../middleware/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';

const router = express.Router();

router.get('/', auth(), getUserNotifications);
router.put('/:notificationId/read', auth(), markNotificationAsRead);

export default router; 
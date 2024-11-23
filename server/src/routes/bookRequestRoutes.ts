import express from 'express';
import { auth } from '../middleware/auth';
import {
  createBookRequest,
  getAllBookRequests,
  approveBookRequest,
  rejectBookRequest
} from '../controllers/bookRequestController';

const router = express.Router();

router.post('/', auth(['member']), createBookRequest);
router.get('/', auth(['admin']), getAllBookRequests);
router.put('/:id/approve', auth(['admin']), approveBookRequest);
router.put('/:id/reject', auth(['admin']), rejectBookRequest);

export default router; 
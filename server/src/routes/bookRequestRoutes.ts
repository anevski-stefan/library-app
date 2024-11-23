import express from 'express';
import { auth } from '../middleware/auth';
import {
  createBookRequest,
  getAllBookRequests,
  approveBookRequest,
  rejectBookRequest,
  startAcquisition,
  completeAcquisition
} from '../controllers/bookRequestController';

const router = express.Router();

router.post('/', auth(['member']), createBookRequest);
router.get('/', auth(['admin']), getAllBookRequests);
router.put('/:id/approve', auth(['admin']), approveBookRequest);
router.put('/:id/reject', auth(['admin']), rejectBookRequest);
router.put('/:id/start-acquisition', auth(['admin']), startAcquisition);
router.put('/:id/complete-acquisition', auth(['admin']), completeAcquisition);

export default router; 
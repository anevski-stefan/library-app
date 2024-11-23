import express from 'express';
import { auth } from '../middleware/auth';
import {
  borrowBook,
  returnBook,
  getUserBorrows,
} from '../controllers/borrowController';

const router = express.Router();

router.post('/', auth(['member', 'librarian', 'admin']), borrowBook);
router.put('/:borrowId/return', auth(['member', 'librarian', 'admin']), returnBook);
router.get('/user', auth(), getUserBorrows);

export default router; 
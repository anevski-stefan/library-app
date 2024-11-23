import express from 'express';
import { auth } from '../middleware/auth';
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookStats
} from '../controllers/bookController';

const router = express.Router();

router.get('/stats', getBookStats);
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', auth(['admin', 'librarian']), createBook);
router.put('/:id', auth(['admin', 'librarian']), updateBook);
router.delete('/:id', auth(['admin']), deleteBook);

export default router; 
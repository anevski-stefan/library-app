import express from 'express';
import { auth } from '../middleware/auth';
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookStats,
  getBookByIsbn
} from '../controllers/bookController';

const router = express.Router();

router.get('/stats', getBookStats);
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', auth(['admin', 'librarian']), createBook);
router.put('/:id', auth(['admin', 'librarian']), updateBook);
router.delete('/:id', auth(['admin']), deleteBook);
router.get('/isbn/:isbn', getBookByIsbn);

export default router; 
import { Request, Response } from 'express';
import Book from '../models/Book';
import Borrow from '../models/Borrow';

export const createBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ message: 'Error creating book' });
  }
};

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ message: 'Error fetching book' });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    await book.update(req.body);
    res.json(book);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Error updating book' });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    await book.destroy();
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Error deleting book' });
  }
};

export const getBookStats = async (req: Request, res: Response) => {
  try {
    const totalBooks = await Book.sum('quantity');
    const availableBooks = await Book.sum('availableQuantity');
    const borrowedBooks = totalBooks - availableBooks;
    const overdueBooks = await Borrow.count({
      where: {
        status: 'overdue'
      }
    });

    res.json({
      totalBooks,
      availableBooks,
      borrowedBooks,
      overdueBooks
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({ message: 'Error fetching book statistics' });
  }
}; 
import { Request, Response } from 'express';
import Book from '../models/Book';
import Borrow, { BorrowCreationAttributes } from '../models/Borrow';
import { sequelize } from '../config/database';
import { wsService } from '../services/websocketService';

export const borrowBook = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { bookId, returnDate } = req.body;
    const userId = req.user!.id;

    // Check if book exists and is available
    const book = await Book.findByPk(bookId, { transaction: t });
    if (!book) {
      await t.rollback();
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.available_quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Book is not available' });
    }

    // Create borrow record
    const borrowData: BorrowCreationAttributes = {
      userId,
      bookId,
      borrowDate: new Date(),
      returnDate: new Date(returnDate),
      actualReturnDate: null,
      notificationSent: false,
      reminderSent: false
    };

    const borrow = await Borrow.create(borrowData, { transaction: t });

    // Update book availability
    await book.update(
      {
        available_quantity: book.available_quantity - 1,
      },
      { transaction: t }
    );

    // Send notification through WebSocket
    wsService.sendNotification(userId, {
      title: 'Book Borrowed',
      message: `You have successfully borrowed ${book.title}`,
      type: 'success'
    });

    await t.commit();
    res.status(201).json(borrow);
  } catch (error) {
    await t.rollback();
    console.error('Borrow book error:', error);
    res.status(500).json({ message: 'Error borrowing book' });
  }
};

export const returnBook = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { borrowId } = req.params;

    const borrow = await Borrow.findByPk(borrowId, { transaction: t });
    if (!borrow) {
      await t.rollback();
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    if (borrow.actualReturnDate) {
      await t.rollback();
      return res.status(400).json({ message: 'Book already returned' });
    }

    const book = await Book.findByPk(borrow.bookId, { transaction: t });
    if (!book) {
      await t.rollback();
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update borrow record
    await borrow.update(
      {
        actualReturnDate: new Date(),
      },
      { transaction: t }
    );

    // Update book availability
    await book.update(
      {
        available_quantity: book.available_quantity + 1,
      },
      { transaction: t }
    );

    await t.commit();
    res.json(borrow);
  } catch (error) {
    await t.rollback();
    console.error('Return book error:', error);
    res.status(500).json({ message: 'Error returning book' });
  }
};

export const getUserBorrows = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const borrows = await Borrow.findAll({
      where: { userId },
      include: [{
        model: Book,
        as: 'book',
        attributes: ['title', 'author']
      }],
      order: [['borrowDate', 'DESC']],
    });
    res.json(borrows);
  } catch (error) {
    console.error('Get user borrows error:', error);
    res.status(500).json({ message: 'Error fetching borrows' });
  }
}; 
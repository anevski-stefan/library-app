import { Request, Response } from 'express';
import Book from '../models/Book';
import Borrow, { BorrowCreationAttributes } from '../models/Borrow';
import { sequelize } from '../config/database';
import { wsService } from '../services/websocketService';
import User from '../models/User';
import { sendEmail } from '../services/emailService';

async function getAdminEmails(): Promise<string[]> {
  const adminUsers = await User.findAll({
    where: { role: 'admin' },
    attributes: ['email']
  });
  return adminUsers.map(admin => admin.get('email'));
}

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

    const adminEmails = await getAdminEmails();
    for (const adminEmail of adminEmails) {
      await sendEmail(
        adminEmail,
        'New Book Borrowed',
        {
          title: 'New Book Borrowed',
          heading: 'New Book Borrowing Notification',
          content: `
            <p>A new book has been borrowed from the library:</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${book.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Borrower:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${req.user?.firstName} ${req.user?.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Return Date:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(returnDate).toLocaleDateString()}</td>
              </tr>
            </table>
          `,
          actionButton: {
            text: 'View Borrowing Details',
            url: `${process.env.CLIENT_URL}/books/${book.id}`
          }
        }
      );
    }

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

    const adminEmails = await getAdminEmails();
    for (const adminEmail of adminEmails) {
      await sendEmail(
        adminEmail,
        'Book Returned Notification',
        {
          title: 'Book Returned',
          heading: 'Book Return Notification',
          content: `
            <p>A book has been returned to the library:</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${book.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Author:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${book.author}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Returned By:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${req.user?.firstName} ${req.user?.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Return Date:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Borrow ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${borrowId}</td>
              </tr>
            </table>
          `,
          actionButton: {
            text: 'View Book Details',
            url: `${process.env.CLIENT_URL}/books/${book.id}`
          }
        }
      );
    }

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

    // Calculate status for each borrow
    const borrowsWithStatus = borrows.map(borrow => {
      const borrowData = borrow.get({ plain: true });
      const today = new Date();
      
      let status: 'borrowed' | 'returned' | 'overdue';
      if (borrowData.actualReturnDate) {
        status = 'returned';
      } else if (new Date(borrowData.returnDate) < today) {
        status = 'overdue';
      } else {
        status = 'borrowed';
      }

      return {
        ...borrowData,
        status
      };
    });

    res.json(borrowsWithStatus);
  } catch (error) {
    console.error('Get user borrows error:', error);
    res.status(500).json({ message: 'Error fetching borrows' });
  }
}; 
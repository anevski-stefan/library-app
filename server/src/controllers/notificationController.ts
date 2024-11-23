import { Request, Response } from 'express';
import Notification from '../models/Notification';
import Borrow, { BorrowAttributes } from '../models/Borrow';
import { Op } from 'sequelize';
import Book, { BookAttributes } from '../models/Book';

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.update({ read: true });
    res.json(notification);
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

export const checkOverdueBooks = async () => {
  try {
    const overdueBorrows = await Borrow.findAll({
      where: {
        status: 'borrowed',
        returnDate: {
          [Op.lt]: new Date(),
        },
      },
    });

    for (const borrow of overdueBorrows) {
      await borrow.update({ status: 'overdue' });

      await Notification.create({
        userId: borrow.userId,
        message: `Your borrowed book is overdue. Please return it as soon as possible.`,
        type: 'overdue',
        borrowId: borrow.id,
        read: false, 
      });
    }
  } catch (error) {
    console.error('Check overdue books error:', error);
  }
};

export const checkUpcomingDueBooks = async () => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingDueBooks = await Borrow.findAll({
      where: {
        status: 'borrowed',
        returnDate: {
          [Op.and]: {
            [Op.gt]: new Date(),
            [Op.lt]: threeDaysFromNow
          }
        }
      },
      include: [{
        model: Book,
        as: 'book',
        attributes: ['title']
      }]
    });

    for (const borrow of upcomingDueBooks) {
      const borrowData = borrow.get({ plain: true }) as BorrowAttributes & { 
        book: Pick<BookAttributes, 'title'> 
      };
      
      if (!borrowData.book) {
        console.error(`Book not found for borrow ID: ${borrow.id}`);
        continue;
      }

      await Notification.create({
        userId: borrow.userId,
        message: `Your borrowed book "${borrowData.book.title}" is due in 3 days.`,
        type: 'reminder',
        borrowId: borrow.id,
      });
    }
  } catch (error) {
    console.error('Check upcoming due books error:', error);
  }
}; 
import { Request, Response } from 'express';
import Notification from '../models/Notification';
import Borrow, { BorrowAttributes } from '../models/Borrow';
import { Op, WhereOptions } from 'sequelize';
import User from '../models/User';
import { sendEmail } from '../services/emailService';

async function getAdminEmails(): Promise<string[]> {
  const adminUsers = await User.findAll({
    where: { role: 'admin' },
    attributes: ['email']
  });
  return adminUsers.map(admin => admin.get('email'));
}

export const createOverdueNotification = async (
  userId: string,
  bookTitle: string,
  borrowId: string
) => {
  try {
    await Notification.create({
      userId,
      title: 'Book Overdue',
      message: `The book "${bookTitle}" is overdue. Please return it as soon as possible.`,
      type: 'overdue',
      borrowId,
      read: false,
    });

    const adminEmails = await getAdminEmails();
    const emailContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #B45309;">Book Overdue Alert</h2>
      <p>A book is overdue:</p>
      <ul>
        <li>Book: ${bookTitle}</li>
        <li>User ID: ${userId}</li>
        <li>Borrow ID: ${borrowId}</li>
      </ul>
    </div>
    `;

    for (const adminEmail of adminEmails) {
      await sendEmail(
        adminEmail,
        'Book Overdue Alert',
        emailContent
      );
    }
  } catch (error) {
    console.error('Error creating overdue notification:', error);
  }
};

export const createReminderNotification = async (
  userId: string,
  bookTitle: string,
  borrowId: string,
  daysLeft: number
) => {
  try {
    await Notification.create({
      userId,
      title: 'Return Reminder',
      message: `The book "${bookTitle}" is due in ${daysLeft} days.`,
      type: 'reminder',
      borrowId,
    });
  } catch (error) {
    console.error('Error creating reminder notification:', error);
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ read: true });
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Notification.update(
      { read: true },
      {
        where: {
          userId,
          read: false,
        },
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

export const createReturnNotification = async (
  userId: string,
  bookTitle: string,
  borrowId: string
) => {
  try {
    await Notification.create({
      userId,
      title: 'Book Returned',
      message: `The book "${bookTitle}" has been returned successfully.`,
      type: 'return',
      borrowId,
    });
  } catch (error) {
    console.error('Error creating return notification:', error);
  }
};

export const createBookRequestNotification = async (
  userId: string,
  bookTitle: string,
  bookRequestId: string
) => {
  try {
    await Notification.create({
      userId,
      title: 'New Book Request',
      message: `A new request has been submitted for "${bookTitle}".`,
      type: 'book_request',
      bookRequestId,
    });
  } catch (error) {
    console.error('Error creating book request notification:', error);
  }
};

export const createRequestApprovedNotification = async (
  userId: string,
  bookTitle: string,
  bookRequestId: string
) => {
  try {
    await Notification.create({
      userId,
      title: 'Request Approved',
      message: `Your request for "${bookTitle}" has been approved.`,
      type: 'request_approved',
      bookRequestId,
    });
  } catch (error) {
    console.error('Error creating request approved notification:', error);
  }
};

export const createRequestRejectedNotification = async (
  userId: string,
  bookTitle: string,
  bookRequestId: string,
  reason?: string
) => {
  try {
    await Notification.create({
      userId,
      title: 'Request Rejected',
      message: `Your request for "${bookTitle}" has been rejected.${
        reason ? ` Reason: ${reason}` : ''
      }`,
      type: 'request_rejected',
      bookRequestId,
    });
  } catch (error) {
    console.error('Error creating request rejected notification:', error);
  }
};

export const checkOverdueBooks = async () => {
  try {
    const today = new Date();
    const whereClause: WhereOptions<BorrowAttributes> = {
      returnDate: {
        [Op.lt]: today
      },
      actualReturnDate: null,
      notificationSent: false
    };

    const overdueBooks = await Borrow.findAll({
      where: whereClause,
      include: ['user', 'book']
    });

    for (const borrow of overdueBooks) {
      if (!borrow.book) {
        console.error(`Book not found for borrow ID: ${borrow.id}`);
        continue;
      }

      await createOverdueNotification(
        borrow.userId,
        borrow.book.title,
        borrow.id
      );

      await borrow.update({ notificationSent: true });
    }
  } catch (error) {
    console.error('Error checking overdue books:', error);
  }
};

export const checkUpcomingDueBooks = async () => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date(today.setDate(today.getDate() + 3));
    
    const whereClause: WhereOptions<BorrowAttributes> = {
      returnDate: {
        [Op.lte]: threeDaysFromNow,
        [Op.gt]: today
      },
      actualReturnDate: null,
      reminderSent: false
    };

    const upcomingDueBooks = await Borrow.findAll({
      where: whereClause,
      include: ['user', 'book']
    });

    for (const borrow of upcomingDueBooks) {
      if (!borrow.book) {
        console.error(`Book not found for borrow ID: ${borrow.id}`);
        continue;
      }

      const daysLeft = Math.ceil(
        (borrow.returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      await createReminderNotification(
        borrow.userId,
        borrow.book.title,
        borrow.id,
        daysLeft
      );

      await borrow.update({ reminderSent: true });
    }
  } catch (error) {
    console.error('Error checking upcoming due books:', error);
  }
};

export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Notification.destroy({
      where: { userId }
    });

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Error clearing notifications' });
  }
}; 
import { Request, Response } from 'express';
import BookRequest from '../models/BookRequest';
import User from '../models/User';
import { wsService } from '../services/websocketService';
import Notification from '../models/Notification';

export const createBookRequest = async (req: Request, res: Response) => {
  try {
    const { title, author, external_link } = req.body;
    const userId = req.user?.id;

    const bookRequest = await BookRequest.create({
      user_id: userId,
      title,
      author,
      external_link,
      status: 'pending'
    });

    // Find all admin users
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      }
    });

    // Create notifications for each admin
    for (const admin of adminUsers) {
      await Notification.create({
        userId: admin.id,
        title: 'New Book Request',
        message: `New book request: "${title}" by ${author}`,
        type: 'book_request',
        read: false,
        bookRequestId: bookRequest.id
      });

      // Send WebSocket notification
      wsService.sendNotification(admin.id, {
        title: 'New Book Request',
        message: `New book request: "${title}" by ${author}`,
        type: 'book_request',
        bookRequestId: bookRequest.id
      });
    }

    res.status(201).json(bookRequest);
  } catch (error) {
    console.error('Create book request error:', error);
    res.status(500).json({ message: 'Error creating book request' });
  }
};

export const getAllBookRequests = async (req: Request, res: Response) => {
  try {
    const requests = await BookRequest.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    console.error('Get book requests error:', error);
    res.status(500).json({ message: 'Error fetching book requests' });
  }
};

export const approveBookRequest = async (req: Request, res: Response) => {
  try {
    const request = await BookRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    await request.update({ status: 'approved' });
    res.json(request);
  } catch (error) {
    console.error('Approve book request error:', error);
    res.status(500).json({ message: 'Error approving book request' });
  }
};

export const rejectBookRequest = async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;
    const request = await BookRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    await request.update({ 
      status: 'rejected',
      admin_comment: comment
    });
    res.json(request);
  } catch (error) {
    console.error('Reject book request error:', error);
    res.status(500).json({ message: 'Error rejecting book request' });
  }
}; 
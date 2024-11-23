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
    const request = await BookRequest.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    await request.update({ status: 'approved' });

    // Send notification to the user who made the request
    await Notification.create({
      userId: request.user_id,
      title: 'Book Request Approved',
      message: `Your request for "${request.title}" has been approved!`,
      type: 'request_approved',
      bookRequestId: request.id,
      read: false
    });

    // Send WebSocket notification to the user
    wsService.sendNotification(request.user_id, {
      title: 'Book Request Approved',
      message: `Your request for "${request.title}" has been approved!`,
      type: 'request_approved',
      bookRequestId: request.id
    });

    res.json(request);
  } catch (error) {
    console.error('Approve book request error:', error);
    res.status(500).json({ message: 'Error approving book request' });
  }
};

export const rejectBookRequest = async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;
    const request = await BookRequest.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    await request.update({ 
      status: 'rejected',
      admin_comment: comment
    });

    // Send notification to the user who made the request
    await Notification.create({
      userId: request.user_id,
      title: 'Book Request Rejected',
      message: `Your request for "${request.title}" has been rejected. Reason: ${comment}`,
      type: 'request_rejected',
      bookRequestId: request.id,
      read: false
    });

    // Send WebSocket notification to the user
    wsService.sendNotification(request.user_id, {
      title: 'Book Request Rejected',
      message: `Your request for "${request.title}" has been rejected. Reason: ${comment}`,
      type: 'request_rejected',
      bookRequestId: request.id
    });

    res.json(request);
  } catch (error) {
    console.error('Reject book request error:', error);
    res.status(500).json({ message: 'Error rejecting book request' });
  }
};

export const startAcquisition = async (req: Request, res: Response) => {
  try {
    const request = await BookRequest.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ 
        message: 'Only approved requests can be moved to acquisition process' 
      });
    }
    
    await request.update({ status: 'in_progress' });

    // Send notification to the user
    await Notification.create({
      userId: request.user_id,
      title: 'Book Acquisition Started',
      message: `We have started the acquisition process for "${request.title}"`,
      type: 'acquisition_started',
      bookRequestId: request.id
    });

    // Send WebSocket notification
    wsService.sendNotification(request.user_id, {
      title: 'Book Acquisition Started',
      message: `We have started the acquisition process for "${request.title}"`,
      type: 'acquisition_started',
      bookRequestId: request.id
    });

    res.json(request);
  } catch (error) {
    console.error('Start acquisition error:', error);
    res.status(500).json({ message: 'Error starting acquisition process' });
  }
};

export const completeAcquisition = async (req: Request, res: Response) => {
  try {
    const request = await BookRequest.findByPk(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'in_progress') {
      return res.status(400).json({ message: 'Request is not in acquisition process' });
    }
    
    await request.update({ status: 'completed' });

    // Debug log
    console.log('Request details:', {
      requestUserId: request.user_id,
      adminId: req.user?.id
    });

    // Send notification to the requesting user
    await Notification.create({
      userId: request.user_id,  // Using user_id directly from the request
      title: 'Book Acquisition Completed',
      message: `Great news! Your requested book "${request.title}" has been acquired and will be available in the library soon.`,
      type: 'acquisition_completed',
      bookRequestId: request.id
    });

    // Send WebSocket notification to the requesting user
    wsService.sendNotification(request.user_id, {
      title: 'Book Acquisition Completed',
      message: `Great news! Your requested book "${request.title}" has been acquired and will be available in the library soon.`,
      type: 'acquisition_completed',
      bookRequestId: request.id
    });

    res.json(request);
  } catch (error) {
    console.error('Complete acquisition error:', error);
    res.status(500).json({ message: 'Error completing acquisition process' });
  }
}; 
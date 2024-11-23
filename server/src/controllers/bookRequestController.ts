import { Request, Response } from 'express';
import BookRequest from '../models/BookRequest';
import User from '../models/User';
import { wsService } from '../services/websocketService';
import Notification from '../models/Notification';
import { sendEmail } from '../services/emailService';

// Define the shape of the included user data
interface IncludedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Define a type for the book request with included user
type BookRequestWithUser = Omit<BookRequest, 'user'> & {
  user: IncludedUser;
  user_id: string;
};

// Helper function to safely convert User model to IncludedUser
function toIncludedUser(user: any): IncludedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  };
}

export const createBookRequest = async (req: Request, res: Response) => {
  try {
    const { title, author, external_link } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

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

    const notificationMessage = `New book request: "${title}" by ${author}`;

    // Create notifications and send emails for each admin
    for (const admin of adminUsers) {
      // Create notification
      await Notification.create({
        userId: admin.get('id'),
        title: 'New Book Request',
        message: notificationMessage,
        type: 'book_request',
        read: false,
        bookRequestId: bookRequest.get('id')
      });

      // Send WebSocket notification
      wsService.sendNotification(admin.get('id'), {
        title: 'New Book Request',
        message: notificationMessage,
        type: 'book_request',
        bookRequestId: bookRequest.get('id')
      });

      // Send email notification
      await sendEmail(
        admin.get('email'),
        'New Book Request',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #B45309;">New Book Request</h2>
          <p>${notificationMessage}</p>
          <p>Please log in to the system to review this request.</p>
        </div>
        `
      );
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
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const userData = request.get('user');
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = toIncludedUser(userData);
    
    await request.update({ status: 'approved' });

    const notificationMessage = `Your request for "${request.get('title')}" has been approved!`;

    // Create notification
    await Notification.create({
      userId: request.get('user_id'),
      title: 'Book Request Approved',
      message: notificationMessage,
      type: 'request_approved',
      bookRequestId: request.get('id'),
      read: false
    });

    // Send WebSocket notification
    wsService.sendNotification(request.get('user_id'), {
      title: 'Book Request Approved',
      message: notificationMessage,
      type: 'request_approved',
      bookRequestId: request.get('id')
    });

    // Send email notification
    await sendEmail(
      user.email,
      'Book Request Approved',
      `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #B45309;">Book Request Approved</h2>
        <p>${notificationMessage}</p>
        <p>We will notify you once the book acquisition process begins.</p>
      </div>
      `
    );

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
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const userData = request.get('user');
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = toIncludedUser(userData);
    
    await request.update({ 
      status: 'rejected',
      admin_comment: comment
    });

    const notificationMessage = `Your request for "${request.get('title')}" has been rejected. Reason: ${comment}`;

    // Create notification
    await Notification.create({
      userId: request.get('user_id'),
      title: 'Book Request Rejected',
      message: notificationMessage,
      type: 'request_rejected',
      bookRequestId: request.get('id'),
      read: false
    });

    // Send WebSocket notification
    wsService.sendNotification(request.get('user_id'), {
      title: 'Book Request Rejected',
      message: notificationMessage,
      type: 'request_rejected',
      bookRequestId: request.get('id')
    });

    // Send email notification
    await sendEmail(
      user.email,
      'Book Request Rejected',
      `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #B45309;">Book Request Rejected</h2>
        <p>${notificationMessage}</p>
        <p>If you have any questions, please contact the library staff.</p>
      </div>
      `
    );

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
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    if (!request || !request.get('user')) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const user = request.get('user') as IncludedUser;

    if (request.get('status') !== 'approved') {
      return res.status(400).json({ 
        message: 'Only approved requests can be moved to acquisition process' 
      });
    }
    
    await request.update({ status: 'in_progress' });

    const notificationMessage = `We have started the acquisition process for "${request.get('title')}"`;

    // Send notification to the user
    await Notification.create({
      userId: request.get('user_id'),
      title: 'Book Acquisition Started',
      message: notificationMessage,
      type: 'acquisition_started',
      bookRequestId: request.get('id')
    });

    // Send WebSocket notification
    wsService.sendNotification(request.get('user_id'), {
      title: 'Book Acquisition Started',
      message: notificationMessage,
      type: 'acquisition_started',
      bookRequestId: request.get('id')
    });

    // Send email notification
    await sendEmail(
      user.email,
      'Book Acquisition Started',
      `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #B45309;">Book Acquisition Started</h2>
        <p>${notificationMessage}</p>
      </div>
      `
    );

    res.json(request);
  } catch (error) {
    console.error('Start acquisition error:', error);
    res.status(500).json({ message: 'Error starting acquisition process' });
  }
};

export const completeAcquisition = async (req: Request, res: Response) => {
  try {
    const request = await BookRequest.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    if (!request || !request.get('user')) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const user = request.get('user') as IncludedUser;

    if (request.get('status') !== 'in_progress') {
      return res.status(400).json({ message: 'Request is not in acquisition process' });
    }
    
    await request.update({ status: 'completed' });

    const notificationMessage = `Great news! Your requested book "${request.get('title')}" has been acquired and will be available in the library soon.`;

    // Send notification to the requesting user
    await Notification.create({
      userId: request.get('user_id'),
      title: 'Book Acquisition Completed',
      message: notificationMessage,
      type: 'acquisition_completed',
      bookRequestId: request.get('id')
    });

    // Send WebSocket notification
    wsService.sendNotification(request.get('user_id'), {
      title: 'Book Acquisition Completed',
      message: notificationMessage,
      type: 'acquisition_completed',
      bookRequestId: request.get('id')
    });

    // Send email notification
    await sendEmail(
      user.email,
      'Book Acquisition Completed',
      `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #B45309;">Book Acquisition Completed</h2>
        <p>${notificationMessage}</p>
      </div>
      `
    );

    res.json(request);
  } catch (error) {
    console.error('Complete acquisition error:', error);
    res.status(500).json({ message: 'Error completing acquisition process' });
  }
}; 
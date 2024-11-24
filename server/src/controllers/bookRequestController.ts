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
  role: 'admin' | 'librarian' | 'member';
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
    lastName: user.lastName,
    role: user.role
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
        {
          title: 'New Book Request',
          heading: 'New Book Request Received',
          content: `
            <p>A new book request has been submitted:</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Author:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${author}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requested By:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${req.user?.firstName} ${req.user?.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requester Email:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${req.user?.email}</td>
              </tr>
              ${external_link ? `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>External Link:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${external_link}" style="color: #B45309;">${external_link}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Request Date:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
            <p>Please review this request and take appropriate action.</p>
          `,
          actionButton: {
            text: 'Review Request',
            url: `${process.env.CLIENT_URL}/requests`
          }
        }
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
      {
        title: 'Book Request Approved',
        heading: 'Book Request Status Update',
        content: `
          <p>Dear ${user.firstName},</p>
          <p>${notificationMessage}</p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.get('title')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Approved</td>
            </tr>
          </table>
          <p>We will notify you once the book acquisition process begins.</p>
        `
      }
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
      {
        title: 'Book Request Rejected',
        heading: 'Book Request Status Update',
        content: `
          <p>Dear ${user.firstName},</p>
          <p>${notificationMessage}</p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.get('title')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Rejected</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${comment}</td>
            </tr>
          </table>
          <p>If you have any questions, please contact the library staff.</p>
        `
      }
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
        attributes: ['id', 'email', 'firstName', 'lastName']
      }]
    });

    if (!request || !request.get('user')) {
      return res.status(404).json({ message: 'Request not found' });
    }

    console.log('Full request object:', request.toJSON());
    console.log('User object:', request.get('user'));
    
    const user = request.get('user') as IncludedUser;
    console.log('Parsed user:', user);

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
      {
        title: 'Book Acquisition Started',
        heading: 'Book Acquisition Process Initiated',
        content: `
          <p>Dear ${user.firstName},</p>
          <p>We have started the acquisition process for your requested book:</p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.get('title')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Author:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.get('author')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">In Progress</td>
            </tr>
          </table>
          <p>We will keep you updated on the progress of your request.</p>
        `
      }
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

    // 1. Update request status
    await request.update({ status: 'completed' });

    // 2. Create notification message
    const notificationMessage = `The acquisition process for "${request.get('title')}" has been completed!`;

    // 3. Create in-app notification
    await Notification.create({
      userId: request.get('user_id'),
      title: 'Book Acquisition Completed',
      message: notificationMessage,
      type: 'acquisition_completed',
      bookRequestId: request.get('id'),
      read: false
    });

    // 4. Send WebSocket notification
    wsService.sendNotification(request.get('user_id'), {
      title: 'Book Acquisition Completed',
      message: notificationMessage,
      type: 'acquisition_completed',
      bookRequestId: request.get('id')
    });

    // 5. Send email notification
    await sendEmail(
      userData.email,
      'Book Acquisition Completed',
      {
        title: 'Book Acquisition Completed',
        heading: 'Book Acquisition Successfully Completed',
        content: `
          <p>Dear ${userData.firstName},</p>
          <p>Great news! Your requested book has been acquired:</p>
          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>Book Title:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.get('title')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Author:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${request.get('author')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Completed</td>
            </tr>
          </table>
          <p>The book will be available in the library soon.</p>
        `
      }
    );

    res.json(request);
  } catch (error) {
    console.error('Complete acquisition error:', error);
    res.status(500).json({ message: 'Error completing acquisition process' });
  }
}; 
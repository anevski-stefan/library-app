import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import type { TransportOptions } from 'nodemailer';
import User, { UserCreationAttributes } from '../models/User';
import { sendWebSocketNotification } from '../services/websocketService';
import { Op } from 'sequelize';
import { sendEmail } from '../services/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;

    if (!email.endsWith(allowedDomain)) {
      return res.status(400).json({ 
        message: `Registration is only allowed for emails with domain ${allowedDomain}`
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: UserCreationAttributes = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'member',
    };

    const user = await User.create(userData);

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    res.json({ user: userResponse, token });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials missing. Check environment variables.');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    } as TransportOptions);

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    await user.update({
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 3600000)
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      'Password Reset Request',
      {
        title: 'Reset Your Password',
        heading: 'Password Reset Request',
        content: `
          <p>Dear ${user.firstName},</p>
          <p>We received a request to reset your password for your BookHive Library account.</p>
          <p>Click the button below to set a new password:</p>
        `,
        actionButton: {
          text: 'Reset Password',
          url: resetUrl
        },
        footerText: 'This password reset link will expire in 1 hour. If you did not request this reset, please ignore this email.'
      }
    );

    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Error sending password reset email',
      detail: error.message 
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findOne({
      where: {
        id: decoded.id,
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    sendWebSocketNotification(user.id, {
      type: 'PASSWORD_RESET_COMPLETED',
      message: 'Your password has been successfully reset'
    });

    res.json({ message: 'Password successfully reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Invalid or expired token' });
  }
}; 
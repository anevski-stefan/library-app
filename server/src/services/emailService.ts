import nodemailer from 'nodemailer';
import type { TransportOptions } from 'nodemailer';

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials missing. Check environment variables.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  } as TransportOptions);
};

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: htmlContent
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 
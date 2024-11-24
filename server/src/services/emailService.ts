import nodemailer from 'nodemailer';
import type { TransportOptions } from 'nodemailer';

interface EmailTemplateData {
  title: string;
  heading: string;
  content: string;
  actionButton?: {
    text: string;
    url: string;
  };
  footerText?: string;
}

const createEmailTemplate = ({
  title,
  heading,
  content,
  actionButton,
  footerText
}: EmailTemplateData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" width="100%" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td style="background-color: #B45309; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">BookHive Library</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #B45309; margin: 0 0 20px 0; font-size: 20px;">${heading}</h2>
              ${content}
              
              ${actionButton ? `
              <table role="presentation" style="margin: 30px auto;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 4px; background-color: #B45309;">
                    <a href="${actionButton.url}" 
                       style="border: none; border-radius: 4px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; padding: 12px 24px; text-decoration: none; text-transform: uppercase;">
                      ${actionButton.text}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 24px; text-align: center; font-size: 14px; color: #666666;">
              ${footerText || 'This is an automated message from BookHive Library System. Please do not reply to this email.'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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

export const sendEmail = async (to: string, subject: string, templateData: EmailTemplateData) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: createEmailTemplate(templateData)
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 
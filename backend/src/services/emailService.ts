import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set. Email service will not function correctly.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
    console.error('👉 Ensure EMAIL_USER is correct and EMAIL_PASS is a 16-character App Password.');
  } else {
    console.log('✅ SMTP Server is ready to take our messages');
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Book-Buddy Library" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

const getBaseHtml = (title: string, message: string, color: string = '#6366f1', ctaText?: string, ctaLink?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, ${color}, #4f46e5); padding: 32px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 40px 30px; text-align: left; }
        .content p { margin: 0 0 16px; font-size: 16px; color: #475569; }
        .button-wrapper { text-align: center; margin-top: 32px; }
        .button { background-color: ${color}; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.2s ease; }
        .footer { background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 14px; }
        .footer p { margin: 4px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Book-Buddy Library</h1>
        </div>
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
            <p>${message}</p>
            ${ctaText && ctaLink ? `
            <div class="button-wrapper">
                <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p><strong>Book-Buddy Library Management</strong></p>
            <p>© 2024 FAMT Library. All rights reserved.</p>
            <p>Finolex Academy of Management and Technology, Ratnagiri.</p>
        </div>
    </div>
</body>
</html>
`;

export const sendRenewalAlert = async (userEmail: string, bookTitle: string, status: 'approved' | 'rejected') => {
  const title = `Book Renewal ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  const message = `Hello, your request to renew <strong>"${bookTitle}"</strong> has been ${status}. Please check your dashboard for the new due date and any updated fine information.`;
  const color = status === 'approved' ? '#10b981' : '#f43f5e';
  const html = getBaseHtml(title, message, color, 'Go to Dashboard', 'http://localhost:8080/dashboard');
  return sendEmail(userEmail, title, html);
};

export const sendDueDateReminder = async (userEmail: string, bookTitle: string, dueDate: string) => {
  const title = `Due Date Reminder`;
  const message = `This is a friendly reminder that the book <strong>"${bookTitle}"</strong> you borrowed is due on <strong>${dueDate}</strong>. Please ensure you return or renew it to avoid late delivery fines.`;
  const html = getBaseHtml(title, message, '#6366f1', 'View Borrowed Books', 'http://localhost:8080/student/books');
  return sendEmail(userEmail, `Reminder: "${bookTitle}" is due soon`, html);
};

export const sendOverdueAlert = async (userEmail: string, bookTitle: string, dueDate: string, daysOverdue: number) => {
  const title = `URGENT: Book Overdue`;
  const message = `Your book <strong>"${bookTitle}"</strong> was due on <strong>${dueDate}</strong>. It is currently <strong>${daysOverdue} days overdue</strong>. A fine is accumulating daily. Please return it as soon as possible.`;
  const html = getBaseHtml(title, message, '#f43f5e', 'Pay Fine & Return', 'http://localhost:8080/dashboard');
  return sendEmail(userEmail, `URGENT: "${bookTitle}" is ${daysOverdue} days Overdue`, html);
};

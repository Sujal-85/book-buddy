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
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"BookBuddy Library" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};

export const sendRenewalAlert = async (userEmail: string, bookTitle: string, status: 'approved' | 'rejected') => {
  const subject = `Book Renewal ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  const message = `Hello, your request to renew "${bookTitle}" has been ${status}. Please check your dashboard for the new due date.`;
  return sendEmail(userEmail, subject, message);
};

export const sendDueDateReminder = async (userEmail: string, bookTitle: string, dueDate: string) => {
  const subject = `Reminder: "${bookTitle}" is due soon`;
  const message = `This is a reminder that the book "${bookTitle}" you borrowed is due on ${dueDate}. Please return or renew it to avoid fines.`;
  return sendEmail(userEmail, subject, message);
};

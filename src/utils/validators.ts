import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  studentId: z.string().min(1, 'Student ID is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author is required').max(200),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters').max(13),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(1000).optional(),
  totalCopies: z.coerce.number().min(1, 'Must have at least 1 copy'),
  publisher: z.string().max(200).optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
});

export const memberSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  studentId: z.string().min(1, 'Student ID is required'),
});

export const settingsSchema = z.object({
  libraryName: z.string().min(1, 'Library name is required'),
  timings: z.string().optional(),
  contact: z.string().optional(),
  rules: z.string().optional(),
  finePerDay: z.coerce.number().min(0, 'Fine cannot be negative'),
  maxBorrowDays: z.coerce.number().min(1, 'Must be at least 1 day'),
  maxBooksPerStudent: z.coerce.number().min(1, 'Must be at least 1 book'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BookFormData = z.infer<typeof bookSchema>;
export type MemberFormData = z.infer<typeof memberSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;

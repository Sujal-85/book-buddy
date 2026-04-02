import { format } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'd MMM yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'd MMM yyyy, h:mm a');
};

export const calculateFine = (dueDate: string | Date, finePerDay: number = 5): number => {
  const due = new Date(dueDate);
  const today = new Date();
  if (today <= due) return 0;
  const diffTime = Math.abs(today.getTime() - due.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * finePerDay;
};

export const getDaysOverdue = (dueDate: string | Date): number => {
  const due = new Date(dueDate);
  const today = new Date();
  if (today <= due) return 0;
  const diffTime = Math.abs(today.getTime() - due.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

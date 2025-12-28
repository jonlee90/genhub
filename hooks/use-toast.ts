'use client';

import toast from 'react-hot-toast';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const showToast = ({ title, description, variant = 'default', duration = 4000 }: ToastProps) => {
    const message = description || title || '';
    const fullMessage = title && description ? `${title}\n${description}` : message;

    if (variant === 'destructive') {
      toast.error(fullMessage, {
        duration,
        style: {
          background: '#DC2626',
          color: '#FFFFFF',
          fontWeight: '600',
          border: '2px solid #B91C1C',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#DC2626',
        },
      });
    } else {
      toast.success(fullMessage, {
        duration,
        style: {
          background: '#FFFFFF',
          color: '#001B51',
          fontWeight: '600',
          border: '2px solid #001B51',
        },
        iconTheme: {
          primary: '#001B51',
          secondary: '#FFFFFF',
        },
      });
    }
  };

  return {
    toast: showToast,
  };
}

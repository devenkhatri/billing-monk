'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationProps, NotificationContainer } from '@/components/ui/notification';

interface NotificationContextType {
  addNotification: (notification: Omit<NotificationProps, 'id' | 'onClose'>) => void;
  removeNotification: (id: string) => void;
  addErrorNotification: (message: string, retryFn?: () => void) => void;
  addSuccessNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = (notification: Omit<NotificationProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationProps = {
      ...notification,
      id,
      onClose: removeNotification,
    };

    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const addErrorNotification = (message: string, retryFn?: () => void) => {
    const actions = retryFn ? [
      {
        label: 'Retry',
        onClick: () => {
          retryFn();
          // Don't remove notification immediately, let the retry operation handle it
        },
        variant: 'primary' as const
      }
    ] : [];

    addNotification({
      type: 'error',
      title: 'Error',
      message,
      duration: retryFn ? 10000 : 5000, // Longer duration if retry is available
      actions
    });
  };

  const addSuccessNotification = (message: string) => {
    addNotification({
      type: 'success',
      title: 'Success',
      message,
      duration: 3000
    });
  };

  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      removeNotification, 
      addErrorNotification, 
      addSuccessNotification 
    }}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
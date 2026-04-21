'use client';

import * as React from 'react';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast';

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToasterContextValue {
  toast: (data: Omit<ToastData, 'id'>) => void;
}

const ToasterContext = React.createContext<ToasterContextValue>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToasterContext);
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...data, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, data.duration ?? 4000);
  }, []);

  return (
    <ToasterContext.Provider value={{ toast }}>
      {children}
      <ToastProvider>
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant} open>
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
            <ToastClose onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToasterContext.Provider>
  );
}

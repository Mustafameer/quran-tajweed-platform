import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none text-right" dir="rtl">
        <AnimatePresence>
          {toasts.map((toast) => {
            let bgColor = 'bg-white border-slate-100 text-slate-800';
            let icon = <Info className="h-5 w-5 text-indigo-500" />;
            
            if (toast.type === 'success') {
              bgColor = 'bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-900/60 dark:text-emerald-300';
              icon = <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
            } else if (toast.type === 'error') {
              bgColor = 'bg-rose-50 border-rose-100 text-rose-950 dark:bg-rose-950/90 dark:border-rose-900/60 dark:text-rose-300';
              icon = <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />;
            } else if (toast.type === 'warning') {
              bgColor = 'bg-amber-50 border-amber-100 text-amber-950 dark:bg-amber-950/90 dark:border-amber-900/60 dark:text-amber-300';
              icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
            } else {
              bgColor = 'bg-sky-50 border-sky-100 text-sky-950 dark:bg-sky-950/90 dark:border-sky-900/60 dark:text-sky-300';
              icon = <Info className="h-5 w-5 text-sky-500 shrink-0" />;
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${bgColor} backdrop-blur-md`}
              >
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1 text-xs font-bold leading-relaxed">{toast.message}</div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

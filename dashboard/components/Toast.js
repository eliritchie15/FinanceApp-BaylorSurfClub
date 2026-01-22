'use client';
import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              min-w-80 p-4 rounded-lg shadow-lg text-white font-medium
              transform transition-all duration-300 ease-in-out
              ${toast.type === 'success' ? 'bg-green-500' : ''}
              ${toast.type === 'error' ? 'bg-red-500' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-500' : ''}
              animate-slide-in
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Icon */}
                {toast.type === 'success' && <span className="text-2xl">✓</span>}
                {toast.type === 'error' && <span className="text-2xl">✕</span>}
                {toast.type === 'warning' && <span className="text-2xl">⚠</span>}
                {toast.type === 'info' && <span className="text-2xl">ℹ</span>}
                
                <span>{toast.message}</span>
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, toasts }}>
      {children}
      
      {/* Global Floating Toast Container */}
      <div className="fixed top-4 right-4 z-110 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          let bgClass = 'bg-slate-800 text-white';
          let borderClass = 'border-slate-700';
          
          if (toast.type === 'success') {
            bgClass = 'bg-emerald-500/90 text-white border-emerald-400';
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-500/90 text-white border-rose-400';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-500/90 text-slate-900 border-amber-400';
          } else if (toast.type === 'info') {
            bgClass = 'bg-sky-500/90 text-white border-sky-400';
          }

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border shadow-lg backdrop-blur-md flex justify-between items-center pointer-events-auto transition-all duration-300 transform translate-y-0 scale-100 ${bgClass} ${borderClass} animate-slide-up`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 hover:opacity-75 focus:outline-none text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
export default NotificationContext;

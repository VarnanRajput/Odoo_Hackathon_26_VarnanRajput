import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = (text = 'Loading...') => {
    setLoadingText(text);
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ loading, loadingText, showLoader, hideLoader }}>
      {children}
      {loading && (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
          <p className="mt-4 text-sm font-semibold text-white tracking-wide">{loadingText}</p>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
export default LoadingContext;

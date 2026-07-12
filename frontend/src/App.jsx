import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';
import AppRoutes from './routes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <LoadingProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </LoadingProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

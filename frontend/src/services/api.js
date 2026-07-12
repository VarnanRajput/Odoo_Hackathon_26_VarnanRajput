import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handler & 401 Logout
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    
    if (status === 401) {
      console.warn('Unauthorized token, clearing auth state...');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Dispatch custom event to trigger app logout in AuthContext
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    // Extract error message
    const message = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message || 'API request failed';
      
    const errorDetails = new Error(message);
    errorDetails.status = status;
    errorDetails.response = error.response;
    
    return Promise.reject(errorDetails);
  }
);

export default api;

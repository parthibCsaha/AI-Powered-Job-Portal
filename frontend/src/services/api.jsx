import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirecting = false;

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401 && !isRedirecting) {
      // Token expired or invalid — log out and redirect to login
      isRedirecting = true;
      console.log('Token expired - logging out');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (status === 403 && !isRedirecting) {
      // Forbidden — user is logged in but doesn't have permission
      isRedirecting = true;
      window.location.href = '/unauthorized';
    }

    // Reset flag after a short delay so future errors are still caught
    if (isRedirecting) {
      setTimeout(() => { isRedirecting = false; }, 2000);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://appointment-scheduler-server.vercel.app/api'
};

// Export API endpoints
export const API_ENDPOINTS = {
  APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id) => `/appointments/${id}`
  }
};

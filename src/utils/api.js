import axios from 'axios';

export const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://34.234.65.13'
    : window.location.origin);

export const getBackendUrl = () => {
  const saved = localStorage.getItem('mailflow-backend-url');
  return saved || DEFAULT_BACKEND_URL;
};

export const setBackendUrl = (url) => {
  if (url && url.trim() !== '') {
    localStorage.setItem('mailflow-backend-url', url.trim());
  } else {
    localStorage.removeItem('mailflow-backend-url');
  }
};

const api = axios.create();

// Interceptor to inject baseURL and Authorization headers dynamically
api.interceptors.request.use((config) => {
  config.baseURL = getBackendUrl();
  const token = localStorage.getItem('mailflow-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle automatic token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't retry refresh requests to prevent loops
    if (originalRequest.url?.includes('/auth/token/refresh/')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('mailflow-refresh-token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${getBackendUrl()}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          const newAccess = res.data.access;
          localStorage.setItem('mailflow-access-token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token expired/invalid, clear tokens and dispatch event
          localStorage.removeItem('mailflow-access-token');
          localStorage.removeItem('mailflow-refresh-token');
          window.dispatchEvent(new Event('auth-logout'));
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export { api };

// Authentication APIs
export const registerUser = async (email, fullName, password, confirmPassword) => {
  const response = await api.post('/api/auth/register/', {
    email,
    full_name: fullName,
    password,
    confirm_password: confirmPassword
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login/', {
    email,
    password
  });
  return response.data;
};

export const logoutUser = async () => {
  const refreshToken = localStorage.getItem('mailflow-refresh-token');
  if (refreshToken) {
    try {
      await api.post('/api/auth/logout/', { refresh: refreshToken });
    } catch (e) {
      console.error('Logout request failed', e);
    }
  }
  localStorage.removeItem('mailflow-access-token');
  localStorage.removeItem('mailflow-refresh-token');
  window.dispatchEvent(new Event('auth-logout'));
};

export const fetchProfile = async () => {
  const response = await api.get('/api/auth/profile/');
  return response.data;
};

export const updateProfile = async (fullName, email) => {
  const response = await api.put('/api/auth/profile/', {
    full_name: fullName,
    email
  });
  return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const response = await api.post('/api/auth/change-password/', {
    old_password: oldPassword,
    new_password: newPassword
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgot-password/', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/api/auth/reset-password/', { token, password });
  return response.data;
};

// SMTP Settings APIs
export const fetchSMTP = async () => {
  const response = await api.get('/api/smtp/');
  return response.data;
};

export const saveSMTP = async (gmailAddress, appPassword) => {
  const payload = { gmail_address: gmailAddress };
  if (appPassword) {
    payload.app_password = appPassword;
  }
  const response = await api.post('/api/smtp/', payload);
  return response.data;
};

export const deleteSMTP = async () => {
  const response = await api.delete('/api/smtp/');
  return response.data;
};

export const testSMTP = async () => {
  const response = await api.post('/api/smtp/test/');
  return response.data;
};

// Campaigns & Sending
export const sendEmails = async (campaignPayload) => {
  // campaignPayload should contain: name, campaign_type, subject, body, recipients
  const response = await api.post('/api/campaigns/', campaignPayload);
  return response.data;
};

export const fetchCampaigns = async () => {
  const response = await api.get('/api/campaigns/');
  return response.data;
};

export const fetchCampaignStatus = async (id) => {
  const response = await api.get(`/api/campaigns/${id}/status/`);
  return response.data;
};

export const deleteCampaign = async (id) => {
  const response = await api.delete(`/api/campaigns/${id}/`);
  return response.data;
};

// Dashboard Analytics
export const fetchDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats/');
  return response.data;
};

export const fetchDashboardCharts = async () => {
  const response = await api.get('/api/dashboard/charts/');
  return response.data;
};

// Email History Logs
export const fetchEmailLogs = async (params = {}) => {
  const response = await api.get('/api/email-logs/', { params });
  return response.data;
};

// Activity Logs
export const fetchActivityLogs = async () => {
  const response = await api.get('/api/activity-logs/');
  return response.data;
};

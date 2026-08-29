import axios from 'axios';

export const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return import.meta.env.VITE_LOCAL_API_URL || 'http://127.0.0.1:8000';
    }
  }
  return import.meta.env.VITE_API_URL || 'https://mail.awaisamjad.engineer';
};



export const DEFAULT_BACKEND_URL = getBackendUrl();

export const setBackendUrl = (url) => {
  // no-op
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

export const resetPassword = async (email, otp, password) => {
  const response = await api.post('/api/auth/reset-password/', {
    email,
    otp,
    new_password: password
  });
  return response.data;
};

export const verifyEmailUser = async (email, otp) => {
  const response = await api.post('/api/auth/verify-email/', { email, otp });
  return response.data;
};

export const resendOTPUser = async (email, reason) => {
  const response = await api.post('/api/auth/resend-otp/', { email, reason });
  return response.data;
};

// SMTP Settings APIs
export const fetchSMTP = async () => {
  const response = await api.get('/api/smtp/');
  return response.data;
};

export const saveSMTP = async (smtpDataOrAddress, appPassword) => {
  let payload = {};
  if (typeof smtpDataOrAddress === 'object' && smtpDataOrAddress !== null) {
    payload = { ...smtpDataOrAddress };
  } else {
    payload = { gmail_address: smtpDataOrAddress };
    if (appPassword) {
      payload.app_password = appPassword;
    }
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
export const sendDirectEmail = async (payload) => {
  if (payload instanceof FormData) {
    const response = await api.post('/api/send-direct/', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  const response = await api.post('/api/send-direct/', payload);
  return response.data;
};

export const sendEmails = async (campaignPayload) => {

  if (campaignPayload instanceof FormData) {
    const response = await api.post('/api/campaigns/', campaignPayload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
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

// Inbound Email Replies & IMAP Sync
export const fetchInboundEmails = async (params = {}) => {
  const response = await api.get('/api/inbound-emails/', { params });
  return response.data;
};

export const triggerInboxSync = async () => {
  const response = await api.post('/api/inbox/sync-now/');
  return response.data;
};

export const purgeSocialEmails = async () => {
  const response = await api.post('/api/inbox/purge-social/');
  return response.data;
};

export const updateInboundEmail = async (id, data) => {
  const response = await api.patch(`/api/inbound-emails/${id}/`, data);
  return response.data;
};

export const fetchSuppressions = async () => {
  const response = await api.get('/api/suppressions/');
  return response.data;
};


export const addSuppression = async (email, reason = 'Manually suppressed') => {
  const response = await api.post('/api/suppressions/', { email, reason });
  return response.data;
};

export const fetchSMTPSettings = async () => {
  const response = await api.get('/api/smtp/');
  return response.data;
};

// Admin Console & Telemetry APIs
export const fetchAdminUsers = async () => {
  const response = await api.get('/api/admin/users/');
  return response.data;
};

export const createAdminUser = async (userData) => {
  const response = await api.post('/api/admin/users/', userData);
  return response.data;
};

export const updateAdminUser = async (id, userData) => {
  const response = await api.patch(`/api/admin/users/${id}/`, userData);
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/api/admin/users/${id}/`);
  return response.data;
};

export const fetchAdminTelemetry = async () => {
  const response = await api.get('/api/admin/telemetry/');
  return response.data;
};


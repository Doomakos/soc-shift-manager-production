import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Add JWT token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401 errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${API_BASE_URL}/auth/refresh`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${refreshToken}`,
                            },
                        }
                    );

                    const { access_token } = response.data;
                    localStorage.setItem('accessToken', access_token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear auth and redirect to login
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

// Analysts API
export const analystAPI = {
    getAll: () => api.get('/analysts'),
    getL2: () => api.get('/analysts/l2'),
    getById: (id) => api.get(`/analysts/${id}`),
    create: (data) => api.post('/analysts', data),
    update: (id, data) => api.put(`/analysts/${id}`, data),
    delete: (id) => api.delete(`/analysts/${id}`),
};

// Shifts API
export const shiftAPI = {
    getAll: (params) => api.get('/shifts', { params }),
    getById: (id) => api.get(`/shifts/${id}`),
    create: (data) => api.post('/shifts', data),
    update: (id, data) => api.put(`/shifts/${id}`, data),
    delete: (id) => api.delete(`/shifts/${id}`),
    getTemplates: () => api.get('/shift-templates'),
};// Pay Rules API
export const payRuleAPI = {
    getAll: () => api.get('/pay-rules'),
    create: (data) => api.post('/pay-rules', data),
    update: (id, data) => api.put(`/pay-rules/${id}`, data),
    validate: () => api.get('/pay-rules/validate'),
    evaluate: (data) => api.post('/pay-rules/evaluate', data),
    audit: () => api.get('/pay-rules/audit'),
    recreateGreekDefaults: () => api.post('/pay-rules/recreate-greek-defaults'),
};

// Analytics API
export const analyticsAPI = {
    getAnalystSummary: (analystId, params) =>
        api.get(`/analytics/analyst-summary/${analystId}`, { params }),
    getTeamSummary: (params) =>
        api.get('/analytics/team-summary', { params }),
    getPayrollDetails: (analystId, params) =>
        api.get(`/analytics/payroll-details/${analystId}`, { params }),
    getTeamPayrollSummary: (params) =>
        api.get('/analytics/team-payroll-summary', { params }),
};

// Standby API
export const standbyAPI = {
    getAll: (params) => api.get('/standby', { params }),
    create: (data) => api.post('/standby', data),
    update: (id, data) => api.put(`/standby/${id}`, data),
    delete: (id) => api.delete(`/standby/${id}`),
};

// System API
export const systemAPI = {
    init: () => api.post('/init'),
    health: () => api.get('/health'),
};

export default api;

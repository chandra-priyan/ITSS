import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://itss-backend-k0hz.onrender.com';

const apiClient = axios.create({
  baseURL,
  timeout: 30000, // 30 second timeout for AI operations
});

// Add a response interceptor to gracefully handle timeouts and network errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      return Promise.reject({
        response: {
          data: {
            success: false,
            message: 'Request timed out. Please try again.'
          }
        }
      });
    }
    if (error.message === 'Network Error') {
      return Promise.reject({
        response: {
          data: {
            success: false,
            message: 'Unable to connect to the Banking AI service.'
          }
        }
      });
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Customers
  getCustomers: () => apiClient.get('/api/customers'),
  getCustomerById: (id) => apiClient.get(`/api/customers/${id}`),
  getCustomer360: (id) => apiClient.get(`/api/customer360/${id}`),
  
  // AI Modules
  runG1: (customerId) => apiClient.post(`/api/ai/g1/${customerId}`),
  runG2: (customerId, payload) => apiClient.post(`/api/ai/g2/${customerId}`, payload),
  runG3: (formData) => apiClient.post(`/api/ai/g3`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // Document processing can be slow
  }),
  runG4: (customerId) => apiClient.post(`/api/ai/g4/${customerId}`),
  
  // History
  getHistory: (params) => apiClient.get('/api/history', { params }),
  getHistoryDetail: (id) => apiClient.get(`/api/history/${id}`),

  // Chatbot
  sendChatMessage: (query, history = []) => apiClient.post('/api/chat', { query, history })
};

export default apiClient;

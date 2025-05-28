// frontend/lib/api.ts - Updated API client with proper axios implementation
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE = 'https://hgn8hf4t-6000.uks1.devtunnels.ms/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
      }
    }
    
    // Enhanced error message
    const message = (error.response?.data as any)?.error || error.message || 'Network error occurred';
    return Promise.reject(new Error(message));
  }
);

// API service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    },
    register: async (email: string, password: string, role: string) => {
      const response = await apiClient.post('/auth/register', { email, password, role });
      return response.data;
    },
  },

  // Table endpoints
  tables: {
    getTableInfo: async (restaurantId: string, tableId: string) => {
      const response = await apiClient.get(`/tables/${restaurantId}/${tableId}`);
      return response.data;
    },
    getTableMenu: async (restaurantId: string, tableId: string) => {
      const response = await apiClient.get(`/tables/${restaurantId}/${tableId}/menu`);
      return response.data;
    },
    getTableStatus: async (restaurantId: string, tableId: string) => {
      const response = await apiClient.get(`/tables/${restaurantId}/${tableId}/status`);
      return response.data;
    },
  },

  // Order endpoints
  orders: {
    createOrder: async (restaurantId: string, orderData: any) => {
      const response = await apiClient.post(`/orders/${restaurantId}`, orderData);
      return response.data;
    },
    createPaymentIntent: async (orderId: string) => {
      const response = await apiClient.post(`/orders/${orderId}/payment-intent`);
      return response.data;
    },
    confirmPayment: async (orderId: string) => {
      const response = await apiClient.post(`/orders/${orderId}/confirm-payment`);
      return response.data;
    },
    getOrder: async (orderId: string) => {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    },
    getOrders: async (filters?: { status?: string; tableId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tableId) params.append('tableId', filters.tableId);
      
      const response = await apiClient.get(`/orders?${params.toString()}`);
      return response.data;
    },
    updateOrderStatus: async (orderId: string, status: string) => {
      const response = await apiClient.put(`/orders/${orderId}/status`, { status });
      return response.data;
    },
  },

  // Menu endpoints
  menu: {
    getMenu: async (restaurantId: string) => {
      const response = await apiClient.get(`/menu/${restaurantId}`);
      return response.data;
    },
    createMenuItem: async (menuItem: any) => {
      const response = await apiClient.post('/menu', menuItem);
      return response.data;
    },
    updateMenuItem: async (id: string, updates: any) => {
      const response = await apiClient.put(`/menu/${id}`, updates);
      return response.data;
    },
    deleteMenuItem: async (id: string) => {
      const response = await apiClient.delete(`/menu/${id}`);
      return response.data;
    },
  },

  // Restaurant endpoints
  restaurants: {
    getMyRestaurant: async () => {
      const response = await apiClient.get('/restaurants/my');
      return response.data;
    },
    createRestaurant: async (restaurantData: any) => {
      const response = await apiClient.post('/restaurants', restaurantData);
      return response.data;
    },
    updateRestaurant: async (updates: any) => {
      const response = await apiClient.put('/restaurants/my', updates);
      return response.data;
    },
    addTable: async (tableData: any) => {
      const response = await apiClient.post('/restaurants/tables', tableData);
      return response.data;
    },
    updateTable: async (tableId: string, updates: any) => {
      const response = await apiClient.put(`/restaurants/tables/${tableId}`, updates);
      return response.data;
    },
    getTableQR: async (tableId: string, restaurantId: string) => {
      const response = await apiClient.get(`/restaurants/tables/qr/${tableId}?restaurantId=${restaurantId}`);
      return response.data;
    },
  },

  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;
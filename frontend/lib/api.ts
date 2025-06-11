// frontend/lib/api.ts - Updated API client with proper axios implementation
import axios, { AxiosInstance, AxiosError } from "axios";

const API_BASE = 'http://84.247.174.84:9003/api';
// const API_BASE = 'https://ecoville.online/restraunt/api';
// const API_BASE = "http://localhost:9003/api";
// const API_BASE = 'https://hgn8hf4t-6000.uks1.devtunnels.ms/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
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
    console.error("API Error:", error);

    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
        window.location.href = "/admin";
      }
    }

    // Enhanced error message
    const message =
      (error.response?.data as any)?.error ||
      error.message ||
      "Network error occurred";
    return Promise.reject(new Error(message));
  }
);

// API service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiClient.post("/auth/login", { email, password });
      return response.data;
    },
    register: async (email: string, password: string, role: string) => {
      const response = await apiClient.post("/auth/register", {
        email,
        password,
        role,
      });
      return response.data;
    },
    logout: async () => {
      const response = await apiClient.post("/auth/logout");
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
      }
      return response.data;
    },
    verifyToken: async () => {
      const response = await apiClient.get("/auth/verify");
      return response.data;
    },
  },

  // Table endpoints
  tables: {
    getTableInfo: async (restaurantId: string, tableId: string) => {
      const response = await apiClient.get(
        `/tables/${restaurantId}/${tableId}`
      );
      return response.data;
    },
    getTableMenu: async (restaurantId: string, tableId: string) => {
      const response = await apiClient.get(
        `/tables/${restaurantId}/${tableId}/menu`
      );
      return response.data;
    },
    getTableStatus: async (restaurantId: string, tableId: string) => {
      const response = await apiClient.get(
        `/tables/${restaurantId}/${tableId}/status`
      );
      return response.data;
    },
    updateTableStatus: async (
      restaurantId: string,
      tableId: string,
      status: string
    ) => {
      const response = await apiClient.put(
        `/tables/${restaurantId}/${tableId}/status`,
        { status }
      );
      return response.data;
    },
    getAllTables: async (restaurantId: string) => {
      const response = await apiClient.get(`/tables/${restaurantId}`);
      return response.data;
    },
  },

  // Order endpoints
  orders: {
    // Optimized order creation with retry logic
    async createOrder(restaurantId: string, orderData: any) {
      try {
        // Transform and validate items
        const transformedItems = orderData.items?.map((item: any) => {
          // Ensure required fields
          if (!item.id && !item.menuItemId) {
            throw new Error(`Item missing ID: ${item.name || 'Unknown item'}`);
          }
          
          if (!item.quantity || item.quantity <= 0) {
            throw new Error(`Invalid quantity for item: ${item.name || 'Unknown item'}`);
          }

          return {
            id: item.id || item.menuItemId,
            quantity: item.quantity,
            selectedCustomizations: item.selectedCustomizations || [],
            allergenPreferences: {
              avoidAllergens: item.allergenPreferences?.avoidAllergens?.filter((a: string) => a?.trim()) || [],
              specialInstructions: item.allergenPreferences?.specialInstructions?.trim() || "",
              dietaryPreferences: item.allergenPreferences?.dietaryPreferences?.filter((p: string) => p?.trim()) || [],
            },
            // Legacy support
            customizations: item.customizations || [],
            specialInstructions: item.specialInstructions || item.allergenPreferences?.specialInstructions?.trim() || ""
          };
        }) || [];

        if (transformedItems.length === 0) {
          throw new Error('No valid items to order');
        }

        // Validate customer information
        if (!orderData.customerName?.trim()) {
          throw new Error('Customer name is required');
        }
        
        if (!orderData.customerPhone?.trim()) {
          throw new Error('Customer phone is required');
        }

        const payload = {
          ...orderData,
          items: transformedItems,
          customerName: orderData.customerName.trim(),
          customerPhone: orderData.customerPhone.trim(),
          customerEmail: orderData.customerEmail?.trim() || '',
          specialInstructions: orderData.specialInstructions?.trim() || ''
        };

        const response = await apiClient.post(`/orders/${restaurantId}`, payload);

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Order creation failed');
        }

        return response.data;
      } catch (error) {
        console.error('Create order error:', error);
        throw error;
      }
    },

    // Optimized order retrieval with caching
    async getOrderById(orderId: string) {
      try {
        if (!orderId?.trim()) {
          throw new Error('Order ID is required');
        }

        const response = await apiClient.get(`/orders/${orderId}`);
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch order');
        }

        return response.data;
      } catch (error) {
        console.error('Get order error:', error);
        throw error;
      }
    },

    // Enhanced orders list with better filtering
    async getOrders(filters?: {
      status?: string | string[];
      tableId?: string;
      restaurantId?: string;
      hasAllergenConcerns?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) {
      try {
        const params = new URLSearchParams();
        
        if (filters?.status) {
          if (Array.isArray(filters.status)) {
            filters.status.forEach((s) => params.append("status", s));
          } else {
            params.append("status", filters.status);
          }
        }
        
        if (filters?.tableId) params.append("tableId", filters.tableId);
        if (filters?.hasAllergenConcerns) params.append("hasAllergenConcerns", "true");
        if (filters?.page) params.append("page", filters.page.toString());
        if (filters?.limit) params.append("limit", filters.limit.toString());
        if (filters?.sortBy) params.append("sortBy", filters.sortBy);
        if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

        // Use the authenticated admin endpoint - no restaurantId in URL path
        const response = await apiClient.get(`/orders?${params.toString()}`);
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch orders');
        }

        return response.data;
      } catch (error) {
        console.error('Get orders error:', error);
        throw error;
      }
    },

    // Optimized status update with validation
    async updateOrderStatus(orderId: string, status: string, kitchenNotes?: string) {
      try {
        if (!orderId?.trim()) {
          throw new Error('Order ID is required');
        }
        
        if (!status?.trim()) {
          throw new Error('Status is required');
        }

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          throw new Error('Invalid status');
        }

        const payload: any = { status };
        if (kitchenNotes !== undefined) {
          payload.kitchenNotes = kitchenNotes;
        }

        const response = await apiClient.put(`/orders/${orderId}/status`, payload);
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to update order status');
        }

        return response.data;
      } catch (error) {
        console.error('Update order status error:', error);
        throw error;
      }
    },

    // New bulk operations
    async bulkUpdateOrders(orderIds: string[], updates: any) {
      try {
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
          throw new Error('Order IDs array is required');
        }

        const response = await apiClient.put('/orders/bulk-update', {
          orderIds,
          updates
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Bulk update failed');
        }

        return response.data;
      } catch (error) {
        console.error('Bulk update orders error:', error);
        throw error;
      }
    },

    // Enhanced special service requests
    async requestSpecialService(orderId: string, serviceType: string, message?: string) {
      try {
        if (!orderId?.trim()) {
          throw new Error('Order ID is required');
        }
        
        if (!serviceType?.trim()) {
          throw new Error('Service type is required');
        }

        const validServiceTypes = ['packing', 'split_payment', 'server_call', 'special_instructions'];
        if (!validServiceTypes.includes(serviceType)) {
          throw new Error('Invalid service type');
        }

        const response = await apiClient.post(`/orders/${orderId}/special-service`, {
          serviceType,
          message: message?.trim() || ''
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Special service request failed');
        }

        return response.data;
      } catch (error) {
        console.error('Special service request error:', error);
        throw error;
      }
    },

    // Order statistics
    async getOrderStats() {
      try {
        const response = await apiClient.get('/orders/stats');
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch order statistics');
        }

        return response.data;
      } catch (error) {
        console.error('Get order stats error:', error);
        throw error;
      }
    },

    // Allergen-specific orders
    async getAllergenOrders(page: number = 1, limit: number = 50) {
      try {
        const response = await apiClient.get(`/orders/allergen?page=${page}&limit=${limit}`);
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch allergen orders');
        }

        return response.data;
      } catch (error) {
        console.error('Get allergen orders error:', error);
        throw error;
      }
    },

    // Legacy methods for backward compatibility
    getOrder: async (orderId: string) => {
      return apiService.orders.getOrderById(orderId);
    },

    createPaymentIntent: async (orderId: string) => {
      const response = await apiClient.post(`/orders/${orderId}/payment-intent`);
      return response.data;
    },

    confirmPayment: async (orderId: string) => {
      const response = await apiClient.post(`/orders/${orderId}/confirm-payment`);
      return response.data;
    },

    getRecentOrders: async (limit: number = 10) => {
      const response = await apiClient.get(`/orders/recent?limit=${limit}`);
      return response.data;
    },

    updatePhase: async (orderId: string, phase: string) => {
      const response = await apiClient.put(`/orders/${orderId}/phase`, { phase });
      return response.data;
    },

    cancelOrder: async (orderId: string, reason?: string) => {
      const response = await apiClient.put(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    }
  },

  // Menu endpoints
  menu: {
    getMenu: async (restaurantId: string) => {
      const response = await apiClient.get(`/menu/${restaurantId}`);
      return response.data;
    },

    createMenuItem: async (menuItem: {
      name: string;
      description: string;
      price: number;
      category: string;
      allergens?: string[];
      allergenNotes?: string;
      dietaryInfo?: string[];
      available?: boolean;
      customizations?: Array<{
        id: string;
        name: string;
        type: "radio" | "checkbox" | "select";
        options: Array<{
          name: string;
          price: number;
        }>;
        required: boolean;
        maxSelections?: number;
      }>;
      restaurantId: string;
    }) => {
      const response = await apiClient.post("/menu", menuItem);
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

    getMenuCategories: async (restaurantId: string) => {
      const response = await apiClient.get(`/menu/${restaurantId}/categories`);
      return response.data;
    },

    uploadMenuImage: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await apiClient.post("/menu/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },

    toggleAvailability: async (id: string, available: boolean) => {
      const response = await apiClient.put(`/menu/${id}/availability`, {
        available,
      });
      return response.data;
    },

    bulkUpdatePrices: async (updates: Array<{ id: string; price: number }>) => {
      const response = await apiClient.put("/menu/bulk-price-update", {
        updates,
      });
      return response.data;
    },

    getMenuStats: async (restaurantId: string) => {
      const response = await apiClient.get(`/menu/${restaurantId}/stats`);
      return response.data;
    },

    // Bulk upload menu items
    bulkUploadMenu: async (menuItems: Array<{
      name: string;
      description: string;
      price: number;
      category: string;
      allergens?: string[];
      allergenNotes?: string;
      dietaryInfo?: string[];
      available?: boolean;
      customizations?: Array<{
        id: string;
        name: string;
        type: "radio" | "checkbox" | "select";
        options: Array<{
          name: string;
          price: number;
        }>;
        required: boolean;
        maxSelections?: number;
      }>;
      isVegetarian?: boolean;
      isSpicy?: boolean;
      preparationTime?: number;
      calories?: number;
    }>, options?: {
      restaurantId?: string;
      overwrite?: boolean; // Whether to overwrite existing items with same name
      skipDuplicates?: boolean; // Whether to skip items that already exist
      validateOnly?: boolean; // Only validate without saving
    }) => {
      try {
        if (!Array.isArray(menuItems) || menuItems.length === 0) {
          throw new Error('Menu items array is required and cannot be empty');
        }

        // Validate each item before sending
        const validatedItems = menuItems.map((item, index) => {
          if (!item.name?.trim()) {
            throw new Error(`Item ${index + 1}: Name is required`);
          }
          if (!item.description?.trim()) {
            throw new Error(`Item ${index + 1}: Description is required`);
          }
          if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error(`Item ${index + 1}: Valid price is required`);
          }
          if (!item.category?.trim()) {
            throw new Error(`Item ${index + 1}: Category is required`);
          }

          return {
            name: item.name.trim(),
            description: item.description.trim(),
            price: parseFloat(item.price.toString()),
            category: item.category.trim().toLowerCase(),
            allergens: Array.isArray(item.allergens) ? item.allergens.filter(a => a?.trim()) : [],
            allergenNotes: item.allergenNotes?.trim() || '',
            dietaryInfo: Array.isArray(item.dietaryInfo) ? item.dietaryInfo.filter(d => d?.trim()) : [],
            available: item.available !== false,
            customizations: item.customizations || [],
            isVegetarian: Boolean(item.isVegetarian),
            isSpicy: Boolean(item.isSpicy),
            preparationTime: item.preparationTime || undefined,
            calories: item.calories || undefined
          };
        });

        const payload = {
          items: validatedItems,
          options: {
            restaurantId: options?.restaurantId,
            overwrite: options?.overwrite || false,
            skipDuplicates: options?.skipDuplicates || true,
            validateOnly: options?.validateOnly || false
          }
        };

        const response = await apiClient.post('/menu/bulk-upload', payload);

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Bulk upload failed');
        }

        return response.data;
      } catch (error) {
        console.error('Bulk upload menu error:', error);
        throw error;
      }
    },

    // Upload menu from CSV/Excel file
    uploadMenuFromFile: async (file: File, options?: {
      restaurantId?: string;
      overwrite?: boolean;
      skipDuplicates?: boolean;
      validateOnly?: boolean;
      mapping?: {
        name?: string;
        description?: string;
        price?: string;
        category?: string;
        allergens?: string;
        available?: string;
      };
    }) => {
      try {
        if (!file) {
          throw new Error('File is required');
        }

        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/json'
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error('File must be CSV, Excel, or JSON format');
        }

        const formData = new FormData();
        formData.append('file', file);
        
        if (options?.restaurantId) {
          formData.append('restaurantId', options.restaurantId);
        }
        if (options?.overwrite !== undefined) {
          formData.append('overwrite', String(options.overwrite));
        }
        if (options?.skipDuplicates !== undefined) {
          formData.append('skipDuplicates', String(options.skipDuplicates));
        }
        if (options?.validateOnly !== undefined) {
          formData.append('validateOnly', String(options.validateOnly));
        }
        if (options?.mapping) {
          formData.append('mapping', JSON.stringify(options.mapping));
        }

        const response = await apiClient.post('/menu/upload-from-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds for file processing
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'File upload failed');
        }

        return response.data;
      } catch (error) {
        console.error('Upload menu from file error:', error);
        throw error;
      }
    },

    // Get bulk upload template
    getBulkUploadTemplate: async (format: 'csv' | 'excel' | 'json' = 'csv') => {
      try {
        const response = await apiClient.get(`/menu/bulk-upload-template?format=${format}`, {
          responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `menu-template.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true, message: 'Template downloaded successfully' };
      } catch (error) {
        console.error('Download template error:', error);
        throw error;
      }
    },

    // Validate bulk menu data before upload
    validateBulkMenu: async (menuItems: any[]) => {
      try {
        const response = await apiClient.post('/menu/validate-bulk', {
          items: menuItems
        });

        return response.data;
      } catch (error) {
        console.error('Validate bulk menu error:', error);
        throw error;
      }
    },

    // Get bulk upload history
    getBulkUploadHistory: async (page: number = 1, limit: number = 10) => {
      try {
        const response = await apiClient.get(`/menu/bulk-upload-history?page=${page}&limit=${limit}`);
        return response.data;
      } catch (error) {
        console.error('Get bulk upload history error:', error);
        throw error;
      }
    },

    // Export current menu to file
    exportMenu: async (format: 'csv' | 'excel' | 'json' = 'csv', restaurantId?: string) => {
      try {
        if (!restaurantId) {
          throw new Error('Restaurant ID is required for export');
        }

        const params = new URLSearchParams();
        params.append('format', format);
        params.append('restaurantId', restaurantId);

        const response = await apiClient.get(`/menu/export?${params.toString()}`, {
          responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Get filename from response headers or create default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `menu-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true, message: 'Menu exported successfully' };
      } catch (error) {
        console.error('Export menu error:', error);
        throw error;
      }
    },

    // Bulk update menu items
    bulkUpdateMenu: async (updates: Array<{
      id: string;
      updates: Partial<{
        name: string;
        description: string;
        price: number;
        category: string;
        available: boolean;
        allergens: string[];
        dietaryInfo: string[];
      }>;
    }>) => {
      try {
        if (!Array.isArray(updates) || updates.length === 0) {
          throw new Error('Updates array is required');
        }

        const response = await apiClient.put('/menu/bulk-update', {
          updates
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Bulk update failed');
        }

        return response.data;
      } catch (error) {
        console.error('Bulk update menu error:', error);
        throw error;
      }
    },

    // Bulk delete menu items
    bulkDeleteMenu: async (itemIds: string[]) => {
      try {
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
          throw new Error('Item IDs array is required');
        }

        const response = await apiClient.delete('/menu/bulk-delete', {
          data: { itemIds }
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Bulk delete failed');
        }

        return response.data;
      } catch (error) {
        console.error('Bulk delete menu error:', error);
        throw error;
      }
    },

    // ... rest of existing menu methods
  },

  // Restaurant endpoints
  restaurants: {
    getMyRestaurant: async () => {
      const response = await apiClient.get("/restaurants/my");
      return response.data;
    },
    createRestaurant: async (restaurantData: any) => {
      const response = await apiClient.post("/restaurants", restaurantData);
      return response.data;
    },
    updateRestaurant: async (updates: any) => {
      const response = await apiClient.put("/restaurants/my", updates);
      return response.data;
    },
    updateRestaurantSettings: async (data: any) => {
      const response = await apiClient.put("/restaurants/my/settings", data);
      return response.data;
    },
    resetRestaurant: async (
      resetType: "tables" | "menu" | "orders" | "all"
    ) => {
      const response = await apiClient.post("/restaurants/my/reset", {
        resetType,
      });
      return response.data;
    },
    addTable: async (tableData: {
      tableNumber: string;
      capacity: number;
      status?: string;
    }) => {
      const response = await apiClient.post("/restaurants/tables", tableData);
      return response.data;
    },

    updateTable: async (tableId: string, updates: any) => {
      const response = await apiClient.put(
        `/restaurants/tables/${tableId}`,
        updates
      );
      return response.data;
    },

    deleteTable: async (tableId: string) => {
      const response = await apiClient.delete(`/restaurants/tables/${tableId}`);
      return response.data;
    },

    getTableQR: async (tableId: string, restaurantId?: string) => {
      const params = restaurantId ? `?restaurantId=${restaurantId}` : "";
      const response = await apiClient.get(
        `/restaurants/tables/qr/${tableId}${params}`
      );
      return response.data;
    },
    generateAllQRCodes: async () => {
      const response = await apiClient.post("/restaurants/generate-qr-codes");
      return response.data;
    },
    getRestaurantStats: async () => {
      const response = await apiClient.get("/restaurants/my/stats");
      return response.data;
    },
  },

  // Dashboard endpoints
  dashboard: {
    getStats: async () => {
      const response = await apiClient.get("/dashboard/stats");
      return response.data;
    },
    getReports: async (filters: { startDate: string; endDate: string }) => {
      const response = await apiClient.get("/dashboard/reports", {
        params: filters,
      });
      return response.data;
    },
    getDailyRevenue: async (days: number = 7) => {
      const response = await apiClient.get(`/dashboard/revenue?days=${days}`);
      return response.data;
    },
    getOrderAnalytics: async (period: string = "week") => {
      const response = await apiClient.get(
        `/dashboard/analytics?period=${period}`
      );
      return response.data;
    },
    getPopularItems: async (limit: number = 10) => {
      const response = await apiClient.get(
        `/dashboard/popular-items?limit=${limit}`
      );
      return response.data;
    },
    getCustomerSatisfaction: async () => {
      const response = await apiClient.get("/dashboard/satisfaction");
      return response.data;
    },
    exportReport: async (type: string, format: string = "csv") => {
      const response = await apiClient.get(
        `/dashboard/export/${type}?format=${format}`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    },
  },

  // Services endpoints (for special requests)
  services: {
    callServer: async (
      restaurantId: string,
      tableId: string,
      message?: string
    ) => {
      const response = await apiClient.post("/services/call-server", {
        restaurantId,
        tableId,
        message,
      });
      return response.data;
    },
    submitSpecialInstructions: async (
      restaurantId: string,
      tableId: string,
      data: any
    ) => {
      const response = await apiClient.post("/services/special-instructions", {
        restaurantId,
        tableId,
        ...data,
      });
      return response.data;
    },
    requestService: async (
      restaurantId: string,
      tableId: string,
      serviceData: any
    ) => {
      const response = await apiClient.post("/services/request", {
        restaurantId,
        tableId,
        ...serviceData,
      });
      return response.data;
    },
    getServiceRequests: async (restaurantId: string, status?: string) => {
      const params = status ? `?status=${status}` : "";
      const response = await apiClient.get(
        `/services/requests/${restaurantId}${params}`
      );
      return response.data;
    },
    updateServiceRequest: async (requestId: string, updates: any) => {
      const response = await apiClient.put(
        `/services/requests/${requestId}`,
        updates
      );
      return response.data;
    },
    getServiceStats: async (restaurantId: string) => {
      const response = await apiClient.get(`/services/stats/${restaurantId}`);
      return response.data;
    },
  },

  // Reviews and Feedback endpoints
  reviews: {
    getReviews: async (
      restaurantId: string,
      params?: {
        page?: number;
        limit?: number;
        rating?: number;
        sortBy?: string;
        order?: "asc" | "desc";
      }
    ) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.rating)
        queryParams.append("rating", params.rating.toString());
      if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params?.order) queryParams.append("order", params.order);

      const response = await apiClient.get(
        `/reviews/${restaurantId}?${queryParams}`
      );
      return response.data;
    },

    createReview: async (
      restaurantId: string,
      reviewData: {
        customerName: string;
        email?: string;
        rating: number;
        comment: string;
        tableNumber?: string;
        orderId?: string;
      }
    ) => {
      const response = await apiClient.post(
        `/reviews/${restaurantId}`,
        reviewData
      );
      return response.data;
    },

    markHelpful: async (restaurantId: string, reviewId: string) => {
      const response = await apiClient.put(
        `/reviews/${restaurantId}/${reviewId}/helpful`
      );
      return response.data;
    },
  },

  // Feedback endpoints
  feedback: {
    submitFeedback: async (restaurantId: string, feedbackData: any) => {
      const response = await apiClient.post(
        `/feedback/${restaurantId}`,
        feedbackData
      );
      return response.data;
    },
    getFeedback: async (restaurantId: string, filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (filters[key]) params.append(key, filters[key]);
        });
      }
      const response = await apiClient.get(
        `/feedback/${restaurantId}?${params.toString()}`
      );
      return response.data;
    },
    updateFeedbackStatus: async (feedbackId: string, status: string) => {
      const response = await apiClient.put(`/feedback/${feedbackId}/status`, {
        status,
      });
      return response.data;
    },
  },

  // Waiting list endpoints
  waitingList: {
    addToWaitingList: async (restaurantId: string, customerData: any) => {
      const response = await apiClient.post(
        `/waiting-list/${restaurantId}`,
        customerData
      );
      return response.data;
    },
    getWaitingList: async (restaurantId: string) => {
      const response = await apiClient.get(`/waiting-list/${restaurantId}`);
      return response.data;
    },
    updateWaitingStatus: async (waitingId: string, status: string) => {
      const response = await apiClient.put(
        `/waiting-list/${waitingId}/status`,
        { status }
      );
      return response.data;
    },
    notifyCustomer: async (waitingId: string, message: string) => {
      const response = await apiClient.post(
        `/waiting-list/${waitingId}/notify`,
        { message }
      );
      return response.data;
    },
    getWaitingPosition: async (waitingId: string) => {
      const response = await apiClient.get(
        `/waiting-list/position/${waitingId}`
      );
      return response.data;
    },
  },

  // Reservations endpoints
  reservations: {
    createReservation: async (restaurantId: string, reservationData: any) => {
      const response = await apiClient.post(
        `/reservations/${restaurantId}`,
        reservationData
      );
      return response.data;
    },
    getReservations: async (restaurantId: string, date?: string) => {
      const params = date ? `?date=${date}` : "";
      const response = await apiClient.get(
        `/reservations/${restaurantId}${params}`
      );
      return response.data;
    },
    updateReservation: async (reservationId: string, updates: any) => {
      const response = await apiClient.put(
        `/reservations/${reservationId}`,
        updates
      );
      return response.data;
    },
    cancelReservation: async (reservationId: string, reason?: string) => {
      const response = await apiClient.put(
        `/reservations/${reservationId}/cancel`,
        { reason }
      );
      return response.data;
    },
    getAvailableSlots: async (
      restaurantId: string,
      date: string,
      partySize: number
    ) => {
      const response = await apiClient.get(
        `/reservations/${restaurantId}/available-slots?date=${date}&partySize=${partySize}`
      );
      return response.data;
    },
  },

  // Analytics endpoints
  analytics: {
    getOrderAnalytics: async (
      restaurantId: string,
      period: string = "week"
    ) => {
      const response = await apiClient.get(
        `/analytics/${restaurantId}/orders?period=${period}`
      );
      return response.data;
    },
    getRevenueAnalytics: async (
      restaurantId: string,
      period: string = "week"
    ) => {
      const response = await apiClient.get(
        `/analytics/${restaurantId}/revenue?period=${period}`
      );
      return response.data;
    },
    getMenuAnalytics: async (restaurantId: string, period: string = "week") => {
      const response = await apiClient.get(
        `/analytics/${restaurantId}/menu?period=${period}`
      );
      return response.data;
    },
    getCustomerAnalytics: async (
      restaurantId: string,
      period: string = "week"
    ) => {
      const response = await apiClient.get(
        `/analytics/${restaurantId}/customers?period=${period}`
      );
      return response.data;
    },
    getTableUtilization: async (restaurantId: string, date?: string) => {
      const params = date ? `?date=${date}` : "";
      const response = await apiClient.get(
        `/analytics/${restaurantId}/table-utilization${params}`
      );
      return response.data;
    },
  },

  // Reports endpoints
  reports: {
    generateReport: async (reportType: string, options: any) => {
      const response = await apiClient.post(
        `/reports/generate/${reportType}`,
        options,
        {
          responseType: "blob",
        }
      );
      return response.data;
    },
    getSpecialInstructionsReport: async () => {
      const response = await apiClient.get("/reports/special-instructions");
      return response.data;
    },
    getRevenueReport: async (startDate: string, endDate: string) => {
      const response = await apiClient.get(
        `/reports/revenue?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    },
    getTableUtilizationReport: async (date?: string) => {
      const params = date ? `?date=${date}` : "";
      const response = await apiClient.get(
        `/reports/table-utilization${params}`
      );
      return response.data;
    },
    // ... other existing reports methods
  },

  // Notifications endpoints
  notifications: {
    getNotifications: async (restaurantId: string, type?: string) => {
      const params = type ? `?type=${type}` : "";
      const response = await apiClient.get(
        `/notifications/${restaurantId}${params}`
      );
      return response.data;
    },
    markAsRead: async (notificationId: string) => {
      const response = await apiClient.put(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    createNotification: async (restaurantId: string, notificationData: any) => {
      const response = await apiClient.post(
        `/notifications/${restaurantId}`,
        notificationData
      );
      return response.data;
    },
    updateNotificationSettings: async (restaurantId: string, settings: any) => {
      const response = await apiClient.put(
        `/notifications/${restaurantId}/settings`,
        settings
      );
      return response.data;
    },
  },

  // Staff endpoints
  staff: {
    getStaffMembers: async (restaurantId: string) => {
      const response = await apiClient.get(`/staff/${restaurantId}`);
      return response.data;
    },
    addStaffMember: async (restaurantId: string, staffData: any) => {
      const response = await apiClient.post(
        `/staff/${restaurantId}`,
        staffData
      );
      return response.data;
    },
    updateStaffMember: async (staffId: string, updates: any) => {
      const response = await apiClient.put(`/staff/${staffId}`, updates);
      return response.data;
    },
    deleteStaffMember: async (staffId: string) => {
      const response = await apiClient.delete(`/staff/${staffId}`);
      return response.data;
    },
    getStaffPerformance: async (staffId: string, period: string = "week") => {
      const response = await apiClient.get(
        `/staff/${staffId}/performance?period=${period}`
      );
      return response.data;
    },
    assignTables: async (staffId: string, tableIds: string[]) => {
      const response = await apiClient.put(`/staff/${staffId}/assign-tables`, {
        tableIds,
      });
      return response.data;
    },
  },

  // Chat/AI endpoints
  chat: {
    sendMessage: async (
      restaurantId: string,
      tableId: string,
      message: string,
      sessionId?: string | null
    ) => {
      const response = await apiClient.post("/chat/send", {
        restaurantId,
        tableId,
        message,
        sessionId,
      });
      return response.data;
    },

    getChatHistory: async (sessionId: string) => {
      const response = await apiClient.get(`/chat/history/${sessionId}`);
      return response.data;
    },

    generateRecommendations: async (
      restaurantId: string,
      preferences: string,
      tableId?: string
    ) => {
      const response = await apiClient.post("/chat/recommendations", {
        restaurantId,
        preferences,
        tableId,
      });
      return response.data;
    },

    endChatSession: async (sessionId: string) => {
      const response = await apiClient.delete(`/chat/session/${sessionId}`);
      return response.data;
    },
  },

  // Health check
  health: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },

  // Settings endpoints
  settings: {
    getSettings: async (restaurantId: string) => {
      const response = await apiClient.get(`/settings/${restaurantId}`);
      return response.data;
    },
    updateSettings: async (restaurantId: string, settings: any) => {
      const response = await apiClient.put(
        `/settings/${restaurantId}`,
        settings
      );
      return response.data;
    },
    getOperatingHours: async (restaurantId: string) => {
      const response = await apiClient.get(`/settings/${restaurantId}/hours`);
      return response.data;
    },
    updateOperatingHours: async (restaurantId: string, hours: any) => {
      const response = await apiClient.put(
        `/settings/${restaurantId}/hours`,
        hours
      );
      return response.data;
    },
  },

  // Payment endpoints
  payments: {
    getPaymentMethods: async (restaurantId: string) => {
      const response = await apiClient.get(`/payments/${restaurantId}/methods`);
      return response.data;
    },
    processPayment: async (orderId: string, paymentData: any) => {
      const response = await apiClient.post(
        `/payments/${orderId}/process`,
        paymentData
      );
      return response.data;
    },
    refundPayment: async (
      orderId: string,
      amount?: number,
      reason?: string
    ) => {
      const response = await apiClient.post(`/payments/${orderId}/refund`, {
        amount,
        reason,
      });
      return response.data;
    },
    getPaymentHistory: async (restaurantId: string, filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (filters[key]) params.append(key, filters[key]);
        });
      }
      const response = await apiClient.get(
        `/payments/${restaurantId}/history?${params.toString()}`
      );
      return response.data;
    },
  },

  // SuperAdmin endpoints
  superadmin: {
    getStats: async () => {
      const response = await apiClient.get("/superadmin/stats");
      return response.data;
    },
    getRecentActivity: async (limit: number = 10) => {
      const response = await apiClient.get(
        `/superadmin/activity?limit=${limit}`
      );
      return response.data;
    },
    getRestaurants: async (filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (filters[key] && filters[key] !== "all")
            params.append(key, filters[key]);
        });
      }
      const response = await apiClient.get(
        `/superadmin/restaurants?${params.toString()}`
      );
      return response.data;
    },
    createRestaurant: async (restaurantData: any) => {
      const response = await apiClient.post(
        "/superadmin/restaurants",
        restaurantData
      );
      return response.data;
    },
    updateRestaurant: async (restaurantId: string, updates: any) => {
      const response = await apiClient.put(
        `/superadmin/restaurants/${restaurantId}`,
        updates
      );
      return response.data;
    },
    deleteRestaurant: async (restaurantId: string) => {
      const response = await apiClient.delete(
        `/superadmin/restaurants/${restaurantId}`
      );
      return response.data;
    },
    getUsers: async (filters?: any) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach((key) => {
          if (filters[key] && filters[key] !== "all")
            params.append(key, filters[key]);
        });
      }
      const response = await apiClient.get(
        `/superadmin/users?${params.toString()}`
      );
      return response.data;
    },
    createUser: async (userData: any) => {
      const response = await apiClient.post("/superadmin/users", userData);
      return response.data;
    },
    updateUser: async (userId: string, updates: any) => {
      const response = await apiClient.put(
        `/superadmin/users/${userId}`,
        updates
      );
      return response.data;
    },
    deleteUser: async (userId: string) => {
      const response = await apiClient.delete(`/superadmin/users/${userId}`);
      return response.data;
    },
  },

  // Remove the restaurantService class at the bottom since we now have proper methods
};

// Helper function for auth token
function getAuthToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("adminToken")
    : null;
}

export default apiClient;

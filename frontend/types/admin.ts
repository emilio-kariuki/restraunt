export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  allergens: string[] | string;
  allergenNotes?: string;
  dietaryInfo: string[];
  available: boolean;
  customizations?: Array<{
    id: string;
    name: string;
    type: 'radio' | 'checkbox' | 'select';
    options: Array<{
      name: string;
      price: number;
    }>;
    required: boolean;
    maxSelections?: number;
  }>;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  tableId: string;
  items: any[];
  total: number;
  status: string;
  customerName?: string;
  createdAt: string;
  specialInstructions?: string;
  paymentPreferences?: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  tables: Array<{
    tableNumber: string;
    capacity: number;
    status: string;
    qrCode?: string;
  }>;
}

export interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  allergens?: string;
  allergenNotes?: string;
  dietaryInfo?: string[];
  available?: boolean;
  customizations?: Array<{
    id: string;
    name: string;
    type: 'radio' | 'checkbox' | 'select';
    options: Array<{
      name: string;
      price: number;
    }>;
    required: boolean;
    maxSelections?: number;
  }>;
}

export interface TableForm {
  tableNumber: string;
  capacity: string; // Keep as string for form handling
}

export interface Table {
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminState {
  activeTab: 'dashboard' | 'orders' | 'menu' | 'tables' | 'reports';
  orders: Order[];
  menuItems: MenuItem[];
  restaurant: Restaurant | null;
  isLoading: boolean;
  authToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
  notification: { type: 'success' | 'error'; message: string } | null;
  
  // Modal states
  showMenuItemModal: boolean;
  showTableModal: boolean;
  showQRModal: boolean;
  selectedTable: string | null;
  editingMenuItem: MenuItem | null;
  
  // Form states
  menuItemForm: MenuItemForm;
  tableForm: TableForm;
  
  // Reports states
  specialInstructionsOrders: Order[];
  reportData: any;
  reportLoading: boolean;
  reportDateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RestaurantSettings {
  allowCashPayment: boolean;
  allowSplitPayment: boolean;
  enableReservations: boolean;
  enableWaitingList: boolean;
  maxWaitTime: number;
  autoConfirmOrders: boolean;
  requirePhoneForOrders: boolean;
  enableOrderNotifications: boolean;
  operatingHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
}

export interface RestaurantProfile {
  _id: string;
  name: string;
  description?: string;
  cuisine?: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  priceRange: 'budget' | 'moderate' | 'upscale' | 'fine-dining';
  settings?: RestaurantSettings;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  tables?: Array<{
    tableNumber: string;
    capacity: number;
    status: string;
    qrCode?: string;
  }>;
}

export interface RestaurantForm {
  name: string;
  description: string;
  cuisine: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  priceRange: string;
  facebook: string;
  instagram: string;
  twitter: string;
}

export interface MenuCategory {
  name: string;
  itemCount: number;
  averagePrice: number;
}
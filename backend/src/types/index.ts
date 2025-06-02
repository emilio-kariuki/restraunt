import { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'customer';
  restaurantId?: string;
  createdAt: Date;
}

export interface ITable {
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  qrCode?: string;
  currentOrderId?: string;
  currentPhase: 'waiting' | 'seated' | 'ordering' | 'waiting_food' | 'eating' | 'packing' | 'departure';
  seatedAt?: Date;
  estimatedDepartureTime?: Date;
}

export interface IRestaurantSettings {
  acceptsReservations: boolean;
  allowCashPayment: boolean;
  allowSplitPayment: boolean;
  enableReservations: boolean;
  enableWaitingList: boolean;
  autoConfirmOrders: boolean;
  requirePhoneForOrders: boolean;
  enableOrderNotifications: boolean;
  enableServerCall: boolean;
  maxWaitTime?: number; // Add this property
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  taxRate?: number;
  currency?: string;
  timezone?: string;
  enablePackingService?: boolean;
}

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  cuisine?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  priceRange: 'budget' | 'moderate' | 'upscale' | 'fine-dining';
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  tables: ITable[];
  ownerId: string;
  isWaitingSystemEnabled: boolean;
  maxWaitTime: number; // minutes
  phases: {
    seating: number; // minutes
    ordering: number;
    preparation: number;
    eating: number;
    packing: number;
  };
  settings: IRestaurantSettings;
  createdAt: Date;
}

export interface ICustomizationOption {
  name: string;
  price: number;
}

export interface ICustomization {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  options: ICustomizationOption[];
  required: boolean;
  maxSelections?: number;
}

export interface IMenuItem extends Document {
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  
  // Enhanced allergen and dietary information
  allergens?: string[];
  allergenNotes?: string;
  dietaryInfo?: string[];
  
  // Enhanced customization support
  customizations?: ICustomization[];
  
  // Legacy fields for backward compatibility
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  preparationTime?: number;
  calories?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
  specialInstructions?: string;
}

export interface IOrder extends Document {
  restaurantId: string;
  tableId: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'split';
  paymentIntentId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize?: number;
  specialInstructions?: string;
  packingRequested: boolean;
  splitPayment: boolean;
  currentPhase: 'waiting' | 'seated' | 'ordering' | 'waiting_food' | 'eating' | 'packing' | 'departure';
  waitingPosition?: number;
  seatedAt?: Date;
  orderedAt?: Date;
  servedAt?: Date;
  estimatedReadyTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWaitingList extends Document {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  estimatedWaitTime: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
  notes?: string;
  position: number;
  qrCodeGenerated: boolean;
  tableAssigned?: string;
  notificationsSent: {
    initial: boolean;
    reminder: boolean;
    ready: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservation extends Document {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string;
  tableAssigned?: string;
  reminderSent: boolean;
  confirmationRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpecialService extends Document {
  orderId: string;
  restaurantId: string;
  tableId: string;
  serviceType: 'server_call' | 'packing' | 'split_payment' | 'special_instructions' | 'complaint' | 'compliment';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  message?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedStaffId?: string;
  responseTime?: Date;
  completedAt?: Date;
  customerName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback extends Document {
  restaurantId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  comment: string;
  category: 'food' | 'service' | 'ambiance' | 'value' | 'overall';
  orderId?: string;
  tableId?: string;
  isPublic: boolean;
  status: 'pending' | 'approved' | 'rejected';
  response?: string;
  responseBy?: string;
  responseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  restaurantId: string;
  type: 'order' | 'reservation' | 'feedback' | 'service_request' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
}

export interface IAnalytics extends Document {
  restaurantId: string;
  date: Date;
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    tableUtilization: number;
    customerSatisfaction: number;
    popularItems: string[];
  };
  createdAt: Date;
}

export interface ITableSession extends Document {
  restaurantId: string;
  tableId: string;
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  partySize?: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'abandoned';
  activities: Array<{
    type: 'scanned' | 'browsed' | 'ordered' | 'paid';
    timestamp: Date;
    details?: any;
  }>;
  totalSpent?: number;
  feedback?: string;
  createdAt: Date;
}

export interface IQRCode extends Document {
  restaurantId: string;
  tableId: string;
  qrCodeData: string;
  qrCodeUrl: string;
  isActive: boolean;
  scannedCount: number;
  lastScannedAt?: Date;
  generatedAt: Date;
  expiresAt?: Date;
}

export interface IStaffMember extends Document {
  restaurantId: string;
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'waiter' | 'chef' | 'host';
  permissions: string[];
  assignedTables?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

// Request Types
export interface ICreateOrderRequest {
  tableId: string;
  items: IOrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize?: number;
  specialInstructions?: string;
  paymentMethod: 'card' | 'cash' | 'split';
}

export interface IUpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  estimatedReadyTime?: Date;
  notes?: string;
}
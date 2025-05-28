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
}

export interface IRestaurant extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  tables: ITable[];
  ownerId: string;
  settings: {
    acceptsReservations: boolean;
    operatingHours: {
      [key: string]: { open: string; close: string; closed?: boolean };
    };
    taxRate: number;
    currency: string;
    timezone: string;
  };
  createdAt: Date;
}

export interface IMenuItem extends Document {
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  preparationTime?: number; // in minutes
  createdAt: Date;
}

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
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
  paymentIntentId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  estimatedReadyTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  orderNumber?: string;
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
  createdAt: Date;
}

export interface IReservation extends Document {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  date: Date;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  tableAssigned?: string;
  createdAt: Date;
}
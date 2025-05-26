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
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWaitingList extends Document {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  estimatedWaitTime: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
  createdAt: Date;
}
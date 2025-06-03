import mongoose, { Schema } from 'mongoose';
import { IRestaurant } from '../types';

const tableSchema = new Schema({
  tableNumber: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'reserved', 'cleaning'], 
    default: 'available' 
  },
  qrCode: { type: String },
  currentOrderId: { type: String, ref: 'Order' },
  currentPhase: {
    type: String,
    enum: ['waiting', 'seated', 'ordering', 'waiting_food', 'eating', 'packing', 'departure'],
    default: 'waiting'
  }
});

const restaurantSchema = new Schema<IRestaurant>({
  name: { type: String, required: true },
  description: { type: String },
  cuisine: { type: String },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  logo: { type: String },
  coverImage: { type: String },
  priceRange: { 
    type: String, 
    enum: ['budget', 'moderate', 'upscale', 'fine-dining'],
    default: 'moderate'
  },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String }
  },
  tables: [tableSchema],
  ownerId: { type: String, required: true, ref: 'User' },
  isWaitingSystemEnabled: { type: Boolean, default: true },
  maxWaitTime: { type: Number, default: 15 }, // minutes
  phases: {
    seating: { type: Number, default: 5 }, // minutes
    ordering: { type: Number, default: 10 },
    preparation: { type: Number, default: 20 },
    eating: { type: Number, default: 45 },
    packing: { type: Number, default: 5 }
  },
  settings: {
    acceptsReservations: { type: Boolean, default: true },
    allowCashPayment: { type: Boolean, default: true },
    allowSplitPayment: { type: Boolean, default: true },
    enableReservations: { type: Boolean, default: false },
    enableWaitingList: { type: Boolean, default: false },
    autoConfirmOrders: { type: Boolean, default: false },
    requirePhoneForOrders: { type: Boolean, default: true },
    enableOrderNotifications: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0.08, min: 0, max: 1 }, // Add tax rate with validation
    operatingHours: {
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema);

import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const orderItemSchema = new Schema({
  menuItemId: { type: String, required: true, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  customizations: [{ type: String }]
});

const orderSchema = new Schema<IOrder>({
  restaurantId: { type: String, required: true, ref: 'Restaurant' },
  tableId: { type: String, required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentIntentId: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  specialInstructions: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ tableId: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);
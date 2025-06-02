import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

const orderItemSchema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, required: true, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  customizations: [{ type: String }],
  spiceLevel: { 
    type: String, 
    enum: ['mild', 'medium', 'hot'], 
    default: 'mild' 
  },
  allergens: [{ type: String }],
  specialInstructions: { type: String }
});

const orderSchema = new Schema<IOrder>({
  restaurantId: { type: String, required: true, ref: 'Restaurant' },
  tableId: { type: String, required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'split'],
    default: 'card'
  },
  paymentIntentId: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  partySize: { type: Number, min: 1 },
  specialInstructions: { type: String },
  packingRequested: { type: Boolean, default: false },
  splitPayment: { type: Boolean, default: false },
  currentPhase: {
    type: String,
    enum: ['waiting', 'seated', 'ordering', 'waiting_food', 'eating', 'packing', 'departure'],
    default: 'waiting'
  },
  waitingPosition: { type: Number },
  seatedAt: { type: Date },
  orderedAt: { type: Date },
  servedAt: { type: Date },
  estimatedReadyTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better query performance
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ tableId: 1, createdAt: -1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ currentPhase: 1 });

// Virtual for order number (last 6 digits of ID)
orderSchema.virtual('orderNumber').get(function() {
  return this._id.toString().slice(-6).toUpperCase();
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IOrder>('Order', orderSchema);
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
  qrCode: { type: String }
});

const restaurantSchema = new Schema<IRestaurant>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  tables: [tableSchema],
  ownerId: { type: String, required: true, ref: 'User' },
  settings: {
    acceptsReservations: { type: Boolean, default: true },
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

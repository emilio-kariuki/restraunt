import mongoose, { Schema } from 'mongoose';
import { IWaitingList } from '../types';

const waitingListSchema = new Schema<IWaitingList>({
  restaurantId: { type: String, required: true, ref: 'Restaurant' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1 },
  estimatedWaitTime: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'notified', 'seated', 'cancelled'], 
    default: 'waiting' 
  },
  createdAt: { type: Date, default: Date.now }
});

waitingListSchema.index({ restaurantId: 1, status: 1, createdAt: 1 });

export default mongoose.model<IWaitingList>('WaitingList', waitingListSchema);
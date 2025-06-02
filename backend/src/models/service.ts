import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableId: string;
  serviceType: 'special_request' | 'call_server' | 'special_instructions';
  category?: 'takeout' | 'dietary' | 'payment' | 'special' | 'family' | 'beverage' | 'seating' | 'menu';
  title: string;
  details: {
    selectedOptions?: string[];
    note?: string;
    message?: string;
    requestId?: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  tableId: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['special_request', 'call_server', 'special_instructions'],
    required: true
  },
  category: {
    type: String,
    enum: ['takeout', 'dietary', 'payment', 'special', 'family', 'beverage', 'seating', 'menu'],
    required: false
  },
  title: {
    type: String,
    required: true
  },
  details: {
    selectedOptions: [String],
    note: String,
    message: String,
    requestId: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  adminNotes: String,
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
ServiceSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
ServiceSchema.index({ tableId: 1, status: 1 });

export default mongoose.model<IService>('Service', ServiceSchema);
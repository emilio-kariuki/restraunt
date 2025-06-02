import mongoose, { Document, Schema } from 'mongoose';

interface IReview extends Document {
  restaurantId: mongoose.Types.ObjectId;
  customerName: string;
  email?: string;
  rating: number;
  comment: string;
  tableNumber?: string;
  orderId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  responses: Array<{
    staffId: mongoose.Types.ObjectId;
    message: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  tableNumber: {
    type: String,
    trim: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  responses: [{
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
reviewSchema.index({ restaurantId: 1, status: 1 });
reviewSchema.index({ restaurantId: 1, rating: 1 });
reviewSchema.index({ createdAt: -1 });

export default mongoose.model<IReview>('Review', reviewSchema);
import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableId: string;
  sessionId: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  tableId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ restaurantId: 1, tableId: 1 });
chatMessageSchema.index({ sessionId: 1 });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
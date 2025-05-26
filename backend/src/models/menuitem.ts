import mongoose, { Schema } from 'mongoose';
import { IMenuItem } from '../types';

const menuItemSchema = new Schema<IMenuItem>({
  restaurantId: { type: String, required: true, ref: 'Restaurant' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  image: { type: String },
  available: { type: Boolean, default: true },
  allergens: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

menuItemSchema.index({ restaurantId: 1, category: 1 });

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
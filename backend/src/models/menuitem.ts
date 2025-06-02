import mongoose, { Schema } from 'mongoose';
import { IMenuItem } from '../types';

const customizationOptionSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

const customizationSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['radio', 'checkbox', 'select'] 
  },
  options: [customizationOptionSchema],
  required: { type: Boolean, default: false },
  maxSelections: { type: Number, min: 1, max: 10 }
}, { _id: false });

const menuItemSchema = new Schema<IMenuItem>({
  restaurantId: { type: String, required: true, ref: 'Restaurant', index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true, lowercase: true },
  image: { type: String, default: '' },
  available: { type: Boolean, default: true },
  
  // Enhanced allergen and dietary information
  allergens: [{ type: String, trim: true }],
  allergenNotes: { type: String, trim: true, default: '' },
  dietaryInfo: [{ type: String, trim: true }],
  
  // Enhanced customization support
  customizations: [customizationSchema],
  
  // Legacy fields for backward compatibility
  isVegetarian: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  preparationTime: { type: Number, min: 0 },
  calories: { type: Number, min: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
menuItemSchema.index({ restaurantId: 1, category: 1 });
menuItemSchema.index({ restaurantId: 1, available: 1 });
menuItemSchema.index({ restaurantId: 1, name: 'text', description: 'text' });

// Update the updatedAt field on save
menuItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
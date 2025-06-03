import mongoose, { Schema } from 'mongoose';

const customizationSchema = new Schema({
  customizationId: { type: String, required: true },
  customizationName: { type: String, required: true },
  selectedOptions: [{
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 }
  }]
}, { _id: false });

const allergenPreferencesSchema = new Schema({
  avoidAllergens: [{ type: String, trim: true }],
  specialInstructions: { type: String, trim: true, default: '' },
  dietaryPreferences: [{ type: String, trim: true }]
}, { _id: false });

const orderItemSchema = new Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  
  // Enhanced allergen and customization support
  selectedCustomizations: [customizationSchema],
  allergenPreferences: allergenPreferencesSchema,
  
  // Item details for order history
  category: { type: String, required: true },
  description: { type: String, default: '' },
  originalAllergens: [{ type: String }], // Original item allergens for reference
  
  // Legacy fields
  customizations: [{ type: String }], // Kept for backward compatibility
  specialInstructions: { type: String, default: '' }
}, { _id: false });

const orderSchema = new Schema({
  restaurantId: { type: String, required: true, index: true },
  tableId: { type: String, required: true },
  items: [orderItemSchema],
  
  // Order details
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending' 
  },
  
  // Enhanced allergen summary for kitchen
  orderAllergenSummary: {
    hasAllergenConcerns: { type: Boolean, default: false },
    avoidedAllergens: [{ type: String }],
    specialInstructionsCount: { type: Number, default: 0 },
    dietaryPreferences: [{ type: String }]
  },
  
  // Timing
  estimatedPrepTime: { type: Number }, // in minutes
  orderTime: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  
  // Customer info
  customerName: { type: String },
  customerPhone: { type: String },
  customerEmail: { type: String },

  specialInstructions: { type: String, default: '' },
  
  // Payment
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending' 
  },
  paymentIntentId: { type: String },
  
  // Kitchen notes
  kitchenNotes: { type: String, default: '' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, tableId: 1 });
orderSchema.index({ restaurantId: 1, orderTime: -1 });
orderSchema.index({ 'orderAllergenSummary.hasAllergenConcerns': 1 });

// Update timestamp on save
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate allergen summary
  const allergenConcerns = this.items.some(item => 
    (item.allergenPreferences?.avoidAllergens?.length ?? 0) > 0 ||
    item.allergenPreferences?.specialInstructions?.trim()
  );
  
  const allAvoidedAllergens = new Set<string>();
  const allDietaryPrefs = new Set<string>();
  let specialInstructionsCount = 0;
  
  this.items.forEach(item => {
    if (item.allergenPreferences) {
      item.allergenPreferences.avoidAllergens?.forEach(allergen => allAvoidedAllergens.add(allergen));
      item.allergenPreferences.dietaryPreferences?.forEach(pref => allDietaryPrefs.add(pref));
      if (item.allergenPreferences.specialInstructions?.trim()) {
        specialInstructionsCount++;
      }
    }
  });
  
  this.orderAllergenSummary = {
    hasAllergenConcerns: allergenConcerns,
    avoidedAllergens: Array.from(allAvoidedAllergens),
    specialInstructionsCount,
    dietaryPreferences: Array.from(allDietaryPrefs)
  };
  
  next();
});

export default mongoose.model('Order', orderSchema);
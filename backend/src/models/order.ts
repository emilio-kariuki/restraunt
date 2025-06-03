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
  menuItemId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  
  // Enhanced allergen and customization support
  selectedCustomizations: [customizationSchema],
  allergenPreferences: allergenPreferencesSchema,
  
  // Item details for order history
  category: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  originalAllergens: [{ type: String }],
  
  // Legacy fields for backward compatibility
  customizations: [{ type: String }],
  specialInstructions: { type: String, default: '' }
}, { _id: false });

const orderSchema = new Schema({
 restaurantId: {
    type: String, // Change from ObjectId to String
    required: true,
    index: true // Add index for better query performance
  },
  tableId: { type: String, required: true, index: true },
  items: [orderItemSchema],
  
  // Order financial details
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  
  // Order status tracking
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Enhanced allergen summary for kitchen efficiency
  orderAllergenSummary: {
    hasAllergenConcerns: { type: Boolean, default: false, index: true },
    avoidedAllergens: [{ type: String }],
    specialInstructionsCount: { type: Number, default: 0 },
    dietaryPreferences: [{ type: String }]
  },
  
  // Timing optimization
  estimatedPrepTime: { type: Number, index: true },
  orderTime: { type: Date, default: Date.now, index: true },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  
  // Customer information
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },
  specialInstructions: { type: String, default: '' },
  
  // Payment tracking
  paymentStatus: { 
    type: String, 
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentIntentId: { type: String },
  
  // Kitchen operations
  kitchenNotes: { type: String, default: '' },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Optimized indexes for better query performance
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, tableId: 1 });
orderSchema.index({ restaurantId: 1, orderTime: -1 });
orderSchema.index({ restaurantId: 1, paymentStatus: 1 });
orderSchema.index({ 'orderAllergenSummary.hasAllergenConcerns': 1 });
orderSchema.index({ customerPhone: 1 });

// Optimized pre-save hook for allergen summary calculation
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Efficiently calculate allergen summary
  const allergenConcerns = this.items.some(item => {
    if (!item.allergenPreferences) return false;
    
    const avoidAllergens = item.allergenPreferences.avoidAllergens?.filter(a => a?.trim()) || [];
    const specialInstructions = item.allergenPreferences.specialInstructions?.trim() || '';
    const dietaryPreferences = item.allergenPreferences.dietaryPreferences?.filter(p => p?.trim()) || [];
    
    return avoidAllergens.length > 0 || specialInstructions.length > 0 || dietaryPreferences.length > 0;
  });
  
  if (allergenConcerns) {
    const allAvoidedAllergens = new Set<string>();
    const allDietaryPrefs = new Set<string>();
    let specialInstructionsCount = 0;
    
    this.items.forEach(item => {
      if (item.allergenPreferences) {
        // Collect avoided allergens
        item.allergenPreferences.avoidAllergens?.forEach(allergen => {
          const trimmed = allergen?.trim();
          if (trimmed && trimmed.length > 0) {
            allAvoidedAllergens.add(trimmed);
          }
        });
        
        // Collect dietary preferences
        item.allergenPreferences.dietaryPreferences?.forEach(pref => {
          const trimmed = pref?.trim();
          if (trimmed && trimmed.length > 0) {
            allDietaryPrefs.add(trimmed);
          }
        });
        
        // Count special instructions
        const specialInstructions = item.allergenPreferences.specialInstructions?.trim() || '';
        if (specialInstructions.length > 0) {
          specialInstructionsCount++;
        }
      }
    });
    
    this.orderAllergenSummary = {
      hasAllergenConcerns: true,
      avoidedAllergens: Array.from(allAvoidedAllergens),
      specialInstructionsCount,
      dietaryPreferences: Array.from(allDietaryPrefs)
    };
  } else {
    this.orderAllergenSummary = {
      hasAllergenConcerns: false,
      avoidedAllergens: [],
      specialInstructionsCount: 0,
      dietaryPreferences: []
    };
  }
  
  next();
});

export default mongoose.model('Order', orderSchema);
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      // Only send response if headers haven't been sent
      if (!res.headersSent) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }
      return; // Don't call next() if there's an error
    }
    
    next(); // Only call next() if validation passes
  };
};

// Update your schemas to handle empty strings properly
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'staff', 'customer').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createOrder: Joi.object({
    tableId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().optional(), // Allow either id or menuItemId
        menuItemId: Joi.string().optional(),
        quantity: Joi.number().min(1).required(),
        selectedCustomizations: Joi.array().items(
          Joi.object({
            customizationId: Joi.string().allow('').optional(),
            customizationName: Joi.string().allow('').optional(),
            selectedOptions: Joi.array().items(
              Joi.object({
                name: Joi.string().allow('').optional(),
                price: Joi.number().default(0).optional()
              })
            ).optional()
          })
        ).optional(),
        allergenPreferences: Joi.object({
          avoidAllergens: Joi.array().items(Joi.string().allow('')).optional(),
          specialInstructions: Joi.string().allow('').optional(), // ALLOW EMPTY STRINGS
          dietaryPreferences: Joi.array().items(Joi.string().allow('')).optional()
        }).optional(),
        customizations: Joi.array().items(Joi.string().allow('')).optional(),
        specialInstructions: Joi.string().allow('').optional() // ALLOW EMPTY STRINGS
      }).or('id', 'menuItemId') // Require at least one of these fields
    ).min(1).required(),
    customerName: Joi.string().required(),
    customerPhone: Joi.string().required(),
    customerEmail: Joi.string().email().allow('').optional(),
    specialInstructions: Joi.string().allow('').optional() // ALLOW EMPTY STRINGS
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled').required(),
    kitchenNotes: Joi.string().allow('').optional()
  }),

  createPaymentIntent: Joi.object({
    orderId: Joi.string().required()
  }),

  requestSpecialService: Joi.object({
    serviceType: Joi.string().valid('packing', 'split_payment', 'server_call', 'special_instructions').required(),
    message: Joi.string().allow('').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional()
  })
};
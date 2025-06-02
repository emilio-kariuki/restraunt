import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
       res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

const customizationOptionSchema = Joi.object({
  name: Joi.string().trim().required(),
  price: Joi.number().min(0).required()
});

const customizationSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().trim().required(),
  type: Joi.string().valid('radio', 'checkbox', 'select').required(),
  options: Joi.array().items(customizationOptionSchema).min(1).required(),
  required: Joi.boolean().default(false),
  maxSelections: Joi.number().integer().min(1).max(10).optional()
});

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
          menuItemId: Joi.string().required(),
          quantity: Joi.number().min(1).required(),
          customizations: Joi.array().items(Joi.string()).optional()
        })
      ).min(1).required(),
      customerName: Joi.string().optional(),
      customerPhone: Joi.string().optional(),
      specialInstructions: Joi.string().optional()
    }),
  
    createMenuItem: Joi.object({
      name: Joi.string().trim().required(),
      description: Joi.string().trim().required(),
      price: Joi.number().min(0).required(),
      category: Joi.string().trim().required(),
      image: Joi.string().trim().allow('').optional(),
      available: Joi.boolean().default(true),
      allergens: Joi.array().items(Joi.string().trim()).default([]),
      allergenNotes: Joi.string().trim().allow('').optional(),
      dietaryInfo: Joi.array().items(Joi.string().trim()).default([]),
      customizations: Joi.array().items(customizationSchema).default([]),
      isVegetarian: Joi.boolean().optional(),
      isSpicy: Joi.boolean().optional(),
      preparationTime: Joi.number().integer().min(0).optional(),
      calories: Joi.number().integer().min(0).optional(),
      restaurantId: Joi.string().optional()
    }),
  
    updateMenuItem: Joi.object({
      name: Joi.string().trim().optional(),
      description: Joi.string().trim().optional(),
      price: Joi.number().min(0).optional(),
      category: Joi.string().trim().optional(),
      image: Joi.string().trim().allow('').optional(),
      available: Joi.boolean().optional(),
      allergens: Joi.array().items(Joi.string().trim()).optional(),
      allergenNotes: Joi.string().trim().allow('').optional(),
      dietaryInfo: Joi.array().items(Joi.string().trim()).optional(),
      customizations: Joi.array().items(customizationSchema).optional(),
      isVegetarian: Joi.boolean().optional(),
      isSpicy: Joi.boolean().optional(),
      preparationTime: Joi.number().integer().min(0).optional(),
      calories: Joi.number().integer().min(0).optional()
    }),
  
    createReview: Joi.object({
      customerName: Joi.string().required().min(2).max(50),
      email: Joi.string().email().optional(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().required().min(10).max(500),
      tableNumber: Joi.string().optional(),
      orderId: Joi.string().optional()
    })
  };
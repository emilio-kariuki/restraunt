import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};


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
      name: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().min(0).required(),
      category: Joi.string().required(),
      image: Joi.string().optional(),
      allergens: Joi.array().items(Joi.string()).optional()
    })
  };
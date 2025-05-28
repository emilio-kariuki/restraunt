import { Request, Response } from 'express';
import Order from '../models/order';
import MenuItem from '../models/menuitem';
import { StripeService } from '../services/stripeService';
import { TwilioService } from '../services/twilioService';
import logger from '../utils/logger';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: any;
}

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { tableId, items, customerName, customerPhone, customerEmail, specialInstructions } = req.body;
      const { restaurantId } = req.params;

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items are required' });
        return;
      }

      if (!customerName || !customerPhone) {
        res.status(400).json({ error: 'Customer name and phone are required' });
        return;
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(customerPhone)) {
        res.status(400).json({ error: 'Invalid phone number format' });
        return;
      }

      // Validate menu items and calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        // if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
        //   res.status(400).json({ error: `"items[${items.indexOf(item)}].menuItemId" is required` });
        //   return;
        // }

        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem || !menuItem.available) {
          res.status(400).json({ error: `Menu item ${item.menuItemId} not available` });
          return;
        }

        const orderItem = {
          menuItemId: item.menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          customizations: item.customizations || []
        };

        orderItems.push(orderItem);
        subtotal += menuItem.price * item.quantity;
      }

      // Calculate tax and total
      const taxRate = 0.08; // 8% tax
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      const order = new Order({
        restaurantId,
        tableId,
        items: orderItems,
        subtotal,
        tax,
        total,
        customerName,
        customerPhone,
        customerEmail,
        specialInstructions,
        status: 'pending',
        paymentStatus: 'pending'
      });

      await order.save();

      // Send order confirmation SMS
      try {
        await TwilioService.sendOrderConfirmation(
          customerPhone,
          order._id.toString().slice(-6),
          customerName
        );
      } catch (smsError) {
        logger.error('SMS notification error:', smsError);
        // Don't fail the order creation if SMS fails
      }

      res.status(201).json({
        message: 'Order created successfully',
        order
      });
    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.paymentStatus === 'paid') {
        res.status(400).json({ error: 'Order already paid' });
        return;
      }

      const paymentIntent = await StripeService.createPaymentIntent(
        order.total,
        order._id.toString(),
        {
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          tableId: order.tableId
        }
      );

      order.paymentIntentId = paymentIntent.id;
      await order.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: order.total,
        orderId: order._id
      });
    } catch (error) {
      logger.error('Create payment intent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (!order.paymentIntentId) {
        res.status(400).json({ error: 'No payment intent found' });
        return;
      }

      const paymentIntent = await StripeService.confirmPayment(order.paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        await order.save();

        // Send payment confirmation SMS
        try {
          await TwilioService.sendPaymentConfirmation(
            order.customerPhone,
            order._id.toString().slice(-6),
            order.total
          );
        } catch (smsError) {
          logger.error('SMS notification error:', smsError);
        }

        res.json({
          message: 'Payment confirmed',
          order
        });
      } else {
        res.status(400).json({ error: 'Payment failed' });
      }
    } catch (error) {
      logger.error('Confirm payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      // Validate status values
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }

      // Check if user is authenticated and has restaurantId
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ error: 'Authentication required with restaurant access' });
        return;
      }

      const order = await Order.findOneAndUpdate(
        { _id: orderId, restaurantId: req.user.restaurantId },
        { status, updatedAt: new Date() },
        { new: true, session }
      );

      if (!order) {
        await session.abortTransaction();
        res.status(404).json({ error: 'Order not found or access denied' });
        return;
      }

      // Send SMS notifications based on status
      try {
        switch (status) {
          case 'confirmed':
            await TwilioService.sendOrderConfirmed(
              order.customerPhone,
              order._id.toString().slice(-6)
            );
            break;
          case 'preparing':
            await TwilioService.sendOrderPreparing(
              order.customerPhone,
              order._id.toString().slice(-6)
            );
            break;
          case 'ready':
            await TwilioService.sendOrderReady(
              order.customerPhone,
              order._id.toString().slice(-6),
              order.tableId
            );
            break;
          case 'cancelled':
            await TwilioService.sendOrderCancelled(
              order.customerPhone,
              order._id.toString().slice(-6)
            );
            break;
        }
      } catch (smsError) {
        logger.error('SMS notification error:', smsError);
        // Don't fail the status update if SMS fails
      }

      await session.commitTransaction();
      res.json({ order });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      session.endSession();
    }
  }

  static async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ error: 'Authentication required with restaurant access' });
        return;
      }

      const { status, tableId, date } = req.query;
      const filter: any = { restaurantId: req.user.restaurantId };

      if (status) filter.status = status;
      if (tableId) filter.tableId = tableId;
      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(date as string);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt = { $gte: startDate, $lt: endDate };
      }

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({ orders });
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json({ order });
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getOrderStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ error: 'Authentication required with restaurant access' });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await Order.aggregate([
        {
          $match: {
            restaurantId: req.user.restaurantId,
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            ordersByStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            }
          }
        }
      ]);

      res.json({ stats: stats[0] || {} });
    } catch (error) {
      logger.error('Get order stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
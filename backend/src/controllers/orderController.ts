import { Request, Response } from 'express';
import Order from '../models/order';
import MenuItem from '../models/menuitem';
import { StripeService } from '../services/stripeService';
import { TwilioService } from '../services/twilioService';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { tableId, items, customerName, customerPhone, specialInstructions } = req.body;
      const { restaurantId } = req.params;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Items are required' });
        return;
      }

      // Validate menu items and calculate total
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
          res.status(400).json({ error: 'Invalid item data' });
          return;
        }

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
        total += menuItem.price * item.quantity;
      }

      const order = new Order({
        restaurantId,
        tableId,
        items: orderItems,
        total,
        customerName,
        customerPhone,
        specialInstructions,
        status: 'pending'
      });

      await order.save();

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
        order._id.toString()
      );

      order.paymentIntentId = paymentIntent.id;
      await order.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: order.total
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
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
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
        { new: true }
      );

      if (!order) {
        res.status(404).json({ error: 'Order not found or access denied' });
        return;
      }

      // Send SMS notification when order is ready
      if (status === 'ready' && order.customerPhone) {
        try {
          await TwilioService.notifyOrderReady(
            order.customerPhone,
            order._id.toString().slice(-6)
          );
        } catch (smsError) {
          logger.error('SMS notification error:', smsError);
          // Don't fail the request if SMS fails
        }
      }

      res.json({ order });
    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ error: 'Authentication required with restaurant access' });
        return;
      }

      const { status, tableId } = req.query;
      const filter: any = { restaurantId: req.user.restaurantId };

      if (status) filter.status = status;
      if (tableId) filter.tableId = tableId;

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);

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
}

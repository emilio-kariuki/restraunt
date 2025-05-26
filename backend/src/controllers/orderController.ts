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

      // Validate menu items and calculate total
      let total = 0;
      const orderItems = [];

      for (const item of items) {
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

      const order = await Order.findOneAndUpdate(
        { _id: orderId, restaurantId: req.user.restaurantId },
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Send SMS notification when order is ready
      if (status === 'ready' && order.customerPhone) {
        await TwilioService.notifyOrderReady(
          order.customerPhone,
          order._id.toString().slice(-6)
        );
      }

      res.json({ order });
    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
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

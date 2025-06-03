import { Request, Response } from 'express';
import Order from '../models/order';
import MenuItem from '../models/menuitem';
import { StripeService } from '../services/stripeService';
import { TwilioService } from '../services/twilioService';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import restraunt from '../models/restraunt';

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
        res.status(400).json({ 
          success: false, 
          error: 'Items are required' 
        });
        return;
      }

      if (!customerName || !customerPhone) {
        res.status(400).json({ 
          success: false, 
          error: 'Customer name and phone are required' 
        });
        return;
      }

      if (!tableId) {
        res.status(400).json({ 
          success: false, 
          error: 'Table ID is required' 
        });
        return;
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(customerPhone)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid phone number format' 
        });
        return;
      }

      // Enhanced menu item validation and order processing
      let subtotal = 0;
      const processedItems: Array<{
        menuItemId: string;
        name: string;
        price: number;
        quantity: number;
        category: string;
        description: string;
        originalAllergens: string[];
        selectedCustomizations: Array<{
          customizationId: string;
          customizationName: string;
          selectedOptions: Array<{
            name: string;
            price: number;
          }>;
        }>;
        allergenPreferences: {
          avoidAllergens: string[];
          specialInstructions: string;
          dietaryPreferences: string[];
        };
        customizations: string[];
        specialInstructions: string;
      }> = [];

      for (const item of items) {
        // Validate basic item structure
        const menuItemId = item.id || item.menuItemId;
        if (!menuItemId) {
          res.status(400).json({ 
            success: false,
            error: `Item missing ID at index ${items.indexOf(item)}` 
          });
          return;
        }

        if (!item.quantity || item.quantity <= 0) {
          res.status(400).json({ 
            success: false,
            error: `Invalid quantity for item at index ${items.indexOf(item)}` 
          });
          return;
        }

        // Find the menu item
        const menuItem = await MenuItem.findById(menuItemId);
        
        if (!menuItem || !menuItem.available) {
          res.status(400).json({ 
            success: false,
            error: `Menu item ${menuItemId} not available` 
          });
          return;
        }

        // Calculate customization pricing
        const customizationPrice = item.selectedCustomizations?.reduce((sum: number, custom: any) => {
          return sum + custom.selectedOptions.reduce((optSum: number, option: any) => {
            return optSum + (option.price || 0);
          }, 0);
        }, 0) || 0;

        // Calculate item total
        const itemTotal = (menuItem.price + customizationPrice) * item.quantity;
        subtotal += itemTotal;

        // Process allergen preferences safely
        const allergenPreferences = {
          avoidAllergens: item.allergenPreferences?.avoidAllergens || [],
          specialInstructions: item.allergenPreferences?.specialInstructions?.trim() || '',
          dietaryPreferences: item.allergenPreferences?.dietaryPreferences || []
        };

        // Process customizations safely
        const selectedCustomizations = item.selectedCustomizations?.map((custom: any) => ({
          customizationId: custom.customizationId || custom.id || '',
          customizationName: custom.customizationName || custom.name || '',
          selectedOptions: (custom.selectedOptions || []).map((option: any) => ({
            name: option.name || '',
            price: option.price || 0
          }))
        })) || [];

        // Build the processed item with enhanced data structure
        const processedItem = {
          menuItemId: menuItem._id.toString(),
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          category: menuItem.category || 'General',
          description: menuItem.description || '',
          originalAllergens: menuItem.allergens || [],

          // Enhanced allergen and customization support
          selectedCustomizations,
          allergenPreferences,

          // Legacy fields for backward compatibility
          customizations: item.customizations || [],
          specialInstructions: item.specialInstructions || allergenPreferences.specialInstructions || ''
        };

        processedItems.push(processedItem);
      }

      // Calculate tax and total
      const taxRate = 0.08; // 8% tax
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Estimate preparation time based on items and complexity
      const estimatedPrepTime = Math.max(
        15, // Minimum 15 minutes
        processedItems.reduce((maxTime: number, item: any) => {
          const baseTime = 10; // Base 10 minutes per item type
          const customizationTime = item.selectedCustomizations.length * 2; // 2 minutes per customization
          const allergenTime = item.allergenPreferences.avoidAllergens.length > 0 ? 5 : 0; // Extra 5 minutes for allergen concerns
          const itemTime = baseTime + customizationTime + allergenTime;
          return Math.max(maxTime, itemTime);
        }, 0) + (processedItems.length * 2) // Add 2 minutes per item
      );

      // Create the order with enhanced data structure
      const order = new Order({
        restaurantId,
        tableId,
        items: processedItems,
        subtotal,
        tax,
        total,
        estimatedPrepTime,
        orderTime: new Date(),
        customerName,
        customerPhone,
        customerEmail,
        specialInstructions,
        status: 'pending',
        paymentStatus: 'pending'
      });

      // Save the order (this will trigger the pre-save hook to calculate allergen summary)
      await order.save();

      // Enhanced SMS notification with allergen info
      try {
        const orderNumber = order._id.toString().slice(-6);
        await TwilioService.sendOrderConfirmation(
          customerPhone,
          orderNumber,
          customerName
        );

        // Send allergen alert to restaurant if needed
        if (order?.orderAllergenSummary?.hasAllergenConcerns) {
          logger.info(`Order ${orderNumber} has allergen concerns - Restaurant should be notified`);
          
          // Optional: Send SMS to restaurant about allergen concerns
          try {
            const restaurant = await restraunt.findById(restaurantId);
            if (restaurant?.phone && TwilioService.isConfigured()) {
              await TwilioService.sendCustomNotification(
                restaurant.phone,
                `⚠️ ALLERGEN ALERT: New order #${orderNumber} at Table ${tableId} has allergen concerns. Please review carefully.`
              );
            }
          } catch (restaurantSmsError) {
            logger.error('Restaurant allergen SMS notification error:', restaurantSmsError);
          }
        }
      } catch (smsError) {
        logger.error('SMS notification error:', smsError);
        // Don't fail the order creation if SMS fails
      }

      // Enhanced response with allergen summary
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          id: order._id,
          restaurantId: order.restaurantId,
          tableId: order.tableId,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          estimatedPrepTime: order.estimatedPrepTime,
          orderTime: order.orderTime,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          specialInstructions: order.specialInstructions,
          
          // Include allergen summary for frontend
          hasAllergenConcerns: order?.orderAllergenSummary?.hasAllergenConcerns || false,
          allergenSummary: order.orderAllergenSummary
        }
      });

    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
        return;
      }

      if (order.paymentStatus === 'completed') {
        res.status(400).json({ 
          success: false, 
          error: 'Order already paid' 
        });
        return;
      }

      const paymentIntent = await StripeService.createPaymentIntent(
        order.total,
        order._id.toString(),
        {
          customerName: order.customerName || 'Guest',
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone || '',
          tableId: order.tableId
        }
      );

      order.paymentIntentId = paymentIntent.id;
      order.paymentStatus = 'processing';
      await order.save();

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: order.total,
        orderId: order._id
      });
    } catch (error) {
      logger.error('Create payment intent error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
        return;
      }

      if (!order.paymentIntentId) {
        res.status(400).json({ 
          success: false, 
          error: 'No payment intent found' 
        });
        return;
      }

      const paymentIntent = await StripeService.confirmPayment(order.paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.confirmedAt = new Date();
        await order.save();

        // Send payment confirmation SMS
        try {
          await TwilioService.sendPaymentConfirmation(
            order.customerPhone || '',
            order._id.toString().slice(-6),
            order.total
          );
        } catch (smsError) {
          logger.error('SMS notification error:', smsError);
        }

        res.json({
          success: true,
          message: 'Payment confirmed',
          order: {
            id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            confirmedAt: order.confirmedAt,
            total: order.total
          }
        });
      } else {
        order.paymentStatus = 'failed';
        await order.save();
        
        res.status(400).json({ 
          success: false, 
          error: 'Payment failed' 
        });
      }
    } catch (error) {
      logger.error('Confirm payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    const useTransactions = process.env.NODE_ENV === 'production' || process.env.MONGODB_REPLICA_SET === 'true';
    
    let session: mongoose.ClientSession | null = null;
    if (useTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      const { orderId } = req.params;
      const { status, kitchenNotes } = req.body;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
        return;
      }

      if (!status) {
        res.status(400).json({ 
          success: false, 
          error: 'Status is required' 
        });
        return;
      }

      // Validate status values
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid status value' 
        });
        return;
      }

      // Check if user is authenticated and has restaurantId
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required with restaurant access' 
        });
        return;
      }

      const updateData: any = { 
        status, 
        updatedAt: new Date() 
      };

      // Add completion timestamp for completed orders
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      // Update kitchen notes if provided
      if (kitchenNotes !== undefined) {
        updateData.kitchenNotes = kitchenNotes;
      }

      const updateOptions: any = { new: true };
      if (session) updateOptions.session = session;

      const order = await Order.findOneAndUpdate(
        { _id: orderId, restaurantId: req.user.restaurantId },
        updateData,
        updateOptions
      );

      if (!order) {
        if (session) await session.abortTransaction();
        res.status(404).json({ 
          success: false, 
          error: 'Order not found or access denied' 
        });
        return;
      }

      // Send SMS notifications based on status
      try {
        const orderNumber = order._id.toString().slice(-6);
        switch (status) {
          case 'confirmed':
            await TwilioService.sendOrderConfirmed(
              order.customerPhone || '',
              orderNumber
            );
            break;
          case 'preparing':
            await TwilioService.sendOrderPreparing(
              order.customerPhone || '',
              orderNumber
            );
            break;
          case 'ready':
            await TwilioService.sendOrderReady(
              order.customerPhone || '',
              orderNumber,
              order.tableId
            );
            break;
          case 'served':
            // Optional: Send served notification
            break;
          case 'completed':
            // Optional: Send thank you message
            break;
          case 'cancelled':
            await TwilioService.sendOrderCancelled(
              order.customerPhone || '',
              orderNumber
            );
            break;
        }
      } catch (smsError) {
        logger.error('SMS notification error:', smsError);
        // Don't fail the status update if SMS fails
      }

      if (session) await session.commitTransaction();
      
      res.json({ 
        success: true,
        order: {
          id: order._id,
          status: order.status,
          updatedAt: order.updatedAt,
          completedAt: order.completedAt,
          kitchenNotes: order.kitchenNotes,
          hasAllergenConcerns: order.orderAllergenSummary?.hasAllergenConcerns || false
        }
      });
    } catch (error) {
      if (session) await session.abortTransaction();
      logger.error('Update order status error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    } finally {
      if (session) session.endSession();
    }
  }

  static async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required with restaurant access' 
        });
        return;
      }

      const { 
        status, 
        tableId, 
        date, 
        hasAllergenConcerns,
        page = '1', 
        limit = '50' 
      } = req.query;
      
      const filter: any = { restaurantId: req.user.restaurantId };

      // Build query filters
      if (status) {
        filter.status = Array.isArray(status) ? { $in: status } : status;
      }
      
      if (tableId) {
        filter.tableId = tableId;
      }
      
      if (hasAllergenConcerns === 'true') {
        filter['orderAllergenSummary.hasAllergenConcerns'] = true;
      }
      
      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(date as string);
        endDate.setDate(endDate.getDate() + 1);
        filter.orderTime = { $gte: startDate, $lt: endDate };
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const orders = await Order.find(filter)
        .sort({ orderTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const totalOrders = await Order.countDocuments(filter);

      // Enhanced order data for admin interface
      const enhancedOrders = orders.map(order => ({
        ...order,
        hasAllergenConcerns: order.orderAllergenSummary?.hasAllergenConcerns || false,
        allergenSummary: order.orderAllergenSummary,
        orderNumber: order._id.toString().slice(-6),
        itemCount: order.items?.length || 0,
        estimatedReadyTime: order.estimatedPrepTime ? 
          new Date(order.orderTime.getTime() + order.estimatedPrepTime * 60000) : null
      }));

      res.json({
        success: true,
        orders: enhancedOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalOrders,
          pages: Math.ceil(totalOrders / limitNum)
        }
      });
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
        return;
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
        return;
      }

      // Enhanced response with comprehensive allergen information
      res.json({
        success: true,
        order: {
          ...order,
          // Add helpful allergen summary for display
          hasAllergenConcerns: order.orderAllergenSummary?.hasAllergenConcerns || false,
          allergenSummary: order.orderAllergenSummary,
          orderNumber: order._id.toString().slice(-6),
          estimatedReadyTime: order.estimatedPrepTime ? 
            new Date(order.orderTime.getTime() + order.estimatedPrepTime * 60000) : null,
          // Ensure items have proper allergen data structure
          items: order.items.map(item => ({
            ...item,
            // Ensure allergen preferences are properly structured
            allergenPreferences: item.allergenPreferences || {
              avoidAllergens: [],
              specialInstructions: '',
              dietaryPreferences: []
            },
            // Ensure original allergens are accessible
            originalAllergens: item.originalAllergens || [],
            // Ensure customizations are properly structured
            selectedCustomizations: item.selectedCustomizations || []
          }))
        }
      });

    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve order' 
      });
    }
  }

  static async getOrderStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required with restaurant access' 
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await Order.aggregate([
        {
          $match: {
            restaurantId: req.user.restaurantId,
            orderTime: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            totalAllergenOrders: {
              $sum: {
                $cond: [{ $eq: ['$orderAllergenSummary.hasAllergenConcerns', true] }, 1, 0]
              }
            },
            ordersByStatus: {
              $push: {
                status: '$status',
                hasAllergenConcerns: '$orderAllergenSummary.hasAllergenConcerns'
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalAllergenOrders: 0,
        ordersByStatus: []
      };

      // Calculate status breakdown
      const statusBreakdown = result.ordersByStatus.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      res.json({
        success: true,
        stats: {
          ...result,
          statusBreakdown,
          allergenPercentage: result.totalOrders > 0 ? 
            ((result.totalAllergenOrders / result.totalOrders) * 100).toFixed(1) : '0'
        }
      });
    } catch (error) {
      logger.error('Get order stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async requestSpecialService(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { serviceType, message, priority } = req.body;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
        return;
      }

      if (!serviceType) {
        res.status(400).json({ 
          success: false, 
          error: 'Service type is required' 
        });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
        return;
      }

      const orderNumber = order._id.toString().slice(-6);

      // Update order based on service type
      switch (serviceType) {
        case 'packing':
          // Add packing request to order (you might want to add this field to the schema)
          order.kitchenNotes = `${order.kitchenNotes ? order.kitchenNotes + ' | ' : ''}PACKING REQUESTED`;
          await TwilioService.sendPackingRequest(
            order.restaurantId,
            order.tableId,
            order.customerName || 'Guest',
            orderNumber
          );
          break;

        case 'split_payment':
          // Add split payment request (you might want to add this field to the schema)
          order.kitchenNotes = `${order.kitchenNotes ? order.kitchenNotes + ' | ' : ''}SPLIT PAYMENT REQUESTED`;
          await TwilioService.sendSplitPaymentRequest(
            order.restaurantId,
            order.tableId,
            order.customerName || 'Guest',
            orderNumber
          );
          break;

        case 'server_call':
          await TwilioService.sendServerCallRequest(
            order.restaurantId,
            order.tableId,
            order.customerName || 'Guest',
          );
          break;

        case 'special_instructions':
          if (message) {
            order.specialInstructions = message;
            // Send special instructions to staff
            const restaurant = await restraunt.findById(order.restaurantId);
            if (restaurant && TwilioService.isConfigured()) {
              await TwilioService.sendCustomNotification(
                restaurant.phone,
                `Special instructions for Table ${order.tableId} (Order #${orderNumber}): ${message}`
              );
            }
          }
          break;

        default:
          res.status(400).json({ 
            success: false, 
            error: 'Invalid service type' 
          });
          return;
      }

      order.updatedAt = new Date();
      await order.save();

      res.json({
        success: true,
        message: 'Service requested successfully',
        order: {
          id: order._id,
          kitchenNotes: order.kitchenNotes,
          specialInstructions: order.specialInstructions,
          updatedAt: order.updatedAt
        },
        serviceType,
        notificationSent: TwilioService.isConfigured()
      });
    } catch (error) {
      logger.error('Request special service error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async updateOrderPhase(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { phase, kitchenNotes } = req.body;

      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          error: 'Order ID is required' 
        });
        return;
      }

      const updateData: any = { 
        updatedAt: new Date() 
      };

      if (phase) {
        // You might want to add currentPhase to your schema
        updateData.currentPhase = phase;
      }

      if (kitchenNotes !== undefined) {
        updateData.kitchenNotes = kitchenNotes;
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );

      if (!order) {
        res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
        return;
      }

      res.json({
        success: true,
        order: {
          id: order._id,
          status: order.status,
          kitchenNotes: order.kitchenNotes,
          updatedAt: order.updatedAt,
          hasAllergenConcerns: order.orderAllergenSummary?.hasAllergenConcerns || false
        }
      });
    } catch (error) {
      logger.error('Update order phase error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // New method to get allergen-specific order data
  static async getAllergenOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required with restaurant access' 
        });
        return;
      }

      const filter = { 
        restaurantId: req.user.restaurantId,
        'orderAllergenSummary.hasAllergenConcerns': true 
      };

      const allergenOrders = await Order.find(filter)
        .sort({ orderTime: -1 })
        .limit(50)
        .lean();

      res.json({
        success: true,
        orders: allergenOrders.map(order => ({
          id: order._id,
          orderNumber: order._id.toString().slice(-6),
          tableId: order.tableId,
          customerName: order.customerName,
          status: order.status,
          orderTime: order.orderTime,
          allergenSummary: order.orderAllergenSummary,
          itemCount: order.items?.length || 0
        }))
      });
    } catch (error) {
      logger.error('Get allergen orders error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}
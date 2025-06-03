import { Request, Response } from 'express';
import Order from '../models/order';
import MenuItem from '../models/menuitem';
import { StripeService } from '../services/stripeService';
import { TwilioService } from '../services/twilioService';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import restraunt from '../models/restraunt';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    restaurantId: string;
  };
}

export class OrderController {
  // Optimized order creation without transactions for standalone MongoDB
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      
      // Validate restaurantId format - ensure it's a string
      if (!restaurantId || typeof restaurantId !== 'string' || !restaurantId.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Valid Restaurant ID is required' 
        });
        return;
      }

      const { tableId, items, customerName, customerPhone, customerEmail, specialInstructions } = req.body;

      // Get restaurant to access tax rate
      const restaurant = await restraunt.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ 
          success: false, 
          error: 'Restaurant not found' 
        });
        return;
      }

      // Enhanced validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Items are required and must be a non-empty array' 
        });
        return;
      }

      if (!customerName?.trim() || !customerPhone?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Customer name and phone are required' 
        });
        return;
      }

      if (!tableId?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Table ID is required' 
        });
        return;
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(customerPhone.trim())) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid phone number format' 
        });
        return;
      }

      // Batch fetch all menu items for performance
      const menuItemIds = items.map(item => item.id || item.menuItemId).filter(Boolean);
      const menuItems = await MenuItem.find({ 
        _id: { $in: menuItemIds },
        available: true 
      });

      if (menuItems.length !== menuItemIds.length) {
        res.status(400).json({ 
          success: false,
          error: 'Some menu items are not available or not found' 
        });
        return;
      }

      // Create a map for quick lookup
      const menuItemMap = new Map(menuItems.map(item => [item._id.toString(), item]));

      // Process items with optimized logic
      let subtotal = 0;
      const processedItems = [];
      let hasAllergenConcerns = false;
      const allergenSummary = {
        avoidedAllergens: new Set<string>(),
        dietaryPreferences: new Set<string>(),
        specialInstructionsCount: 0
      };

      for (const item of items) {
        const menuItemId = item.id || item.menuItemId;
        const menuItem = menuItemMap.get(menuItemId);

        if (!menuItem) {
          res.status(400).json({ 
            success: false,
            error: `Menu item ${menuItemId} not available` 
          });
          return;
        }

        if (!item.quantity || item.quantity <= 0) {
          res.status(400).json({ 
            success: false,
            error: `Invalid quantity for item: ${menuItem.name}` 
          });
          return;
        }

        // Calculate customization pricing efficiently
        const customizationPrice = item.selectedCustomizations?.reduce((sum: number, custom: any) => {
          return sum + (custom.selectedOptions || []).reduce((optSum: number, option: any) => {
            return optSum + (option.price || 0);
          }, 0);
        }, 0) || 0;

        const itemTotal = (menuItem.price + customizationPrice) * item.quantity;
        subtotal += itemTotal;

        // Process allergen preferences with proper filtering
        const allergenPreferences = {
          avoidAllergens: (item.allergenPreferences?.avoidAllergens || [])
            .filter((allergen: string) => allergen?.trim().length > 0),
          specialInstructions: item.allergenPreferences?.specialInstructions?.trim() || '',
          dietaryPreferences: (item.allergenPreferences?.dietaryPreferences || [])
            .filter((pref: string) => pref?.trim().length > 0)
        };

        // Track allergen concerns
        if (allergenPreferences.avoidAllergens.length > 0) {
          hasAllergenConcerns = true;
          allergenPreferences.avoidAllergens.forEach((allergen: string) => 
            allergenSummary.avoidedAllergens.add(allergen)
          );
        }

        if (allergenPreferences.dietaryPreferences.length > 0) {
          hasAllergenConcerns = true;
          allergenPreferences.dietaryPreferences.forEach((pref: string) => 
            allergenSummary.dietaryPreferences.add(pref)
          );
        }

        if (allergenPreferences.specialInstructions) {
          hasAllergenConcerns = true;
          allergenSummary.specialInstructionsCount++;
        }

        // Process customizations safely
        const selectedCustomizations = (item.selectedCustomizations || []).map((custom: any) => ({
          customizationId: custom.customizationId || custom.id || '',
          customizationName: custom.customizationName || custom.name || '',
          selectedOptions: (custom.selectedOptions || []).map((option: any) => ({
            name: option.name || '',
            price: option.price || 0
          }))
        }));

        const processedItem = {
          menuItemId: menuItem._id.toString(),
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          category: menuItem.category || 'General',
          description: menuItem.description || '',
          originalAllergens: menuItem.allergens || [],
          selectedCustomizations,
          allergenPreferences,
          // Legacy fields for backward compatibility
          customizations: item.customizations || [],
          specialInstructions: item.specialInstructions || allergenPreferences.specialInstructions || ''
        };

        processedItems.push(processedItem);
      }

      // Calculate tax and total using restaurant's tax rate
      const taxRate = restaurant.settings?.taxRate || 0.08; // Default to 8% if not set
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Optimized preparation time calculation
      const estimatedPrepTime = Math.max(
        15, // Minimum 15 minutes
        Math.min(
          60, // Maximum 60 minutes
          processedItems.reduce((maxTime: number, item: any) => {
            const baseTime = 8; // Base 8 minutes per item type
            const customizationTime = item.selectedCustomizations.length * 1.5; // 1.5 minutes per customization
            const allergenTime = item.allergenPreferences.avoidAllergens.length > 0 ? 5 : 0; // Extra 5 minutes for allergen concerns
            const itemTime = baseTime + customizationTime + allergenTime;
            return Math.max(maxTime, itemTime);
          }, 0) + (processedItems.length * 1.5) // Add 1.5 minutes per item
        )
      );

      // Create allergen summary
      const orderAllergenSummary = hasAllergenConcerns ? {
        hasAllergenConcerns: true,
        avoidedAllergens: Array.from(allergenSummary.avoidedAllergens),
        dietaryPreferences: Array.from(allergenSummary.dietaryPreferences),
        specialInstructionsCount: allergenSummary.specialInstructionsCount
      } : {
        hasAllergenConcerns: false,
        avoidedAllergens: [],
        dietaryPreferences: [],
        specialInstructionsCount: 0
      };

      // Create the order with restaurantId as string
      const order = new Order({
        restaurantId: restaurantId.trim(),
        tableId,
        items: processedItems,
        subtotal,
        tax,
        total,
        taxRate, // Store the tax rate used for this order
        estimatedPrepTime,
        orderTime: new Date(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || '',
        specialInstructions: specialInstructions?.trim() || '',
        status: 'pending',
        paymentStatus: 'pending',
        orderAllergenSummary
      });

      // Save the order
      await order.save();

      // Send notifications asynchronously
      setImmediate(async () => {
        try {
          const orderNumber = order._id.toString().slice(-6);
          
          if (TwilioService.sendOrderConfirmation) {
            await TwilioService.sendOrderConfirmation(
              customerPhone.trim(),
              orderNumber,
              customerName.trim()
            );
          }

          // Send allergen alert if needed
          if (orderAllergenSummary.hasAllergenConcerns) {
            const allergenDetails = [
              orderAllergenSummary.avoidedAllergens.length > 0 ? 
                `Avoid: ${orderAllergenSummary.avoidedAllergens.join(', ')}` : '',
              orderAllergenSummary.dietaryPreferences.length > 0 ? 
                `Diet: ${orderAllergenSummary.dietaryPreferences.join(', ')}` : '',
              orderAllergenSummary.specialInstructionsCount > 0 ? 
                `${orderAllergenSummary.specialInstructionsCount} special instruction(s)` : ''
            ].filter(detail => detail.length > 0).join(' | ');

            try {
              const restaurant = await restraunt.findById(restaurantId);
              if (restaurant?.phone && TwilioService.sendCustomNotification) {
                await TwilioService.sendCustomNotification(
                  restaurant.phone,
                  `⚠️ ALLERGEN ALERT: Order #${orderNumber} (Table ${tableId}) - ${allergenDetails}`
                );
              }
            } catch (smsError) {
              logger.error('Restaurant allergen SMS notification error:', smsError);
            }
          }
        } catch (smsError) {
          logger.error('SMS notification error:', smsError);
        }
      });

      // Send optimized response
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
          hasAllergenConcerns: orderAllergenSummary.hasAllergenConcerns,
          allergenSummary: orderAllergenSummary
        }
      });

    } catch (error) {
      logger.error('Create order error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        });
      }
    }
  }

  // Optimized order retrieval with caching and pagination
  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      // Check if this is an authenticated request (admin)
      const authReq = req as AuthRequest;
      let restaurantId: string;

      if (authReq.user?.restaurantId) {
        // Authenticated admin request - ensure it's a string
        restaurantId = authReq.user.restaurantId.toString().trim();
      } else if (req.params.restaurantId) {
        // Public request with restaurantId in params
        restaurantId = req.params.restaurantId.toString().trim();
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Restaurant ID is required' 
        });
        return;
      }

      const { 
        status, 
        tableId, 
        hasAllergenConcerns,
        page = 1, 
        limit = 50,
        sortBy = 'orderTime',
        sortOrder = 'desc'
      } = req.query;
      // Ensure query uses string comparison
      const query: any = { restaurantId: restaurantId };

      
      if (status) {
        query.status = Array.isArray(status) ? { $in: status } : status;
      }
      
      if (tableId) {
        query.tableId = tableId;
      }
      
      if (hasAllergenConcerns === 'true') {
        query['orderAllergenSummary.hasAllergenConcerns'] = true;
      }

      // Debug: Check what's in the database
      const allOrdersCount = await Order.countDocuments({});
      const restaurantOrdersCount = await Order.countDocuments({ restaurantId });
      const sampleOrders = await Order.find({}).limit(3).select('restaurantId').lean();
      

      // Simplified aggregation pipeline that avoids the $substr issue
      const pipeline = [
        { $match: query },
        { $sort: { [sortBy as string]: sortOrder === 'desc' ? -1 as const : 1 as const } },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
        {
          $addFields: {
            hasAllergenConcerns: '$orderAllergenSummary.hasAllergenConcerns'
            // Remove the problematic orderNumber field for now
          }
        }
      ];

      const [orders, total] = await Promise.all([
        Order.aggregate(pipeline),
        Order.countDocuments(query)
      ]);

      // Add orderNumber in JavaScript instead of MongoDB aggregation
      const ordersWithNumbers = orders.map(order => ({
        ...order,
        orderNumber: order._id.toString().slice(-6)
      }));

      console.log(`Found ${ordersWithNumbers.length} orders out of ${total} total for restaurant ${restaurantId}`);

      res.json({
        success: true,
        orders: ordersWithNumbers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve orders' 
      });
    }
  }

  // Optimized individual order retrieval
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400).json({ 
          success: false, 
          error: 'Valid Order ID is required' 
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

      // Enhanced response with optimized data structure
      res.json({
        success: true,
        order: {
          ...order,
          hasAllergenConcerns: order.orderAllergenSummary?.hasAllergenConcerns || false,
          allergenSummary: order.orderAllergenSummary,
          orderNumber: order._id.toString().slice(-6),
          estimatedReadyTime: order.estimatedPrepTime ? 
            new Date(order.orderTime.getTime() + order.estimatedPrepTime * 60000) : null,
          // Ensure items have proper structure
          items: order.items.map(item => ({
            ...item,
            allergenPreferences: {
              avoidAllergens: item.allergenPreferences?.avoidAllergens?.filter(a => a?.trim()) || [],
              specialInstructions: item.allergenPreferences?.specialInstructions?.trim() || '',
              dietaryPreferences: item.allergenPreferences?.dietaryPreferences?.filter(p => p?.trim()) || []
            },
            originalAllergens: item.originalAllergens || [],
            selectedCustomizations: item.selectedCustomizations || []
          }))
        }
      });

    } catch (error) {
      logger.error('Get order by ID error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve order' 
      });
    }
  }

  // Optimized order status update with better transaction handling
  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { status, kitchenNotes } = req.body;

      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400).json({ 
          success: false, 
          error: 'Valid Order ID is required' 
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

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid status value' 
        });
        return;
      }

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

      if (status === 'confirmed') {
        updateData.confirmedAt = new Date();
      }

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      if (kitchenNotes !== undefined) {
        updateData.kitchenNotes = kitchenNotes;
      }

      const order = await Order.findOneAndUpdate(
        { _id: orderId, restaurantId: req.user.restaurantId },
        updateData,
        { new: true }
      );

      if (!order) {
        res.status(404).json({ 
          success: false, 
          error: 'Order not found or access denied' 
        });
        return;
      }

      // Send SMS notifications asynchronously
      setImmediate(async () => {
        try {
          const orderNumber = order._id.toString().slice(-6);
          if (order.customerPhone) {
            switch (status) {
              case 'confirmed':
                await TwilioService.sendOrderConfirmed(order.customerPhone, orderNumber);
                break;
              case 'preparing':
                await TwilioService.sendOrderPreparing(order.customerPhone, orderNumber);
                break;
              case 'ready':
                await TwilioService.sendOrderReady(order.customerPhone, orderNumber, order.tableId);
                break;
              case 'served':
                await TwilioService.sendOrderServed(order.customerPhone, orderNumber);
                break;
              case 'completed':
                await TwilioService.sendOrderCompleted(order.customerPhone, orderNumber);
                break;
              case 'cancelled':
                await TwilioService.sendOrderCancelled(order.customerPhone, orderNumber);
                break;
            }
          }
        } catch (smsError) {
          logger.error('SMS notification error:', smsError);
        }
      });

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        order: {
          id: order._id,
          status: order.status,
          kitchenNotes: order.kitchenNotes,
          updatedAt: order.updatedAt,
          hasAllergenConcerns: order.orderAllergenSummary?.hasAllergenConcerns || false
        }
      });

    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Optimized order statistics
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
          // Add packing request to order
          order.kitchenNotes = `${order.kitchenNotes ? order.kitchenNotes + ' | ' : ''}PACKING REQUESTED`;
          await TwilioService.sendPackingRequest(
            order.restaurantId,
            order.tableId,
            order.customerName || 'Guest',
            orderNumber
          );
          break;

        case 'split_payment':
          // Add split payment request
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
            order.customerName || 'Guest'
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

  static async getAllergenOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required with restaurant access' 
        });
        return;
      }

      const { limit = 50, page = 1 } = req.query;

      const pipeline = [
        { 
          $match: { 
            restaurantId: req.user.restaurantId,
            'orderAllergenSummary.hasAllergenConcerns': true 
          }
        },
        { $sort: { orderTime: -1 as const } },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
        {
          $project: {
            _id: 1,
            tableId: 1,
            customerName: 1,
            status: 1,
            orderTime: 1,
            allergenSummary: '$orderAllergenSummary',
            itemCount: { $size: '$items' },
            orderNumber: { $substr: ['$_id', -6, -1] }
          }
        }
      ];

      const allergenOrders = await Order.aggregate(pipeline);

      res.json({
        success: true,
        orders: allergenOrders
      });

    } catch (error) {
      logger.error('Get allergen orders error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // New method for bulk order operations
  static async bulkUpdateOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { orderIds, updates } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Order IDs array is required' 
        });
        return;
      }

      if (!req.user || !req.user.restaurantId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      const result = await Order.updateMany(
        { 
          _id: { $in: orderIds },
          restaurantId: req.user.restaurantId 
        },
        { 
          ...updates,
          updatedAt: new Date() 
        }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} orders updated successfully`,
        modifiedCount: result.modifiedCount
      });

    } catch (error) {
      logger.error('Bulk update orders error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}
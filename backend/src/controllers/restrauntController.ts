import { Request, Response } from 'express';
import QRCode from 'qrcode';
import Restaurant from '../models/restraunt';
import MenuItem from '../models/menuitem';
import Order from '../models/order';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user: {
    _id: string;
    restaurantId: string;
    role: string;
  };
}

export class RestaurantController {
  static async createRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, address, phone, email, tables } = req.body;

      const restaurant = new Restaurant({
        name,
        address,
        phone,
        email,
        tables: tables || [],
        ownerId: req.user._id,
        settings: {
          acceptsReservations: true,
          allowCashPayment: true,
          allowSplitPayment: true,
          enableReservations: false,
          enableWaitingList: false,
          autoConfirmOrders: false,
          requirePhoneForOrders: true,
          enableOrderNotifications: true,
          enableServerCall: true,
          maxWaitTime: 15,
          operatingHours: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
            wednesday: { open: '09:00', close: '22:00' },
            thursday: { open: '09:00', close: '22:00' },
            friday: { open: '09:00', close: '23:00' },
            saturday: { open: '09:00', close: '23:00' },
            sunday: { open: '10:00', close: '21:00' }
          }
        }
      });

      await restaurant.save();

      // Generate QR codes for tables
      for (let i = 0; i < restaurant.tables.length; i++) {
        const table = restaurant.tables[i];
        const qrCodeUrl = `${process.env.FRONTEND_URL}/table/${restaurant._id}/${table.tableNumber}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
        restaurant.tables[i].qrCode = qrCodeDataUrl;
      }

      await restaurant.save();

      res.status(201).json({
        message: 'Restaurant created successfully',
        restaurant
      });
    } catch (error) {
      logger.error('Create restaurant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMyRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      res.json({ restaurant });
    } catch (error) {
      logger.error('Get restaurant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const updates = req.body;

      const restaurant = await Restaurant.findOneAndUpdate(
        { ownerId: req.user._id },
        updates,
        { new: true }
      );

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      res.json({ restaurant });
    } catch (error) {
      logger.error('Update restaurant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async addTable(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tableNumber, capacity, status = 'available' } = req.body;

      // Validation
      if (!tableNumber || !capacity) {
        res.status(400).json({ error: 'Table number and capacity are required' });
        return;
      }

      if (capacity < 1 || capacity > 20) {
        res.status(400).json({ error: 'Capacity must be between 1 and 20' });
        return;
      }

      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      // Check if table number already exists
      const existingTable = restaurant.tables.find(t => t.tableNumber === tableNumber);
      if (existingTable) {
        res.status(400).json({ error: 'Table number already exists' });
        return;
      }

      // Create new table
      const newTable = {
        tableNumber: tableNumber.trim(),
        capacity: parseInt(capacity),
        status,
        qrCode: '', // Will be generated later
        currentPhase: 'waiting' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      restaurant.tables.push(newTable);
      await restaurant.save();

      // Generate QR code for the table
      const tableUrl = `${window.location.origin}/table/${tableNumber}?restaurant=${restaurant._id}`;
      const qr = require('qrcode');
      const qrCode = await qr.toDataURL(tableUrl);
      
      // Update table with QR code
      const table = restaurant.tables.find(t => t.tableNumber === tableNumber);
      if (table) {
        table.qrCode = qrCode;
        await restaurant.save();
      }

      logger.info(`Table ${tableNumber} added to restaurant ${restaurant._id}`);

      res.status(201).json({
        message: 'Table added successfully',
        table: newTable
      });
    } catch (error) {
      logger.error('Add table error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateTable(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const { tableNumber, status, capacity } = req.body;

      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const table = restaurant.tables.find(t => t.tableNumber === tableId);
      if (!table) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      // If changing table number, check for conflicts
      if (tableNumber && tableNumber !== tableId) {
        const existingTable = restaurant.tables.find(t => t.tableNumber === tableNumber);
        if (existingTable) {
          res.status(400).json({ error: 'Table number already exists' });
          return;
        }
        
        // Update any existing orders with the new table number
        await Order.updateMany(
          { restaurantId: restaurant._id, tableId: tableId },
          { tableId: tableNumber }
        );
        
        table.tableNumber = tableNumber;
      }

      if (status) table.status = status;
      if (capacity) table.capacity = capacity;

      await restaurant.save();

      logger.info(`Table ${tableId} updated successfully`);

      res.json({
        message: 'Table updated successfully',
        table
      });
    } catch (error) {
      logger.error('Update table error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTableQR(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const { restaurantId } = req.query;

      if (!restaurantId) {
        res.status(400).json({ error: 'Restaurant ID required' });
        return;
      }

      const qrCodeUrl = `${process.env.FRONTEND_URL}/table/${restaurantId}/${tableId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

      res.json({
        qrCode: qrCodeDataUrl,
        url: qrCodeUrl
      });
    } catch (error) {
      logger.error('Get table QR error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateRestaurantSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { settings, socialMedia, ...profileData } = req.body;

      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      // Update profile data
      if (profileData.name) restaurant.name = profileData.name;
      if (profileData.description) restaurant.description = profileData.description;
      if (profileData.cuisine) restaurant.cuisine = profileData.cuisine;
      if (profileData.address) restaurant.address = profileData.address;
      if (profileData.phone) restaurant.phone = profileData.phone;
      if (profileData.email) restaurant.email = profileData.email;
      if (profileData.website) restaurant.website = profileData.website;
      if (profileData.priceRange) restaurant.priceRange = profileData.priceRange;

      // Update social media
      if (socialMedia) {
        restaurant.socialMedia = {
          facebook: socialMedia.facebook || '',
          instagram: socialMedia.instagram || '',
          twitter: socialMedia.twitter || ''
        };
      }

      // Update settings
      if (settings) {
        restaurant.settings = {
          ...restaurant.settings,
          allowCashPayment: settings.allowCashPayment ?? restaurant.settings.allowCashPayment,
          allowSplitPayment: settings.allowSplitPayment ?? restaurant.settings.allowSplitPayment,
          enableReservations: settings.enableReservations ?? restaurant.settings.enableReservations,
          enableWaitingList: settings.enableWaitingList ?? restaurant.settings.enableWaitingList,
          autoConfirmOrders: settings.autoConfirmOrders ?? restaurant.settings.autoConfirmOrders,
          requirePhoneForOrders: settings.requirePhoneForOrders ?? restaurant.settings.requirePhoneForOrders,
          enableOrderNotifications: settings.enableOrderNotifications ?? restaurant.settings.enableOrderNotifications,
          maxWaitTime: settings.maxWaitTime ?? restaurant.settings.maxWaitTime,
          operatingHours: settings.operatingHours ?? restaurant.settings.operatingHours
        };
      }

      await restaurant.save();

      res.json({
        message: 'Restaurant updated successfully',
        restaurant
      });
    } catch (error) {
      logger.error('Update restaurant settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async resetRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { resetType } = req.body; // 'tables', 'menu', 'orders', 'all'

      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const restaurantId = restaurant._id;

      switch (resetType) {
        case 'tables':
          // Clear all tables
          restaurant.tables = [];
          await restaurant.save();
          logger.info(`All tables cleared for restaurant ${restaurantId}`);
          break;

        case 'menu':
          // Delete all menu items
          await MenuItem.deleteMany({ restaurantId });
          logger.info(`All menu items deleted for restaurant ${restaurantId}`);
          break;

        case 'orders':
          // Delete all orders
          await Order.deleteMany({ restaurantId });
          // Reset table statuses
          restaurant.tables.forEach(table => {
            table.status = 'available';
            table.currentOrderId = undefined;
            table.currentPhase = 'waiting';
          });
          await restaurant.save();
          logger.info(`All orders cleared for restaurant ${restaurantId}`);
          break;

        case 'all':
          // Clear everything
          restaurant.tables = [];
          await MenuItem.deleteMany({ restaurantId });
          await Order.deleteMany({ restaurantId });
          await restaurant.save();
          logger.info(`Complete reset performed for restaurant ${restaurantId}`);
          break;

        default:
          res.status(400).json({ error: 'Invalid reset type' });
          return;
      }

      res.json({
        message: `Restaurant ${resetType} cleared successfully`,
        restaurant
      });
    } catch (error) {
      logger.error('Reset restaurant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRestaurantStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const restaurantId = restaurant._id;

      // Get counts
      const menuItemsCount = await MenuItem.countDocuments({ restaurantId });
      const totalOrdersCount = await Order.countDocuments({ restaurantId });
      const activeOrdersCount = await Order.countDocuments({ 
        restaurantId, 
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
      });

      // Get revenue stats
      const revenueResult = await Order.aggregate([
        { $match: { restaurantId: restaurantId, status: 'served' } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
      ]);

      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

      res.json({
        stats: {
          tablesCount: restaurant.tables.length,
          menuItemsCount,
          totalOrdersCount,
          activeOrdersCount,
          totalRevenue
        }
      });
    } catch (error) {
      logger.error('Get restaurant stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteTable(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;

      const restaurant = await Restaurant.findOne({
        $or: [
          { ownerId: req.user._id },
          { _id: req.user.restaurantId }
        ]
      });

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const tableIndex = restaurant.tables.findIndex(t => t.tableNumber === tableId);
      if (tableIndex === -1) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      const table = restaurant.tables[tableIndex];

      // Check if table has active orders
      const activeOrders = await Order.countDocuments({
        restaurantId: restaurant._id,
        tableId: table.tableNumber,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
      });

      if (activeOrders > 0) {
        res.status(400).json({ 
          error: 'Cannot delete table with active orders',
          message: 'Please complete or cancel all active orders before deleting this table.'
        });
        return;
      }

      // Remove the table
      restaurant.tables.splice(tableIndex, 1);
      await restaurant.save();

      logger.info(`Table ${tableId} deleted from restaurant ${restaurant._id}`);

      res.json({
        message: 'Table deleted successfully',
        tableNumber: tableId
      });
    } catch (error) {
      logger.error('Delete table error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

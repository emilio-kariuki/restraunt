import { Request, Response } from 'express';
import QRCode from 'qrcode';
import Restaurant from '../models/restraunt';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
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
      const { tableNumber, capacity } = req.body;

      const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
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

      // Generate QR code for the table
      const qrCodeUrl = `${process.env.FRONTEND_URL}/table/${restaurant._id}/${tableNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

      const newTable = {
        tableNumber,
        capacity,
        status: 'available' as const,
        qrCode: qrCodeDataUrl
      };

      restaurant.tables.push(newTable);
      await restaurant.save();

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
      const { status, capacity } = req.body;

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

      if (status) table.status = status;
      if (capacity) table.capacity = capacity;

      await restaurant.save();

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
}

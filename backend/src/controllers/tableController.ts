import { Request, Response } from 'express';
import Restaurant from '../models/restraunt';
import MenuItem from '../models/menuitem';
import Order from '../models/order';
import logger from '../utils/logger';

export class TableController {
  static async getTableInfo(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, tableId } = req.params;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const table = restaurant.tables.find(t => t.tableNumber === tableId);
      if (!table) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      // Check if restaurant is currently open
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase(); // mon, tue, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const todayHours = restaurant.settings.operatingHours[currentDay];
      const isOpen = todayHours && !todayHours.closed && 
                    currentTime >= todayHours.open && 
                    currentTime <= todayHours.close;

      res.json({
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          address: restaurant.address,
          phone: restaurant.phone,
          isOpen,
          operatingHours: restaurant.settings.operatingHours
        },
        table: {
          number: table.tableNumber,
          capacity: table.capacity,
          status: table.status,
          available: table.status !== 'cleaning'
        }
      });
    } catch (error) {
      logger.error('Get table info error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTableMenu(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, tableId } = req.params;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const table = restaurant.tables.find(t => t.tableNumber === tableId);
      if (!table) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      if (table.status === 'cleaning') {
        res.status(400).json({ 
          error: 'Table is currently being cleaned',
          message: 'Please wait for staff to clean the table before ordering'
        });
        return;
      }

      // Get available menu items
      const menuItems = await MenuItem.find({ 
        restaurantId, 
        available: true 
      }).sort({ category: 1, name: 1 });

      // Group by category
      const menu = menuItems.reduce((acc: any, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          allergens: item.allergens
        });
        return acc;
      }, {});

      // Get any active orders for this table
      const activeOrders = await Order.find({
        restaurantId,
        tableId,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
      }).sort({ createdAt: -1 });

      res.json({ 
        restaurant: {
          name: restaurant.name,
          phone: restaurant.phone
        },
        table: {
          number: table.tableNumber,
          capacity: table.capacity
        },
        menu,
        activeOrders: activeOrders.map(order => ({
          id: order._id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt
        }))
      });
    } catch (error) {
      logger.error('Get table menu error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTableStatus(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, tableId } = req.params;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const table = restaurant.tables.find(t => t.tableNumber === tableId);
      if (!table) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      // Get current orders for this table
      const currentOrders = await Order.find({
        restaurantId,
        tableId,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
      }).sort({ createdAt: -1 });

      // Calculate estimated wait time based on current kitchen load
      const totalPendingOrders = await Order.countDocuments({
        restaurantId,
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      });

      let estimatedWaitTime = 'Ready to order';
      if (totalPendingOrders > 10) {
        estimatedWaitTime = '25-35 minutes';
      } else if (totalPendingOrders > 5) {
        estimatedWaitTime = '15-25 minutes';
      } else if (totalPendingOrders > 0) {
        estimatedWaitTime = '10-20 minutes';
      }

      res.json({
        table: {
          number: table.tableNumber,
          status: table.status,
          available: table.status !== 'cleaning'
        },
        currentOrders: currentOrders.map(order => ({
          id: order._id,
          status: order.status,
          total: order.total,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: order.createdAt
        })),
        kitchenStatus: {
          estimatedWaitTime,
          ordersInQueue: totalPendingOrders
        }
      });
    } catch (error) {
      logger.error('Get table status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
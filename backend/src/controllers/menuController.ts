import { Request, Response } from 'express';
import MenuItem from '../models/menuitem';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: any;
}

export class MenuController {
  static async getMenu(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      
      const menuItems = await MenuItem.find({ 
        restaurantId, 
        available: true 
      }).sort({ category: 1, name: 1 });

      // Group by category
      const menu = menuItems.reduce((acc: any, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});

      res.json({ menu });
    } catch (error) {
      logger.error('Get menu error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createMenuItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description, price, category, image, allergens } = req.body;
      const restaurantId = req.user.restaurantId;

      if (!restaurantId) {
        res.status(400).json({ error: 'Restaurant ID required' });
        return;
      }

      const menuItem = new MenuItem({
        restaurantId,
        name,
        description,
        price,
        category,
        image,
        allergens
      });

      await menuItem.save();

      res.status(201).json({
        message: 'Menu item created successfully',
        menuItem
      });
    } catch (error) {
      logger.error('Create menu item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateMenuItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const menuItem = await MenuItem.findOneAndUpdate(
        { _id: id, restaurantId: req.user.restaurantId },
        updates,
        { new: true }
      );

      if (!menuItem) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      res.json({ menuItem });
    } catch (error) {
      logger.error('Update menu item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteMenuItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const menuItem = await MenuItem.findOneAndDelete({
        _id: id,
        restaurantId: req.user.restaurantId
      });

      if (!menuItem) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
      logger.error('Delete menu item error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
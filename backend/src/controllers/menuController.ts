import { Request, Response } from 'express';
import MenuItem from '../models/menuitem';
import Restaurant from '../models/restraunt';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    restaurantId?: string;
  };
}

export class MenuController {
  // Get menu for a restaurant (public endpoint)
  static async getMenu(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      
      // Validate restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ 
          success: false, 
          error: 'Restaurant not found' 
        });
        return;
      }

      // Get all menu items for the restaurant
      const menuItems = await MenuItem.find({ 
        restaurantId 
      }).sort({ category: 1, name: 1 });

      // Group by category for organized display
      const categorizedMenu = menuItems.reduce((acc: any, item) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          available: item.available,
          allergens: item.allergens || [],
          allergenNotes: item.allergenNotes || '',
          dietaryInfo: item.dietaryInfo || [],
          customizations: item.customizations || [],
          isVegetarian: item.isVegetarian,
          isSpicy: item.isSpicy,
          preparationTime: item.preparationTime,
          calories: item.calories
        });
        return acc;
      }, {});

      // Also return items as a flat array for easier frontend handling
      const items = menuItems.map(item => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        available: item.available,
        allergens: item.allergens || [],
        allergenNotes: item.allergenNotes || '',
        dietaryInfo: item.dietaryInfo || [],
        customizations: item.customizations || [],
        isVegetarian: item.isVegetarian,
        isSpicy: item.isSpicy,
        preparationTime: item.preparationTime,
        calories: item.calories,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      res.json({ 
        success: true,
        menu: categorizedMenu,
        items: items,
        totalItems: items.length,
        categories: Object.keys(categorizedMenu),
        restaurant: {
          name: restaurant.name,
          id: restaurant._id
        }
      });
    } catch (error) {
      logger.error('Get menu error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Create new menu item (admin/staff only)
  static async createMenuItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { 
        name, 
        description, 
        price, 
        category, 
        image, 
        allergens,
        allergenNotes,
        dietaryInfo,
        available,
        customizations,
        isVegetarian,
        isSpicy,
        preparationTime,
        calories,
        restaurantId
      } = req.body;

      // Determine restaurant ID
      let targetRestaurantId = restaurantId || req.user?.restaurantId;

      // If no restaurant ID provided, try to get from user's restaurant
      if (!targetRestaurantId && req.user) {
        const userRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
        if (userRestaurant) {
          targetRestaurantId = userRestaurant._id.toString();
        }
      }

      if (!targetRestaurantId) {
        res.status(400).json({ 
          success: false, 
          error: 'Restaurant ID required' 
        });
        return;
      }

      // Validate restaurant exists and user has access
      const restaurant = await Restaurant.findById(targetRestaurantId);
      if (!restaurant) {
        res.status(404).json({ 
          success: false, 
          error: 'Restaurant not found' 
        });
        return;
      }

      // Check if user has permission to add items to this restaurant
      if (req.user?.role !== 'superadmin' && 
          restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
          req.user?.restaurantId !== targetRestaurantId) {
        res.status(403).json({ 
          success: false, 
          error: 'Not authorized to add items to this restaurant' 
        });
        return;
      }

      // Validate required fields
      if (!name?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Item name is required' 
        });
        return;
      }

      if (!description?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Description is required' 
        });
        return;
      }

      if (typeof price !== 'number' || price < 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Valid price is required' 
        });
        return;
      }

      if (!category?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Category is required' 
        });
        return;
      }

      // Validate customizations if provided
      if (customizations && Array.isArray(customizations)) {
        for (const custom of customizations) {
          if (!custom.id || !custom.name?.trim()) {
            res.status(400).json({ 
              success: false, 
              error: 'All customizations must have an ID and name' 
            });
            return;
          }

          if (!['radio', 'checkbox', 'select'].includes(custom.type)) {
            res.status(400).json({ 
              success: false, 
              error: 'Invalid customization type' 
            });
            return;
          }

          if (!custom.options || !Array.isArray(custom.options) || custom.options.length === 0) {
            res.status(400).json({ 
              success: false, 
              error: `Customization "${custom.name}" must have at least one option` 
            });
            return;
          }

          for (const option of custom.options) {
            if (!option.name?.trim()) {
              res.status(400).json({ 
                success: false, 
                error: `All options in "${custom.name}" must have a name` 
              });
              return;
            }

            if (typeof option.price !== 'number' || option.price < 0) {
              res.status(400).json({ 
                success: false, 
                error: `Invalid price for option "${option.name}"` 
              });
              return;
            }
          }
        }
      }

      // Create menu item
      const menuItem = new MenuItem({
        restaurantId: targetRestaurantId,
        name: name.trim(),
        description: description.trim(),
        price,
        category: category.trim().toLowerCase(),
        image: image?.trim() || '',
        available: available !== false,
        allergens: Array.isArray(allergens) ? allergens.map((a: string) => a.trim()).filter(Boolean) : [],
        allergenNotes: allergenNotes?.trim() || '',
        dietaryInfo: Array.isArray(dietaryInfo) ? dietaryInfo.map((d: string) => d.trim()).filter(Boolean) : [],
        customizations: customizations || [],
        isVegetarian: Boolean(isVegetarian),
        isSpicy: Boolean(isSpicy),
        preparationTime: preparationTime || undefined,
        calories: calories || undefined
      });

      await menuItem.save();

      logger.info(`Menu item "${name}" created for restaurant ${targetRestaurantId} by user ${req.user?._id}`);

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        menuItem: {
          _id: menuItem._id,
          name: menuItem.name,
          description: menuItem.description,
          price: menuItem.price,
          category: menuItem.category,
          image: menuItem.image,
          available: menuItem.available,
          allergens: menuItem.allergens,
          allergenNotes: menuItem.allergenNotes,
          dietaryInfo: menuItem.dietaryInfo,
          customizations: menuItem.customizations,
          createdAt: menuItem.createdAt,
          updatedAt: menuItem.updatedAt
        }
      });
    } catch (error) {
      logger.error('Create menu item error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Update menu item (admin/staff only)
  static async updateMenuItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find the menu item first
      const existingMenuItem = await MenuItem.findById(id);
      if (!existingMenuItem) {
        res.status(404).json({ 
          success: false, 
          error: 'Menu item not found' 
        });
        return;
      }

      // Check if user has permission to update this item
      const restaurant = await Restaurant.findById(existingMenuItem.restaurantId);
      if (!restaurant) {
        res.status(404).json({ 
          success: false, 
          error: 'Restaurant not found' 
        });
        return;
      }

      if (req.user?.role !== 'superadmin' && 
          restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
          req.user?.restaurantId !== existingMenuItem.restaurantId) {
        res.status(403).json({ 
          success: false, 
          error: 'Not authorized to update this menu item' 
        });
        return;
      }

      // Validate updates
      if (updates.name !== undefined && !updates.name?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Item name cannot be empty' 
        });
        return;
      }

      if (updates.description !== undefined && !updates.description?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Description cannot be empty' 
        });
        return;
      }

      if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price < 0)) {
        res.status(400).json({ 
          success: false, 
          error: 'Valid price is required' 
        });
        return;
      }

      if (updates.category !== undefined && !updates.category?.trim()) {
        res.status(400).json({ 
          success: false, 
          error: 'Category cannot be empty' 
        });
        return;
      }

      // Prepare clean updates
      const cleanUpdates: any = {};
      
      if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
      if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
      if (updates.price !== undefined) cleanUpdates.price = updates.price;
      if (updates.category !== undefined) cleanUpdates.category = updates.category.trim().toLowerCase();
      if (updates.image !== undefined) cleanUpdates.image = updates.image?.trim() || '';
      if (updates.available !== undefined) cleanUpdates.available = Boolean(updates.available);
      
      if (updates.allergens !== undefined) {
        cleanUpdates.allergens = Array.isArray(updates.allergens) 
          ? updates.allergens.map((a: string) => a.trim()).filter(Boolean) 
          : [];
      }
      
      if (updates.allergenNotes !== undefined) {
        cleanUpdates.allergenNotes = updates.allergenNotes?.trim() || '';
      }
      
      if (updates.dietaryInfo !== undefined) {
        cleanUpdates.dietaryInfo = Array.isArray(updates.dietaryInfo) 
          ? updates.dietaryInfo.map((d: string) => d.trim()).filter(Boolean) 
          : [];
      }
      
      if (updates.customizations !== undefined) {
        cleanUpdates.customizations = updates.customizations || [];
      }
      
      if (updates.isVegetarian !== undefined) cleanUpdates.isVegetarian = Boolean(updates.isVegetarian);
      if (updates.isSpicy !== undefined) cleanUpdates.isSpicy = Boolean(updates.isSpicy);
      if (updates.preparationTime !== undefined) cleanUpdates.preparationTime = updates.preparationTime;
      if (updates.calories !== undefined) cleanUpdates.calories = updates.calories;

      cleanUpdates.updatedAt = new Date();

      const menuItem = await MenuItem.findByIdAndUpdate(
        id,
        cleanUpdates,
        { new: true, runValidators: true }
      );

      logger.info(`Menu item ${id} updated by user ${req.user?._id}`);

      res.json({
        success: true,
        message: 'Menu item updated successfully',
        menuItem
      });
    } catch (error) {
      logger.error('Update menu item error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Delete menu item (admin/staff only)
  static async deleteMenuItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Find the menu item first
      const existingMenuItem = await MenuItem.findById(id);
      if (!existingMenuItem) {
        res.status(404).json({ 
          success: false, 
          error: 'Menu item not found' 
        });
        return;
      }

      // Check if user has permission to delete this item
      const restaurant = await Restaurant.findById(existingMenuItem.restaurantId);
      if (!restaurant) {
        res.status(404).json({ 
          success: false, 
          error: 'Restaurant not found' 
        });
        return;
      }

      if (req.user?.role !== 'superadmin' && 
          restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
          req.user?.restaurantId !== existingMenuItem.restaurantId) {
        res.status(403).json({ 
          success: false, 
          error: 'Not authorized to delete this menu item' 
        });
        return;
      }

      await MenuItem.findByIdAndDelete(id);

      logger.info(`Menu item ${id} deleted by user ${req.user?._id}`);

      res.json({ 
        success: true, 
        message: 'Menu item deleted successfully' 
      });
    } catch (error) {
      logger.error('Delete menu item error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Get menu categories for a restaurant
  static async getMenuCategories(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;

      const categories = await MenuItem.aggregate([
        { $match: { restaurantId } },
        { 
          $group: { 
            _id: '$category',
            itemCount: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            availableItems: { 
              $sum: { $cond: ['$available', 1, 0] } 
            }
          } 
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        success: true,
        categories: categories.map(cat => ({
          name: cat._id,
          itemCount: cat.itemCount,
          averagePrice: Math.round(cat.averagePrice * 100) / 100,
          availableItems: cat.availableItems
        }))
      });
    } catch (error) {
      logger.error('Get menu categories error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Toggle menu item availability
  static async toggleAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { available } = req.body;

      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        res.status(404).json({ 
          success: false, 
          error: 'Menu item not found' 
        });
        return;
      }

      // Check permissions
      const restaurant = await Restaurant.findById(menuItem.restaurantId);
      if (!restaurant) {
        res.status(404).json({ 
          success: false, 
          error: 'Restaurant not found' 
        });
        return;
      }

      if (req.user?.role !== 'superadmin' && 
          restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
          req.user?.restaurantId !== menuItem.restaurantId) {
        res.status(403).json({ 
          success: false, 
          error: 'Not authorized' 
        });
        return;
      }

      menuItem.available = Boolean(available);
      menuItem.updatedAt = new Date();
      await menuItem.save();

      res.json({
        success: true,
        message: `Menu item ${available ? 'enabled' : 'disabled'}`,
        menuItem
      });
    } catch (error) {
      logger.error('Toggle availability error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Get menu statistics
  static async getMenuStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;

      const stats = await MenuItem.aggregate([
        { $match: { restaurantId } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            availableItems: { $sum: { $cond: ['$available', 1, 0] } },
            avgPrice: { $avg: '$price' },
            maxPrice: { $max: '$price' },
            minPrice: { $min: '$price' },
            categoriesCount: { $addToSet: '$category' }
          }
        }
      ]);

      const result = stats[0] || {
        totalItems: 0,
        availableItems: 0,
        avgPrice: 0,
        maxPrice: 0,
        minPrice: 0,
        categoriesCount: []
      };

      res.json({
        success: true,
        stats: {
          totalItems: result.totalItems,
          availableItems: result.availableItems,
          unavailableItems: result.totalItems - result.availableItems,
          averagePrice: Math.round(result.avgPrice * 100) / 100,
          priceRange: {
            min: result.minPrice,
            max: result.maxPrice
          },
          totalCategories: result.categoriesCount.length
        }
      });
    } catch (error) {
      logger.error('Get menu stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}
import { Request, Response } from 'express';
import MenuItem from '../models/menuitem';
import Restaurant from '../models/restraunt';
import logger from '../utils/logger';
import * as csv from 'csv-parse';
import * as XLSX from 'xlsx';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
    restaurantId?: string;
  };
  file?: Express.Multer.File;
}

// Helper function to parse CSV files
async function parseCSVFile(buffer: Buffer, mapping?: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', function() {
      let record: any;
      while (record = parser.read()) {
        // Apply column mapping if provided
        if (mapping) {
          const mappedRecord: any = {};
          Object.keys(mapping).forEach(key => {
            if (mapping[key] && record[mapping[key]]) {
              mappedRecord[key] = record[mapping[key]];
            }
          });
          results.push(mappedRecord);
        } else {
          // Convert string values to appropriate types
          const processedRecord = {
            name: record.name || record.Name,
            description: record.description || record.Description,
            price: parseFloat(record.price || record.Price) || 0,
            category: record.category || record.Category,
            allergens: record.allergens ? record.allergens.split(',').map((a: string) => a.trim()) : [],
            allergenNotes: record.allergenNotes || record['Allergen Notes'] || '',
            dietaryInfo: record.dietaryInfo ? record.dietaryInfo.split(',').map((d: string) => d.trim()) : [],
            available: record.available !== 'false' && record.available !== '0',
            isVegetarian: record.isVegetarian === 'true' || record.isVegetarian === '1',
            isSpicy: record.isSpicy === 'true' || record.isSpicy === '1',
            preparationTime: parseInt(record.preparationTime) || undefined,
            calories: parseInt(record.calories) || undefined
          };
          results.push(processedRecord);
        }
      }
    });

    parser.on('error', (err) => {
      reject(err);
    });

    parser.on('end', () => {
      resolve(results);
    });

    parser.write(buffer);
    parser.end();
  });
}

// Helper function to parse Excel files
async function parseExcelFile(buffer: Buffer, mapping?: any): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData.map((record: any) => {
      if (mapping) {
        const mappedRecord: any = {};
        Object.keys(mapping).forEach(key => {
          if (mapping[key] && record[mapping[key]]) {
            mappedRecord[key] = record[mapping[key]];
          }
        });
        return mappedRecord;
      } else {
        return {
          name: record.name || record.Name,
          description: record.description || record.Description,
          price: parseFloat(record.price || record.Price) || 0,
          category: record.category || record.Category,
          allergens: record.allergens ? String(record.allergens).split(',').map((a: string) => a.trim()) : [],
          allergenNotes: record.allergenNotes || record['Allergen Notes'] || '',
          dietaryInfo: record.dietaryInfo ? String(record.dietaryInfo).split(',').map((d: string) => d.trim()) : [],
          available: record.available !== 'false' && record.available !== '0',
          isVegetarian: record.isVegetarian === 'true' || record.isVegetarian === '1',
          isSpicy: record.isSpicy === 'true' || record.isSpicy === '1',
          preparationTime: parseInt(record.preparationTime) || undefined,
          calories: parseInt(record.calories) || undefined
        };
      }
    });
  } catch (error) {
    throw new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => escapeCsvValue(row[header])).join(',')
    )
  ].join('\n');

  return csvContent;
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

  // Bulk upload menu items
  static async bulkUploadMenu(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { items, options } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Items array is required and cannot be empty'
        });
        return;
      }

      // Determine restaurant ID
      let targetRestaurantId = options?.restaurantId || req.user?.restaurantId;

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

      if (req.user?.role !== 'superadmin' && 
          restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
          req.user?.restaurantId !== targetRestaurantId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
        return;
      }

      const results = {
        total: items.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
        created: [] as any[],
        updated: [] as any[]
      };

      // If validate only, just check the items without saving
      if (options?.validateOnly) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            // Validate required fields
            if (!item.name?.trim()) {
              results.errors.push(`Item ${i + 1}: Name is required`);
              results.failed++;
              continue;
            }
            if (!item.description?.trim()) {
              results.errors.push(`Item ${i + 1}: Description is required`);
              results.failed++;
              continue;
            }
            if (typeof item.price !== 'number' || item.price < 0) {
              results.errors.push(`Item ${i + 1}: Valid price is required`);
              results.failed++;
              continue;
            }
            if (!item.category?.trim()) {
              results.errors.push(`Item ${i + 1}: Category is required`);
              results.failed++;
              continue;
            }
            results.successful++;
          } catch (error) {
            results.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Validation error'}`);
            results.failed++;
          }
        }

        res.json({
          success: true,
          message: 'Validation completed',
          results
        });
        return;
      }

      // Process each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          // Check if item already exists
          const existingItem = await MenuItem.findOne({
            restaurantId: targetRestaurantId,
            name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') }
          });

          if (existingItem) {
            if (options?.skipDuplicates) {
              results.skipped++;
              continue;
            } else if (options?.overwrite) {
              // Update existing item
              const updatedItem = await MenuItem.findByIdAndUpdate(
                existingItem._id,
                {
                  ...item,
                  restaurantId: targetRestaurantId,
                  updatedAt: new Date()
                },
                { new: true, runValidators: true }
              );
              results.updated.push(updatedItem);
              results.successful++;
              continue;
            } else {
              results.errors.push(`Item ${i + 1}: "${item.name}" already exists`);
              results.failed++;
              continue;
            }
          }

          // Create new item
          const menuItem = new MenuItem({
            ...item,
            restaurantId: targetRestaurantId,
            name: item.name.trim(),
            description: item.description.trim(),
            category: item.category.trim().toLowerCase(),
            available: item.available !== false,
            allergens: Array.isArray(item.allergens) ? item.allergens.filter(Boolean) : [],
            allergenNotes: item.allergenNotes?.trim() || '',
            dietaryInfo: Array.isArray(item.dietaryInfo) ? item.dietaryInfo.filter(Boolean) : [],
            customizations: item.customizations || [],
            isVegetarian: Boolean(item.isVegetarian),
            isSpicy: Boolean(item.isSpicy)
          });

          const savedItem = await menuItem.save();
          results.created.push(savedItem);
          results.successful++;

        } catch (error) {
          results.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      logger.info(`Bulk upload completed for restaurant ${targetRestaurantId}: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);

      res.json({
        success: results.failed === 0 || results.successful > 0,
        message: `Bulk upload completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
        results
      });

    } catch (error) {
      logger.error('Bulk upload menu error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Upload menu from file (CSV/Excel)
  static async uploadMenuFromFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'File is required'
        });
        return;
      }

      const file = req.file;
      const options = {
        restaurantId: req.body.restaurantId,
        overwrite: req.body.overwrite === 'true',
        skipDuplicates: req.body.skipDuplicates !== 'false',
        validateOnly: req.body.validateOnly === 'true',
        mapping: req.body.mapping ? JSON.parse(req.body.mapping) : undefined
      };

      let menuItems: any[] = [];

      // Parse file based on type
      if (file.mimetype === 'text/csv') {
        menuItems = await parseCSVFile(file.buffer, options.mapping);
      } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
        menuItems = await parseExcelFile(file.buffer, options.mapping);
      } else if (file.mimetype === 'application/json') {
        menuItems = JSON.parse(file.buffer.toString());
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported file format'
        });
        return;
      }

      // Process the parsed items using the existing bulk upload logic
      req.body = { items: menuItems, options };
      await MenuController.bulkUploadMenu(req, res);

    } catch (error) {
      logger.error('Upload menu from file error:', error);
      res.status(500).json({
        success: false,
        error: 'File processing failed'
      });
    }
  }

  // Get bulk upload template
  static async getBulkUploadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as string || 'csv';
      
      const templateData = [
        {
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
          price: 12.99,
          category: 'pizza',
          allergens: 'Gluten, Dairy',
          allergenNotes: 'Contains wheat flour and dairy products',
          dietaryInfo: 'Vegetarian',
          available: true,
          isVegetarian: true,
          isSpicy: false,
          preparationTime: 15,
          calories: 320
        },
        {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan',
          price: 8.99,
          category: 'salads',
          allergens: 'Dairy, Eggs',
          allergenNotes: 'Contains dairy and egg products',
          dietaryInfo: 'Vegetarian',
          available: true,
          isVegetarian: true,
          isSpicy: false,
          preparationTime: 8,
          calories: 250
        }
      ];

      if (format === 'csv') {
        const csv = convertToCSV(templateData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=menu-template.csv');
        res.send(csv);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=menu-template.json');
        res.json(templateData);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported format'
        });
      }

    } catch (error) {
      logger.error('Get bulk upload template error:', error);
      res.status(500).json({
        success: false,
        error: 'Template generation failed'
      });
    }
  }

  // Validate bulk menu items
  static async validateBulkMenu(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Items array is required'
        });
        return;
      }

      const validationResults = {
        total: items.length,
        valid: 0,
        invalid: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item.name?.trim()) {
          validationResults.errors.push(`Item ${i + 1}: Name is required`);
          validationResults.invalid++;
          continue;
        }
        
        if (!item.description?.trim()) {
          validationResults.errors.push(`Item ${i + 1}: Description is required`);
          validationResults.invalid++;
          continue;
        }
        
        if (typeof item.price !== 'number' || item.price < 0) {
          validationResults.errors.push(`Item ${i + 1}: Valid price is required`);
          validationResults.invalid++;
          continue;
        }
        
        if (!item.category?.trim()) {
          validationResults.errors.push(`Item ${i + 1}: Category is required`);
          validationResults.invalid++;
          continue;
        }

        validationResults.valid++;
      }

      res.json({
        success: true,
        message: 'Validation completed',
        results: validationResults
      });

    } catch (error) {
      logger.error('Validate bulk menu error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation failed'
      });
    }
  }

  // Bulk update menu items
  static async bulkUpdateMenu(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Updates array is required'
        });
        return;
      }

      const results = {
        total: updates.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < updates.length; i++) {
        const { id, updates: itemUpdates } = updates[i];
        
        try {
          if (!id) {
            results.errors.push(`Update ${i + 1}: Item ID is required`);
            results.failed++;
            continue;
          }

          const existingItem = await MenuItem.findById(id);
          if (!existingItem) {
            results.errors.push(`Update ${i + 1}: Item not found`);
            results.failed++;
            continue;
          }

          // Check permissions
          const restaurant = await Restaurant.findById(existingItem.restaurantId);
          if (!restaurant) {
            results.errors.push(`Update ${i + 1}: Restaurant not found`);
            results.failed++;
            continue;
          }

          if (req.user?.role !== 'superadmin' && 
              restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
              req.user?.restaurantId !== existingItem.restaurantId) {
            results.errors.push(`Update ${i + 1}: Not authorized`);
            results.failed++;
            continue;
          }

          // Prepare clean updates
          const cleanUpdates: any = { updatedAt: new Date() };
          
          if (itemUpdates.name !== undefined) cleanUpdates.name = itemUpdates.name.trim();
          if (itemUpdates.description !== undefined) cleanUpdates.description = itemUpdates.description.trim();
          if (itemUpdates.price !== undefined) cleanUpdates.price = itemUpdates.price;
          if (itemUpdates.category !== undefined) cleanUpdates.category = itemUpdates.category.trim().toLowerCase();
          if (itemUpdates.available !== undefined) cleanUpdates.available = Boolean(itemUpdates.available);
          if (itemUpdates.allergens !== undefined) cleanUpdates.allergens = itemUpdates.allergens;
          if (itemUpdates.dietaryInfo !== undefined) cleanUpdates.dietaryInfo = itemUpdates.dietaryInfo;

          await MenuItem.findByIdAndUpdate(id, cleanUpdates, { runValidators: true });
          results.successful++;

        } catch (error) {
          results.errors.push(`Update ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      res.json({
        success: results.failed === 0,
        message: `Bulk update completed: ${results.successful} successful, ${results.failed} failed`,
        results
      });

    } catch (error) {
      logger.error('Bulk update menu error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Bulk delete menu items
  static async bulkDeleteMenu(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemIds } = req.body;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Item IDs array is required'
        });
        return;
      }

      const results = {
        total: itemIds.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < itemIds.length; i++) {
        const id = itemIds[i];
        
        try {
          const existingItem = await MenuItem.findById(id);
          if (!existingItem) {
            results.errors.push(`Item ${i + 1}: Not found`);
            results.failed++;
            continue;
          }

          // Check permissions
          const restaurant = await Restaurant.findById(existingItem.restaurantId);
          if (!restaurant) {
            results.errors.push(`Item ${i + 1}: Restaurant not found`);
            results.failed++;
            continue;
          }

          if (req.user?.role !== 'superadmin' && 
              restaurant.ownerId?.toString() !== req.user?._id?.toString() && 
              req.user?.restaurantId !== existingItem.restaurantId) {
            results.errors.push(`Item ${i + 1}: Not authorized`);
            results.failed++;
            continue;
          }

          await MenuItem.findByIdAndDelete(id);
          results.successful++;

        } catch (error) {
          results.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.failed++;
        }
      }

      res.json({
        success: results.failed === 0,
        message: `Bulk delete completed: ${results.successful} successful, ${results.failed} failed`,
        results
      });

    } catch (error) {
      logger.error('Bulk delete menu error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Export menu items (CSV/JSON/Excel)
  static async exportMenu(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'csv', restaurantId } = req.query;

      if (!restaurantId) {
        res.status(400).json({
          success: false,
          error: 'Restaurant ID is required'
        });
        return;
      }

      // Fetch all menu items for the restaurant
      const menuItems = await MenuItem.find({ 
        restaurantId: restaurantId as string 
      }).sort({ category: 1, name: 1 });

      if (menuItems.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No menu items found'
        });
        return;
      }

      // Transform data for export
      const exportData = menuItems.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : '',
        allergenNotes: item.allergenNotes || '',
        dietaryInfo: Array.isArray(item.dietaryInfo) ? item.dietaryInfo.join(', ') : '',
        available: item.available,
        isVegetarian: item.isVegetarian || false,
        isSpicy: item.isSpicy || false,
        preparationTime: item.preparationTime || '',
        calories: item.calories || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      if (format === 'csv') {
        const csv = convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=menu-export-${timestamp}.csv`);
        res.send(csv);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=menu-export-${timestamp}.json`);
        res.json(exportData);
      } else if (format === 'excel') {
        // For Excel export, we'll use the XLSX library
        const XLSX = require('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Items');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=menu-export-${timestamp}.xlsx`);
        res.send(buffer);
      } else {
        res.status(400).json({
          success: false,
          error: 'Unsupported export format. Use csv, json, or excel.'
        });
      }

      logger.info(`Menu exported for restaurant ${restaurantId} in ${format} format`);

    } catch (error) {
      logger.error('Export menu error:', error);
      res.status(500).json({
        success: false,
        error: 'Export failed'
      });
    }
  }
}
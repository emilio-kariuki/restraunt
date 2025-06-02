import { Request, Response } from 'express';
import User from '../models/user';
import Restaurant from '../models/restraunt';
import Order from '../models/order';
import MenuItem from '../models/menuitem';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user: {
    _id: string;
    role: string;
    email: string;
  };
}

export class SuperAdminController {
  // Get dashboard stats
  static async getStats(req: AuthRequest, res: Response){
    try {
      const [
        totalRestaurants,
        activeRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue
      ] = await Promise.all([
        Restaurant.countDocuments(),
        Restaurant.countDocuments({ status: 'active' }),
        User.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
      ]);

      const revenueAmount = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

      res.json({
        success: true,
        stats: {
          totalRestaurants,
          activeRestaurants,
          totalUsers,
          totalOrders,
          totalRevenue: revenueAmount
        }
      });
    } catch (error) {
      logger.error('Get superadmin stats error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Get all restaurants with filters
  static async getRestaurants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      
      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [restaurants, total] = await Promise.all([
        Restaurant.find(query)
          .populate('ownerId', 'email')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 }),
        Restaurant.countDocuments(query)
      ]);

      // Add stats for each restaurant
      const restaurantsWithStats = await Promise.all(
        restaurants.map(async (restaurant) => {
          const [tablesCount, menuItemsCount, ordersCount] = await Promise.all([
            Promise.resolve(restaurant.tables.length),
            MenuItem.countDocuments({ restaurantId: restaurant._id }),
            Order.countDocuments({ restaurantId: restaurant._id })
          ]);

          return {
            ...restaurant.toObject(),
            stats: {
              tablesCount,
              menuItemsCount,
              ordersCount
            }
          };
        })
      );

      res.json({
        success: true,
        restaurants: restaurantsWithStats,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: total
        }
      });
    } catch (error) {
      logger.error('Get restaurants error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Create new restaurant
  static async createRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, address, phone, cuisine, description, ownerId } = req.body;

      // Check if restaurant with this email already exists
      const existingRestaurant = await Restaurant.findOne({ email });
      if (existingRestaurant) {
        res.status(400).json({ success: false, error: 'Restaurant with this email already exists' });
        return;
      }

      // Verify owner exists
      const owner = await User.findById(ownerId);
      if (!owner) {
        res.status(400).json({ success: false, error: 'Owner user not found' });
        return;
      }

      const restaurant = new Restaurant({
        name,
        email,
        address,
        phone,
        cuisine,
        description,
        ownerId,
        status: 'active',
        tables: [],
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

      // Update user's restaurantId
      await User.findByIdAndUpdate(ownerId, { restaurantId: restaurant._id });

      res.status(201).json({
        success: true,
        message: 'Restaurant created successfully',
        restaurant
      });
    } catch (error) {
      logger.error('Create restaurant error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Update restaurant
  static async updateRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const updates = req.body;

      const restaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        updates,
        { new: true }
      );

      if (!restaurant) {
        res.status(404).json({ success: false, error: 'Restaurant not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Restaurant updated successfully',
        restaurant
      });
    } catch (error) {
      logger.error('Update restaurant error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Delete restaurant
  static async deleteRestaurant(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;

      // Delete related data
      await Promise.all([
        MenuItem.deleteMany({ restaurantId }),
        Order.deleteMany({ restaurantId }),
        Restaurant.findByIdAndDelete(restaurantId)
      ]);

      res.json({
        success: true,
        message: 'Restaurant deleted successfully'
      });
    } catch (error) {
      logger.error('Delete restaurant error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Get all users with filters
  static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, status, search, page = 1, limit = 10 } = req.query;
      
      const query: any = {};
      if (role && role !== 'all') {
        query.role = role;
      }
      if (status && status !== 'all') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [users, total] = await Promise.all([
        User.find(query)
          .populate('restaurantId', 'name')
          .select('-password')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 }),
        User.countDocuments(query)
      ]);

      res.json({
        success: true,
        users,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: total
        }
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Create new user
  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, role, restaurantId, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ success: false, error: 'User with this email already exists' });
        return;
      }

      // If role is admin/staff, verify restaurant exists
      if ((role === 'admin' || role === 'staff') && restaurantId) {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
          res.status(400).json({ success: false, error: 'Restaurant not found' });
          return;
        }
      }

      const user = new User({
        email,
        password, // Will be hashed by the model middleware
        role,
        restaurantId: (role === 'admin' || role === 'staff') ? restaurantId : undefined,
        name,
        status: 'active'
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
          name: user.name,
          status: user.status,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Update user
  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Remove password from updates if empty
      if (updates.password === '') {
        delete updates.password;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Delete user
  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Don't allow deleting the current superadmin
      if (userId === req.user._id) {
        res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        return;
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // Get recent activity
  static async getRecentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;

      // Get recent restaurants
      const recentRestaurants = await Restaurant.find()
        .populate('ownerId', 'email')
        .sort({ createdAt: -1 })
        .limit(limit);

      // Get recent users  
      const recentUsers = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit);

      // Get recent orders
      const recentOrders = await Order.find()
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        activity: {
          restaurants: recentRestaurants,
          users: recentUsers,
          orders: recentOrders
        }
      });
    } catch (error) {
      logger.error('Get recent activity error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
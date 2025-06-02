import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import  User  from '../models/user';
import  Restaurant  from '../models/restraunt';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role = 'admin' } = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists with this email' });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Find user's restaurant if they're an admin
      let restaurant = null;
      if (user.role === 'admin') {
        restaurant = await Restaurant.findOne({ ownerId: user._id });
      } else if (user.role === 'staff' && user.restaurantId) {
        restaurant = await Restaurant.findById(user.restaurantId);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          role: user.role,
          restaurantId: (restaurant as any)?._id 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: (restaurant as any)._id
        },
        restaurant: restaurant ? {
          id: (restaurant as any)._id,
          name: (restaurant as any).name,
          hasRestaurant: true
        } : null
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user._id).select('-password');
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get restaurant info if applicable
      let restaurant = null;
      if (user.role === 'admin') {
        restaurant = await Restaurant.findOne({ ownerId: user._id });
      } else if (user.role === 'staff' && user.restaurantId) {
        restaurant = await Restaurant.findById(user.restaurantId);
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: (restaurant as any)?._id
        },
        restaurant: restaurant ? {
          id: (restaurant as any)._id,
          name: (restaurant as any).name,
          hasRestaurant: true
        } : null
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      const userId = req.user._id;

      // Validation
      if (!name || !email) {
        res.status(400).json({ error: 'Name and email are required' });
        return;
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        res.status(400).json({ error: 'Email already taken by another user' });
        return;
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { name, email },
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      logger.info(`User profile updated: ${email}`);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
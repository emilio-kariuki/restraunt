import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import user from '../models/user';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role } = req.body;

      const existingUser = await user.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      const userResponse = new user({ email, password, role });
      await userResponse.save();

      const token = jwt.sign(
        { userId: userResponse._id, role: userResponse.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: userResponse._id,
          email: userResponse.email,
          role: userResponse.role
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

      const userResponse = await user.findOne({ email });
      if (!userResponse) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }

      const isMatch = await (userResponse as any).comparePassword(password);
      if (!isMatch) {
        res.status(400).json({ error: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { userId: userResponse._id, role: userResponse.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: userResponse._id,
          email: userResponse.email,
          role: userResponse.role,
          restaurantId: userResponse.restaurantId
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
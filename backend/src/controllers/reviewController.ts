import { Request, Response } from 'express';
import Review from '../models/review';
import Restaurant from '../models/restraunt';
import logger from '../utils/logger';

export class ReviewController {
  static async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        rating, 
        sortBy = 'createdAt', 
        order = 'desc' 
      } = req.query;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const query: any = { restaurantId, status: 'approved' };
      if (rating) {
        query.rating = parseInt(rating as string);
      }

      const sortOrder = order === 'asc' ? 1 : -1;
      const sortOptions: any = { [sortBy as string]: sortOrder };

      const reviews = await Review.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit as string) * parseInt(page as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .populate('responses.staffId', 'name');

      const totalReviews = await Review.countDocuments(query);
      const avgRating = await Review.aggregate([
        { $match: query },
        { $group: { _id: null, average: { $avg: '$rating' } } }
      ]);

      // Calculate rating distribution
      const ratingDistribution = await Review.aggregate([
        { $match: { restaurantId: restaurant._id, status: 'approved' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ]);

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingDistribution.forEach(item => {
        distribution[item._id as keyof typeof distribution] = item.count;
      });

      res.json({
        reviews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalReviews,
          pages: Math.ceil(totalReviews / parseInt(limit as string))
        },
        averageRating: avgRating[0]?.average || 0,
        totalReviews,
        ratingDistribution: distribution,
        restaurant: {
          name: restaurant.name,
          address: restaurant.address
        }
      });
    } catch (error) {
      logger.error('Get reviews error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId } = req.params;
      const { 
        customerName, 
        rating, 
        comment, 
        tableNumber, 
        orderId,
        email 
      } = req.body;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const review = new Review({
        restaurantId,
        customerName,
        email,
        rating,
        comment,
        tableNumber,
        orderId,
        status: 'approved' // Auto-approve for demo
      });

      await review.save();

      res.status(201).json({
        message: 'Review submitted successfully',
        review: {
          _id: review._id,
          customerName: review.customerName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          helpfulCount: review.helpfulCount
        }
      });
    } catch (error) {
      logger.error('Create review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getReview(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, reviewId } = req.params;

      const review = await Review.findOne({
        _id: reviewId,
        restaurantId
      }).populate('responses.staffId', 'name');

      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.json({ review });
    } catch (error) {
      logger.error('Get review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async markHelpful(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, reviewId } = req.params;

      const review = await Review.findOneAndUpdate(
        { _id: reviewId, restaurantId },
        { $inc: { helpfulCount: 1 } },
        { new: true }
      );

      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.json({ 
        message: 'Review marked as helpful',
        helpfulCount: review.helpfulCount 
      });
    } catch (error) {
      logger.error('Mark helpful error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async addResponse(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, reviewId } = req.params;
      const { message } = req.body;
      const staffId = (req as any).user._id;

      const review = await Review.findOneAndUpdate(
        { _id: reviewId, restaurantId },
        {
          $push: {
            responses: {
              staffId,
              message,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      ).populate('responses.staffId', 'name');

      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.json({
        message: 'Response added successfully',
        review
      });
    } catch (error) {
      logger.error('Add response error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, reviewId } = req.params;

      const review = await Review.findOneAndDelete({
        _id: reviewId,
        restaurantId
      });

      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      logger.error('Delete review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateReviewStatus(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, reviewId } = req.params;
      const { status } = req.body;

      const review = await Review.findOneAndUpdate(
        { _id: reviewId, restaurantId },
        { status },
        { new: true }
      );

      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.json({
        message: 'Review status updated successfully',
        review
      });
    } catch (error) {
      logger.error('Update review status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { validate, schemas } from '../middleware/validation';

const router: Router = Router();

// Public routes
router.get('/:restaurantId', ReviewController.getReviews);
router.post('/:restaurantId', validate(schemas.createReview), ReviewController.createReview);
router.put('/:restaurantId/:reviewId/helpful', ReviewController.markHelpful);

export default router;
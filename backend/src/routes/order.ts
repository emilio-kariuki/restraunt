// backend/src/routes/order.ts - Fixed routes
import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router: Router = Router();

// Public routes (customer facing) - Fixed URL patterns
router.post('/:restaurantId', validate(schemas.createOrder), OrderController.createOrder);
router.post('/:orderId/payment-intent', OrderController.createPaymentIntent);
router.post('/:orderId/confirm-payment', OrderController.confirmPayment);
router.get('/:orderId', OrderController.getOrderById);

// Admin/Staff routes
router.get('/', authenticate, authorize('admin', 'staff'), OrderController.getOrders);
router.put('/:orderId/status', authenticate, authorize('admin', 'staff'), OrderController.updateOrderStatus);

export default router;
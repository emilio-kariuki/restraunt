import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (for customers)
router.post('/:restaurantId', OrderController.createOrder);
router.get('/:orderId', OrderController.getOrderById);
router.post('/:orderId/payment-intent', OrderController.createPaymentIntent);
router.post('/:orderId/confirm-payment', OrderController.confirmPayment);
router.post('/:orderId/special-service', OrderController.requestSpecialService);

// Authenticated routes (for restaurant staff) - FIX THE ORDER OF THESE ROUTES
router.get('/stats', authenticate, OrderController.getOrderStats);
router.get('/allergen', authenticate, OrderController.getAllergenOrders);
router.get('/', authenticate, OrderController.getOrders); // Move this AFTER specific routes
router.put('/bulk-update', authenticate, OrderController.bulkUpdateOrders);
router.put('/:orderId/status', authenticate, OrderController.updateOrderStatus);

// Legacy routes for backward compatibility
router.get('/recent', authenticate, OrderController.getOrders);
router.put('/:orderId/phase', authenticate, OrderController.updateOrderStatus);
router.put('/:orderId/cancel', authenticate, OrderController.updateOrderStatus);

export default router;
import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadminController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

// All routes require superadmin authentication
router.use(authenticate);
router.use(authorize('superadmin'));

// Dashboard stats
router.get('/stats', SuperAdminController.getStats as any);
router.get('/activity', SuperAdminController.getRecentActivity as any);

// Restaurant management
router.get('/restaurants', SuperAdminController.getRestaurants as any);
router.post('/restaurants', SuperAdminController.createRestaurant as any);
router.put('/restaurants/:restaurantId', SuperAdminController.updateRestaurant as any);
router.delete('/restaurants/:restaurantId', SuperAdminController.deleteRestaurant as any);

// User management
router.get('/users', SuperAdminController.getUsers as any);
router.post('/users', SuperAdminController.createUser as any);
router.put('/users/:userId', SuperAdminController.updateUser as any);
router.delete('/users/:userId', SuperAdminController.deleteUser as any);

export default router;
import { Router, Request } from 'express';
import { RestaurantController } from '../controllers/restrauntController';
import { authenticate, authorize } from '../middleware/auth';

interface AuthRequest extends Request {
  user: {
    _id: string;
    restaurantId: string;
    role: string;
  };
}

const router: Router = Router();

// Restaurant management
router.post('/', authenticate, authorize('admin'), RestaurantController.createRestaurant as any);
router.get('/my', authenticate, authorize('admin', 'staff'), RestaurantController.getMyRestaurant as any);
router.put('/my', authenticate, authorize('admin'), RestaurantController.updateRestaurant as any);
router.put('/my/settings', authenticate, authorize('admin'), RestaurantController.updateRestaurantSettings as any);
router.post('/my/reset', authenticate, authorize('admin'), RestaurantController.resetRestaurant as any);
router.get('/my/stats', authenticate, authorize('admin', 'staff'), RestaurantController.getRestaurantStats as any);

// Table management
router.post('/tables', authenticate, authorize('admin'), RestaurantController.addTable as any);
router.put('/tables/:tableId', authenticate, authorize('admin', 'staff'), RestaurantController.updateTable as any);
router.delete('/tables/:tableId', authenticate, authorize('admin'), RestaurantController.deleteTable as any); // Add this line
router.get('/tables/qr/:tableId', RestaurantController.getTableQR);

export default router;
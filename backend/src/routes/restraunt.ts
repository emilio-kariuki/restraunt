import { Router } from 'express';
import { RestaurantController } from '../controllers/restrauntController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

router.post('/', authenticate, authorize('admin'), RestaurantController.createRestaurant);
router.get('/my', authenticate, authorize('admin', 'staff'), RestaurantController.getMyRestaurant);
router.put('/my', authenticate, authorize('admin'), RestaurantController.updateRestaurant);
router.post('/tables', authenticate, authorize('admin'), RestaurantController.addTable);
router.put('/tables/:tableId', authenticate, authorize('admin', 'staff'), RestaurantController.updateTable);
router.get('/tables/qr/:tableId', RestaurantController.getTableQR);

export default router;
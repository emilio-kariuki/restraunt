import { Router } from 'express';
import { MenuController } from '../controllers/menuController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router: Router = Router();

// Public routes
router.get('/:restaurantId', MenuController.getMenu);
router.get('/:restaurantId/categories', MenuController.getMenuCategories);

// Admin/Staff routes
router.post('/', 
  authenticate, 
  // authorize('admin', 'staff', 'superadmin'), 
  validate(schemas.createMenuItem), 
  MenuController.createMenuItem
);

router.put('/:id', 
  authenticate, 
  authorize('admin', 'staff', 'superadmin'), 
  MenuController.updateMenuItem
);

router.delete('/:id', 
  authenticate, 
  authorize('admin', 'staff', 'superadmin'), 
  MenuController.deleteMenuItem
);

router.put('/:id/availability',
  authenticate,
  authorize('admin', 'staff', 'superadmin'),
  MenuController.toggleAvailability
);

router.get('/:restaurantId/stats',
  authenticate,
  authorize('admin', 'staff', 'superadmin'),
  MenuController.getMenuStats
);

export default router;
import { Router } from 'express';
import { MenuController } from '../controllers/menuController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router: Router = Router();

// Public routes
router.get('/:restaurantId', MenuController.getMenu);

// Admin/Staff routes
router.post('/', 
  authenticate, 
  authorize('admin', 'staff'), 
  validate(schemas.createMenuItem), 
  MenuController.createMenuItem
);

router.put('/:id', 
  authenticate, 
  authorize('admin', 'staff'), 
  MenuController.updateMenuItem
);

router.delete('/:id', 
  authenticate, 
  authorize('admin', 'staff'), 
  MenuController.deleteMenuItem
);

export default router;
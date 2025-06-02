import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

// Public routes (customer-facing)
router.post('/request', ServiceController.requestService);
router.post('/call-server', ServiceController.callServer);
router.post('/special-instructions', ServiceController.submitSpecialInstructions);

// Admin/Staff routes
router.get('/requests/:restaurantId', 
  authenticate, 
  authorize('admin', 'staff'), 
  ServiceController.getServiceRequests as any
);

router.put('/requests/:requestId', 
  authenticate, 
  authorize('admin', 'staff'), 
  ServiceController.updateServiceRequest as any
);

router.get('/stats/:restaurantId', 
  authenticate, 
  authorize('admin', 'staff'), 
  ServiceController.getServiceStats as any
);

export default router;
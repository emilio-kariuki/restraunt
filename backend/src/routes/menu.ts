import { Router } from 'express';
import { MenuController } from '../controllers/menuController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const router: Router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// IMPORTANT: Put specific routes BEFORE dynamic routes to avoid conflicts

// Template and export routes (these must come BEFORE /:restaurantId)
router.get('/bulk-upload-template', MenuController.getBulkUploadTemplate);
router.get('/export', MenuController.exportMenu);

// Protected routes - require authentication
router.use(authenticate);

// Bulk operations (admin/staff only)
router.post('/bulk-upload',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.bulkUploadMenu
);

router.post('/upload-from-file',
  authorize('admin', 'staff', 'superadmin'),
  upload.single('file'),
  MenuController.uploadMenuFromFile
);

router.post('/validate-bulk',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.validateBulkMenu
);

router.put('/bulk-update',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.bulkUpdateMenu
);

router.delete('/bulk-delete',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.bulkDeleteMenu
);

// Individual menu item operations
router.post('/',
  // authorize('admin', 'staff', 'superadmin'),
  MenuController.createMenuItem
);

router.put('/:id',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.updateMenuItem
);

router.delete('/:id',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.deleteMenuItem
);

router.put('/:id/availability',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.toggleAvailability
);

// Public routes (these come last because they use dynamic parameters)
router.get('/:restaurantId', MenuController.getMenu);
router.get('/:restaurantId/categories', MenuController.getMenuCategories);
router.get('/:restaurantId/stats',
  authorize('admin', 'staff', 'superadmin'),
  MenuController.getMenuStats
);

export default router;
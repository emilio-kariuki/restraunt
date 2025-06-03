import { Router } from 'express';
import { TableController } from '../controllers/tableController';

const router: Router = Router();

router.get('/:restaurantId/:tableId', TableController.getTableInfo);
router.get('/:restaurantId/:tableId/menu', TableController.getTableMenu);
router.get('/:restaurantId/:tableId/status', TableController.getTableStatus);


export default router;
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', authenticate, AuthController.getProfile);
router.put('/me', authenticate, AuthController.updateProfile);

export default router;
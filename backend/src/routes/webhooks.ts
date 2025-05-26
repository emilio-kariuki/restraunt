import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router: Router = Router();

// Stripe webhook (raw body needed)
router.post('/stripe', WebhookController.handleStripeWebhook);

export default router;
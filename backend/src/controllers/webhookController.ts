import { Request, Response } from "express";
import Stripe from "stripe";
import Order from "../models/order";
import logger from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export class WebhookController {
  static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      logger.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await WebhookController.handlePaymentSucceeded(paymentIntent);
          break;

        case "payment_intent.payment_failed":
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await WebhookController.handlePaymentFailed(failedPayment);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  private static async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "confirmed",
        updatedAt: new Date(),
      });

      logger.info(`Payment succeeded for order: ${orderId}`);
    }
  }

  private static async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
        updatedAt: new Date(),
      });

      logger.error(`Payment failed for order: ${orderId}`);
    }
  }
}

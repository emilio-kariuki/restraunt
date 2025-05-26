import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15'
});

export class StripeService {
  static async createPaymentIntent(amount: number, orderId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return paymentIntent;
  }

  static async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  static async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    return await stripe.refunds.create(refundData);
  }
}
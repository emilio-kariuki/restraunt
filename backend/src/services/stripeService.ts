import Stripe from 'stripe';
import logger from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15'
});

interface CustomerMetadata {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  tableId: string;
}

export class StripeService {
  static async createPaymentIntent(
    amount: number, 
    orderId: string,
    customerData: CustomerMetadata
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Create or update customer in Stripe
      let customer: Stripe.Customer | null = null;
      
      if (customerData.customerEmail) {
        const customers = await stripe.customers.list({
          email: customerData.customerEmail,
          limit: 1
        });

        if (customers.data.length > 0) {
          customer = customers.data[0];
          // Update customer info
          await stripe.customers.update(customer.id, {
            name: customerData.customerName,
            phone: customerData.customerPhone,
            metadata: {
              lastOrderId: orderId,
              lastTableId: customerData.tableId
            }
          });
        } else {
          customer = await stripe.customers.create({
            name: customerData.customerName,
            email: customerData.customerEmail,
            phone: customerData.customerPhone,
            metadata: {
              lastOrderId: orderId,
              lastTableId: customerData.tableId
            }
          });
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          orderId,
          customerName: customerData.customerName,
          customerPhone: customerData.customerPhone,
          tableId: customerData.tableId
        },
        ...(customer && { customer: customer.id }),
        description: `Order #${orderId.slice(-6)} - Table ${customerData.tableId}`
      });

      logger.info(`Payment intent created: ${paymentIntent.id} for order: ${orderId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Stripe payment intent creation error:', error);
      throw error;
    }
  }

  static async confirmPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      logger.info(`Payment intent status: ${paymentIntent.status} for ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Stripe payment retrieval error:', error);
      throw error;
    }
  }

  static async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer'
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundData);
      logger.info(`Refund created: ${refund.id} for payment: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw error;
    }
  }

  static async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return setupIntent;
    } catch (error) {
      logger.error('Stripe setup intent error:', error);
      throw error;
    }
  }
}
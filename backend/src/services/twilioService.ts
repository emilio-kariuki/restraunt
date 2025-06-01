import twilio from 'twilio';
import logger from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

// const accountSid = "AC1f0449fd0737581fcd528cd142b31d2b";
const accountSid = "ACc2c10abcbb31d13066538e4b84470502";
// const authToken = "bf60effde1c0e5e1e7a29dcd49ff1290";
const authToken = "38e6beeecfc342a9c9b64f09b8c9c330";
const fromNumber = "+254790923758"; // Your Twilio phone number

const client = twilio(accountSid, authToken);

export class TwilioService {
  private static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      // Ensure phone number has country code
      const formattedPhone = to.startsWith('+') ? to : `+1${to}`;
      
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: formattedPhone
      });
      
      logger.info(`SMS sent successfully: ${result.sid} to ${formattedPhone}`);
      return true;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return false;
    }
  }

  static async sendOrderConfirmation(
    customerPhone: string, 
    orderNumber: string,
    customerName: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}! Your order #${orderNumber} has been received at Bella Vista Restaurant. We'll notify you when it's ready. Thank you!`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendPaymentConfirmation(
    customerPhone: string,
    orderNumber: string,
    amount: number
  ): Promise<boolean> {
    const message = `Payment confirmed! Your order #${orderNumber} for $${amount.toFixed(2)} has been paid successfully. We're preparing your order now.`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendOrderConfirmed(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Order #${orderNumber} confirmed! Our kitchen has received your order and will start preparing it shortly.`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendOrderPreparing(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Good news! Order #${orderNumber} is now being prepared by our chefs. Estimated ready time: 15-20 minutes.`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendOrderReady(
    customerPhone: string, 
    orderNumber: string,
    tableNumber: string
  ): Promise<boolean> {
    const message = `🍽️ Order #${orderNumber} is ready! Your delicious meal is waiting for you at Table ${tableNumber}. Enjoy!`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendOrderCancelled(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Order #${orderNumber} has been cancelled. If you paid for this order, a refund will be processed within 3-5 business days.`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendTableReady(
    customerPhone: string, 
    restaurantName: string
  ): Promise<boolean> {
    const message = `Hi! Your table at ${restaurantName} is ready. Please proceed to the host stand.`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendReservationConfirmation(
    customerPhone: string,
    restaurantName: string,
    date: string,
    time: string,
    partySize: number
  ): Promise<boolean> {
    const message = `Reservation confirmed at ${restaurantName} for ${partySize} people on ${date} at ${time}. See you then!`;
    return await this.sendSMS(customerPhone, message);
  }

  static async sendMarketingMessage(
    customerPhone: string,
    message: string
  ): Promise<boolean> {
    // Ensure compliance with regulations
    const compliantMessage = `${message}\n\nReply STOP to unsubscribe.`;
    return await this.sendSMS(customerPhone, compliantMessage);
  }
}
import twilio from 'twilio';

const client = twilio(
  'AC1f0449fd0737581fcd528cd142b31d2b',
  'bf60effde1c0e5e1e7a29dcd49ff1290'
  // process.env.TWILIO_ACCOUNT_SID!,
  // process.env.TWILIO_AUTH_TOKEN!
);

export class TwilioService {
  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: to
      });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  static async notifyTableReady(customerPhone: string, restaurantName: string): Promise<boolean> {
    const message = `Hi! Your table at ${restaurantName} is ready. Please proceed to the host stand.`;
    return await this.sendSMS(customerPhone, message);
  }

  static async notifyOrderReady(customerPhone: string, orderNumber: string): Promise<boolean> {
    const message = `Your order #${orderNumber} is ready for pickup!`;
    return await this.sendSMS(customerPhone, message);
  }
}
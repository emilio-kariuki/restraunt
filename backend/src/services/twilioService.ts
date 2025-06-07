import twilio from 'twilio';
import logger from '../utils/logger';
import Restaurant from '../models/restraunt';
import dotenv from 'dotenv';
dotenv.config();

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class TwilioService {
  private static client: twilio.Twilio;
  private static config: TwilioConfig;

  static initialize() {
    try {
      this.config = {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
      };

      if (!this.config.accountSid || !this.config.authToken || !this.config.phoneNumber) {
        logger.warn('Twilio configuration incomplete. SMS services will be disabled.');
        return;
      }

      this.client = twilio(this.config.accountSid, this.config.authToken);
      logger.info('Twilio service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio service:', error);
    }
  }

  private static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.client) {
        logger.warn('Twilio client not initialized. Skipping SMS.');
        return false;
      }

      // Format phone number
      const formattedNumber = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

      const result = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: formattedNumber
      });

      logger.info(`SMS sent successfully to ${formattedNumber}. SID: ${result.sid}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  // Order-related SMS notifications
  static async sendOrderConfirmation(
    customerPhone: string,
    orderNumber: string,
    customerName: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}! Your order #${orderNumber} has been received. We'll notify you when it's ready. Thank you for choosing us!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendOrderConfirmed(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Great news! Your order #${orderNumber} has been confirmed and our kitchen is preparing it now. We'll update you when it's ready!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendOrderPreparing(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Your order #${orderNumber} is now being prepared by our chefs. It should be ready soon!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendOrderReady(
    customerPhone: string,
    orderNumber: string,
    tableId?: string
  ): Promise<boolean> {
    const tableInfo = tableId ? ` Your server will bring it to table ${tableId} shortly.` : ' Your server will bring it to you shortly.';
    const message = `Your order #${orderNumber} is ready!${tableInfo} Enjoy your meal!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendOrderServed(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Your order #${orderNumber} has been served. Enjoy your meal! Let us know if you need anything else.`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendOrderCompleted(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Thank you for dining with us! Your order #${orderNumber} is complete. We hope you enjoyed your meal!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendOrderCancelled(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `We're sorry, but your order #${orderNumber} has been cancelled. Please contact us if you have any questions.`;
    return this.sendSMS(customerPhone, message);
  }

  // Payment-related SMS notifications
  static async sendPaymentConfirmation(
    customerPhone: string,
    orderNumber: string,
    amount: number
  ): Promise<boolean> {
    const message = `Payment confirmed! Your order #${orderNumber} for $${amount.toFixed(2)} has been successfully paid. Thank you!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendPaymentFailed(
    customerPhone: string,
    orderNumber: string
  ): Promise<boolean> {
    const message = `Payment failed for order #${orderNumber}. Please try again or contact our staff for assistance.`;
    return this.sendSMS(customerPhone, message);
  }

  // Special service requests
  static async sendServerCallRequest(
    restaurantId: string,
    tableId: string,
    customerName: string
  ): Promise<boolean> {
    try {
      // Get restaurant information to find staff phone numbers
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        logger.error('Restaurant not found for server call request');
        return false;
      }

      // For now, send to restaurant main phone - in production you'd have staff phones
      const staffPhone = restaurant.phone;
      const message = `🔔 SERVER CALL REQUEST
Table: ${tableId}
Customer: ${customerName}
Time: ${new Date().toLocaleTimeString()}

Please assist this customer as soon as possible.`;

      return this.sendSMS(staffPhone, message);
    } catch (error) {
      logger.error('Failed to send server call request:', error);
      return false;
    }
  }

  static async sendPackingRequest(
    restaurantId: string,
    tableId: string,
    customerName: string,
    orderNumber: string
  ): Promise<boolean> {
    try {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        logger.error('Restaurant not found for packing request');
        return false;
      }

      const staffPhone = restaurant.phone;
      const message = `📦 PACKING REQUEST
Order: #${orderNumber}
Table: ${tableId}
Customer: ${customerName}
Time: ${new Date().toLocaleTimeString()}

Please prepare takeaway containers for this table.`;

      return this.sendSMS(staffPhone, message);
    } catch (error) {
      logger.error('Failed to send packing request:', error);
      return false;
    }
  }

  static async sendSplitPaymentRequest(
    restaurantId: string,
    tableId: string,
    customerName: string,
    orderNumber: string
  ): Promise<boolean> {
    try {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        logger.error('Restaurant not found for split payment request');
        return false;
      }

      const staffPhone = restaurant.phone;
      const message = `💳 SPLIT PAYMENT REQUEST
Order: #${orderNumber}
Table: ${tableId}
Customer: ${customerName}
Time: ${new Date().toLocaleTimeString()}

Customer wants to split the bill. Please assist with payment processing.`;

      return this.sendSMS(staffPhone, message);
    } catch (error) {
      logger.error('Failed to send split payment request:', error);
      return false;
    }
  }

  // Waiting list and table management
  static async sendTableReadyNotification(
    customerPhone: string,
    customerName: string,
    tableNumber: string,
    estimatedTime: number
  ): Promise<boolean> {
    const message = `Hi ${customerName}! Your table ${tableNumber} is ready. You have ${estimatedTime} minutes to be seated. Please proceed to the host station.`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendWaitingListUpdate(
    customerPhone: string,
    customerName: string,
    position: number,
    estimatedWaitTime: number
  ): Promise<boolean> {
    const message = `Hi ${customerName}! You are currently #${position} in line. Estimated wait time: ${estimatedWaitTime} minutes. We'll notify you when your table is ready.`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendReservationConfirmation(
    customerPhone: string,
    customerName: string,
    date: string,
    time: string,
    partySize: number,
    restaurantName: string
  ): Promise<boolean> {
    const message = `Reservation confirmed at ${restaurantName}!
Date: ${date}
Time: ${time}
Party size: ${partySize}
Customer: ${customerName}

We look forward to serving you!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendReservationReminder(
    customerPhone: string,
    customerName: string,
    time: string,
    restaurantName: string
  ): Promise<boolean> {
    const message = `Reminder: You have a reservation at ${restaurantName} today at ${time}. Looking forward to seeing you!`;
    return this.sendSMS(customerPhone, message);
  }

  // Phase transition notifications
  static async sendPhaseTransition(
    customerPhone: string,
    customerName: string,
    newPhase: string,
    orderNumber?: string
  ): Promise<boolean> {
    let message = '';
    
    switch (newPhase) {
      case 'seated':
        message = `Welcome ${customerName}! You've been seated. Take your time to review the menu and place your order when ready.`;
        break;
      case 'ordering':
        message = `Hi ${customerName}! Ready to order? Browse our menu and place your order through the QR code system.`;
        break;
      case 'waiting_food':
        message = `Thank you for your order${orderNumber ? ` #${orderNumber}` : ''}! Our kitchen is preparing your meal. We'll notify you when it's ready.`;
        break;
      case 'eating':
        message = `Enjoy your meal${orderNumber ? ` (Order #${orderNumber})` : ''}! Let us know if you need anything else.`;
        break;
      case 'packing':
        message = `We're preparing your takeaway items. Thank you for dining with us!`;
        break;
      case 'departure':
        message = `Thank you for visiting us! We hope you enjoyed your experience. Come back soon!`;
        break;
      default:
        return false;
    }

    return this.sendSMS(customerPhone, message);
  }

  // Emergency and special notifications
  static async sendEmergencyNotification(
    phones: string[],
    message: string
  ): Promise<boolean[]> {
    const results = await Promise.all(
      phones.map(phone => this.sendSMS(phone, `🚨 EMERGENCY: ${message}`))
    );
    return results;
  }

  static async sendCustomNotification(
    customerPhone: string,
    message: string
  ): Promise<boolean> {
    return this.sendSMS(customerPhone, message);
  }

  // Bulk notifications
  static async sendBulkNotification(
    phones: string[],
    message: string
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
      phones.map(phone => this.sendSMS(phone, message))
    );

    const success = results.filter(result => result).length;
    const failed = results.length - success;

    return { success, failed };
  }

  // Marketing and promotional messages
  static async sendPromotionalMessage(
    customerPhone: string,
    customerName: string,
    promotion: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}! 🎉 Special offer just for you: ${promotion}. Visit us soon to take advantage of this deal!`;
    return this.sendSMS(customerPhone, message);
  }

  static async sendFeedbackRequest(
    customerPhone: string,
    customerName: string,
    orderNumber: string,
    feedbackLink?: string
  ): Promise<boolean> {
    const message = `Hi ${customerName}! How was your experience with order #${orderNumber}? We'd love your feedback${feedbackLink ? `: ${feedbackLink}` : '. Reply to this message with your thoughts!'}`;
    return this.sendSMS(customerPhone, message);
  }

  // Utility methods
  static isConfigured(): boolean {
    return !!this.client && !!this.config.phoneNumber;
  }

  static async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.client) return false;

      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
      return !!lookup.phoneNumber;
    } catch (error) {
      logger.error('Phone number validation failed:', error);
      return false;
    }
  }

  // Get SMS delivery status
  static async getMessageStatus(messageSid: string): Promise<string | null> {
    try {
      if (!this.client) return null;

      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      logger.error('Failed to get message status:', error);
      return null;
    }
  }
}

// Initialize the service when the module is loaded
TwilioService.initialize();


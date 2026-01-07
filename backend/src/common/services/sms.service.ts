import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  sendSms(phone: string, message: string): Promise<SmsResult>;
}

// Mock provider for development
class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger('MockSmsProvider');

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    this.logger.log(`[MOCK SMS] To: ${phone}, Message: ${message}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}

// Twilio provider
class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger('TwilioSmsProvider');
  private client: any;
  private fromNumber: string;

  constructor(
    accountSid: string,
    authToken: string,
    fromNumber: string,
  ) {
    // Dynamic import to avoid requiring twilio in dev
    try {
      const twilio = require('twilio');
      this.client = twilio(accountSid, authToken);
      this.fromNumber = fromNumber;
    } catch {
      this.logger.error('Twilio SDK not installed. Run: npm install twilio');
    }
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    if (!this.client) {
      return { success: false, error: 'Twilio client not initialized' };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phone,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Twilio error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Orange SMS API provider (Côte d'Ivoire)
class OrangeSmsProvider implements SmsProvider {
  private readonly logger = new Logger('OrangeSmsProvider');
  private apiKey: string;
  private senderId: string;
  private baseUrl = 'https://api.orange.com/smsmessaging/v1';

  constructor(apiKey: string, senderId: string) {
    this.apiKey = apiKey;
    this.senderId = senderId;
  }

  async sendSms(phone: string, message: string): Promise<SmsResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/outbound/${encodeURIComponent(this.senderId)}/requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            outboundSMSMessageRequest: {
              address: `tel:${phone}`,
              senderAddress: this.senderId,
              outboundSMSTextMessage: {
                message,
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Orange API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.outboundSMSMessageRequest?.resourceURL,
      };
    } catch (error) {
      this.logger.error(`Orange SMS error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private provider: SmsProvider;

  constructor(private readonly configService: ConfigService) {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    const providerName = this.configService.get<string>('SMS_PROVIDER') || 'mock';
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    const apiSecret = this.configService.get<string>('SMS_API_SECRET');
    const senderId = this.configService.get<string>('SMS_SENDER_ID') || 'RepairFone';

    switch (providerName.toLowerCase()) {
      case 'twilio':
        if (!apiKey || !apiSecret) {
          this.logger.warn('Twilio credentials missing, falling back to mock');
          this.provider = new MockSmsProvider();
        } else {
          this.provider = new TwilioSmsProvider(apiKey, apiSecret, senderId);
          this.logger.log('SMS provider: Twilio initialized');
        }
        break;

      case 'orange':
        if (!apiKey) {
          this.logger.warn('Orange API key missing, falling back to mock');
          this.provider = new MockSmsProvider();
        } else {
          this.provider = new OrangeSmsProvider(apiKey, senderId);
          this.logger.log('SMS provider: Orange initialized');
        }
        break;

      case 'mock':
      default:
        this.provider = new MockSmsProvider();
        this.logger.log('SMS provider: Mock (development mode)');
        break;
    }
  }

  async sendOtp(phone: string, code: string): Promise<SmsResult> {
    const message = `[RepairFone] Votre code de vérification est: ${code}. Valide pendant 5 minutes.`;
    return this.sendSms(phone, message);
  }

  async sendNotification(phone: string, title: string, body: string): Promise<SmsResult> {
    const message = `[RepairFone] ${title}: ${body}`;
    return this.sendSms(phone, message);
  }

  async sendQuoteNotification(phone: string, repairerName: string, amount: number): Promise<SmsResult> {
    const message = `[RepairFone] Nouveau devis de ${repairerName}: ${amount.toLocaleString('fr-FR')} FCFA. Connectez-vous pour accepter.`;
    return this.sendSms(phone, message);
  }

  async sendRepairStatusUpdate(phone: string, status: string): Promise<SmsResult> {
    const statusMessages: Record<string, string> = {
      accepted: 'Votre demande de réparation a été acceptée.',
      in_progress: 'Votre réparation est en cours.',
      completed: 'Votre réparation est terminée!',
      delivered: 'Votre appareil a été livré.',
    };

    const message = `[RepairFone] ${statusMessages[status] || `Statut: ${status}`}`;
    return this.sendSms(phone, message);
  }

  private async sendSms(phone: string, message: string): Promise<SmsResult> {
    // Format phone number for Côte d'Ivoire if needed
    const formattedPhone = this.formatPhoneNumber(phone);

    this.logger.debug(`Sending SMS to ${formattedPhone}`);
    const result = await this.provider.sendSms(formattedPhone, message);

    if (!result.success) {
      this.logger.error(`SMS failed to ${formattedPhone}: ${result.error}`);
    }

    return result;
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces and dashes
    let cleaned = phone.replace(/[\s-]/g, '');

    // Add Côte d'Ivoire country code if not present
    if (cleaned.startsWith('0')) {
      cleaned = '+225' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+225' + cleaned;
    }

    return cleaned;
  }
}

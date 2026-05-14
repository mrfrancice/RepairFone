import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PaymentInitResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: 'pending' | 'completed' | 'failed';
  transactionRef?: string;
  error?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface PaymentGateway {
  initiate(params: {
    amount: number;
    currency: string;
    description: string;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
    transactionId: string;
    returnUrl: string;
    notifyUrl: string;
  }): Promise<PaymentInitResult>;

  verify(transactionId: string): Promise<PaymentVerifyResult>;

  refund(transactionId: string, amount?: number): Promise<PaymentRefundResult>;
}

// Mock provider for development
class MockPaymentGateway implements PaymentGateway {
  private readonly logger = new Logger('MockPaymentGateway');

  async initiate(params: any): Promise<PaymentInitResult> {
    this.logger.log(
      `[MOCK] Initiating payment: ${params.amount} ${params.currency}`,
    );
    return {
      success: true,
      paymentUrl: `http://localhost:3000/mock-payment/${params.transactionId}`,
      transactionId: params.transactionId,
    };
  }

  async verify(transactionId: string): Promise<PaymentVerifyResult> {
    this.logger.log(`[MOCK] Verifying payment: ${transactionId}`);
    return {
      success: true,
      status: 'completed',
      transactionRef: `MOCK-${Date.now()}`,
    };
  }

  async refund(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    this.logger.log(
      `[MOCK] Refunding payment: ${transactionId}, amount: ${amount}`,
    );
    return {
      success: true,
      refundId: `MOCK-REFUND-${Date.now()}`,
    };
  }
}

// CinetPay Gateway (Côte d'Ivoire)
class CinetPayGateway implements PaymentGateway {
  private readonly logger = new Logger('CinetPayGateway');
  private readonly apiKey: string;
  private readonly siteId: string;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api-checkout.cinetpay.com/v2';

  constructor(apiKey: string, siteId: string, secretKey: string) {
    this.apiKey = apiKey;
    this.siteId = siteId;
    this.secretKey = secretKey;
  }

  async initiate(params: any): Promise<PaymentInitResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: params.transactionId,
          amount: params.amount,
          currency: params.currency || 'XOF',
          description: params.description,
          customer_email: params.customerEmail,
          customer_phone_number: params.customerPhone,
          customer_name: params.customerName,
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
          channels: 'ALL', // Mobile money + Cards
        }),
      });

      const data = await response.json();

      if (data.code === '201') {
        return {
          success: true,
          paymentUrl: data.data.payment_url,
          transactionId: params.transactionId,
        };
      }

      return {
        success: false,
        error: data.message || "Erreur lors de l'initiation du paiement",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`CinetPay initiate error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verify(transactionId: string): Promise<PaymentVerifyResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: transactionId,
        }),
      });

      const data = await response.json();

      if (data.code === '00') {
        const status =
          data.data.status === 'ACCEPTED'
            ? 'completed'
            : data.data.status === 'REFUSED'
              ? 'failed'
              : 'pending';
        return {
          success: true,
          status,
          transactionRef: data.data.payment_method,
        };
      }

      return {
        success: false,
        status: 'pending',
        error: data.message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`CinetPay verify error: ${errorMessage}`);
      return {
        success: false,
        status: 'pending',
        error: errorMessage,
      };
    }
  }

  async refund(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    // CinetPay refund requires contacting support
    this.logger.warn('CinetPay refunds require manual processing');
    return {
      success: false,
      error: 'Les remboursements CinetPay nécessitent un traitement manuel',
    };
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(body))
      .digest('hex');
    return expectedSignature === signature;
  }
}

// PayDunya Gateway (UEMOA region)
class PayDunyaGateway implements PaymentGateway {
  private readonly logger = new Logger('PayDunyaGateway');
  private readonly masterKey: string;
  private readonly privateKey: string;
  private readonly token: string;
  private readonly mode: 'test' | 'live';
  private readonly baseUrl: string;

  constructor(
    masterKey: string,
    privateKey: string,
    token: string,
    mode: 'test' | 'live' = 'test',
  ) {
    this.masterKey = masterKey;
    this.privateKey = privateKey;
    this.token = token;
    this.mode = mode;
    this.baseUrl =
      mode === 'live'
        ? 'https://app.paydunya.com/api/v1'
        : 'https://app.paydunya.com/sandbox-api/v1';
  }

  async initiate(params: any): Promise<PaymentInitResult> {
    try {
      // First, create an invoice
      const invoiceResponse = await fetch(
        `${this.baseUrl}/checkout-invoice/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'PAYDUNYA-MASTER-KEY': this.masterKey,
            'PAYDUNYA-PRIVATE-KEY': this.privateKey,
            'PAYDUNYA-TOKEN': this.token,
          },
          body: JSON.stringify({
            invoice: {
              total_amount: params.amount,
              description: params.description,
            },
            store: {
              name: 'RepairFone',
            },
            custom_data: {
              transaction_id: params.transactionId,
            },
            actions: {
              return_url: params.returnUrl,
              callback_url: params.notifyUrl,
            },
          }),
        },
      );

      const data = await invoiceResponse.json();

      if (data.response_code === '00') {
        return {
          success: true,
          paymentUrl: data.response_text,
          transactionId: data.token,
        };
      }

      return {
        success: false,
        error: data.response_text || 'Erreur PayDunya',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayDunya initiate error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verify(transactionId: string): Promise<PaymentVerifyResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/checkout-invoice/confirm/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'PAYDUNYA-MASTER-KEY': this.masterKey,
            'PAYDUNYA-PRIVATE-KEY': this.privateKey,
            'PAYDUNYA-TOKEN': this.token,
          },
        },
      );

      const data = await response.json();

      if (data.response_code === '00') {
        const status =
          data.invoice.status === 'completed'
            ? 'completed'
            : data.invoice.status === 'cancelled'
              ? 'failed'
              : 'pending';
        return {
          success: true,
          status,
          transactionRef: data.invoice.receipt_url,
        };
      }

      return {
        success: false,
        status: 'pending',
        error: data.response_text,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayDunya verify error: ${errorMessage}`);
      return {
        success: false,
        status: 'pending',
        error: errorMessage,
      };
    }
  }

  async refund(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    // PayDunya supports refunds via API
    try {
      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PAYDUNYA-MASTER-KEY': this.masterKey,
          'PAYDUNYA-PRIVATE-KEY': this.privateKey,
          'PAYDUNYA-TOKEN': this.token,
        },
        body: JSON.stringify({
          token: transactionId,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (data.response_code === '00') {
        return {
          success: true,
          refundId: data.refund_token,
        };
      }

      return {
        success: false,
        error: data.response_text || 'Erreur de remboursement',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`PayDunya refund error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private gateway: PaymentGateway;
  private readonly currency: string;
  private readonly returnUrl: string;
  private readonly notifyUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.currency = this.configService.get<string>('PAYMENT_CURRENCY') || 'XOF';
    this.returnUrl =
      this.configService.get<string>('PAYMENT_RETURN_URL') ||
      'http://localhost:4200/payment/callback';
    this.notifyUrl =
      this.configService.get<string>('PAYMENT_NOTIFY_URL') ||
      'http://localhost:3000/api/payments/webhook';
    this.initializeGateway();
  }

  private initializeGateway(): void {
    const providerName =
      this.configService.get<string>('PAYMENT_PROVIDER') || 'mock';

    switch (providerName.toLowerCase()) {
      case 'cinetpay':
        const cinetApiKey = this.configService.get<string>('CINETPAY_API_KEY');
        const cinetSiteId = this.configService.get<string>('CINETPAY_SITE_ID');
        const cinetSecretKey = this.configService.get<string>(
          'CINETPAY_SECRET_KEY',
        );

        if (!cinetApiKey || !cinetSiteId || !cinetSecretKey) {
          this.logger.warn(
            'CinetPay credentials missing, falling back to mock',
          );
          this.gateway = new MockPaymentGateway();
        } else {
          this.gateway = new CinetPayGateway(
            cinetApiKey,
            cinetSiteId,
            cinetSecretKey,
          );
          this.logger.log('Payment gateway: CinetPay initialized');
        }
        break;

      case 'paydunya':
        const pdMasterKey = this.configService.get<string>(
          'PAYDUNYA_MASTER_KEY',
        );
        const pdPrivateKey = this.configService.get<string>(
          'PAYDUNYA_PRIVATE_KEY',
        );
        const pdToken = this.configService.get<string>('PAYDUNYA_TOKEN');
        const pdMode =
          (this.configService.get<string>('PAYDUNYA_MODE') as
            | 'test'
            | 'live') || 'test';

        if (!pdMasterKey || !pdPrivateKey || !pdToken) {
          this.logger.warn(
            'PayDunya credentials missing, falling back to mock',
          );
          this.gateway = new MockPaymentGateway();
        } else {
          this.gateway = new PayDunyaGateway(
            pdMasterKey,
            pdPrivateKey,
            pdToken,
            pdMode,
          );
          this.logger.log(
            `Payment gateway: PayDunya initialized (${pdMode} mode)`,
          );
        }
        break;

      case 'mock':
      default:
        this.gateway = new MockPaymentGateway();
        this.logger.log('Payment gateway: Mock (development mode)');
        break;
    }
  }

  /**
   * Initiate a payment
   */
  async initiatePayment(params: {
    amount: number;
    description: string;
    customerEmail: string;
    customerPhone: string;
    customerName: string;
    transactionId: string;
  }): Promise<PaymentInitResult> {
    return this.gateway.initiate({
      ...params,
      currency: this.currency,
      returnUrl: this.returnUrl,
      notifyUrl: this.notifyUrl,
    });
  }

  /**
   * Verify a payment status
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerifyResult> {
    return this.gateway.verify(transactionId);
  }

  /**
   * Request a refund
   */
  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentRefundResult> {
    return this.gateway.refund(transactionId, amount);
  }

  /**
   * Get the current gateway name
   */
  getGatewayName(): string {
    return this.configService.get<string>('PAYMENT_PROVIDER') || 'mock';
  }
}

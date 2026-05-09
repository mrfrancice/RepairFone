import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
}

// Mock provider for development
class MockEmailProvider implements EmailProvider {
  private readonly logger = new Logger('MockEmailProvider');

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    this.logger.log(`[MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}`);
    this.logger.debug(`Content: ${options.text || options.html?.substring(0, 100)}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}

// Nodemailer SMTP provider
class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger('SmtpEmailProvider');
  private transporter: any = null;

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly user: string,
    private readonly pass: string,
    private readonly fromEmail: string,
  ) {
    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.port === 465,
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });
      this.logger.log('SMTP transporter initialized');
    } catch {
      this.logger.error('Nodemailer not installed. Run: npm install nodemailer');
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      return { success: false, error: 'SMTP transporter not initialized' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`SMTP error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// SendGrid provider
class SendGridEmailProvider implements EmailProvider {
  private readonly logger = new Logger('SendGridEmailProvider');
  private apiKey: string;
  private fromEmail: string;
  private baseUrl = 'https://api.sendgrid.com/v3/mail/send';

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: options.from || this.fromEmail },
          subject: options.subject,
          content: [
            options.html
              ? { type: 'text/html', value: options.html }
              : { type: 'text/plain', value: options.text || '' },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorData}`);
      }

      return {
        success: true,
        messageId: response.headers.get('x-message-id') || `sendgrid-${Date.now()}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`SendGrid error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private provider: EmailProvider;
  private fromEmail: string;
  private appName: string;

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get<string>('APP_NAME') || 'RepairFone';
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@repairfone.ci';
    this.initializeProvider();
  }

  private initializeProvider(): void {
    const providerName = this.configService.get<string>('EMAIL_PROVIDER') || 'mock';

    switch (providerName.toLowerCase()) {
      case 'smtp':
      case 'nodemailer':
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT') || 587;
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (!host || !user || !pass) {
          this.logger.warn('SMTP credentials missing, falling back to mock');
          this.provider = new MockEmailProvider();
        } else {
          this.provider = new SmtpEmailProvider(host, port, user, pass, this.fromEmail);
          this.logger.log('Email provider: SMTP initialized');
        }
        break;

      case 'sendgrid':
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        if (!apiKey) {
          this.logger.warn('SendGrid API key missing, falling back to mock');
          this.provider = new MockEmailProvider();
        } else {
          this.provider = new SendGridEmailProvider(apiKey, this.fromEmail);
          this.logger.log('Email provider: SendGrid initialized');
        }
        break;

      case 'mock':
      default:
        this.provider = new MockEmailProvider();
        this.logger.log('Email provider: Mock (development mode)');
        break;
    }
  }

  // ==================== User Emails ====================

  async sendWelcomeEmail(email: string, firstName: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Bienvenue sur ${this.appName}!`,
      html: this.getWelcomeTemplate(firstName),
    });
  }

  async sendOtpEmail(email: string, code: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] Votre code de vérification`,
      html: this.getOtpTemplate(code),
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] Réinitialisation de mot de passe`,
      html: this.getPasswordResetTemplate(resetLink),
    });
  }

  // ==================== Quote Emails ====================

  async sendNewQuoteEmail(
    clientEmail: string,
    clientName: string,
    repairerName: string,
    amount: number,
    deviceInfo: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: clientEmail,
      subject: `[${this.appName}] Nouveau devis reçu`,
      html: this.getNewQuoteTemplate(clientName, repairerName, amount, deviceInfo),
    });
  }

  async sendQuoteAcceptedEmail(
    repairerEmail: string,
    repairerName: string,
    clientName: string,
    deviceInfo: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: repairerEmail,
      subject: `[${this.appName}] Devis accepté!`,
      html: this.getQuoteAcceptedTemplate(repairerName, clientName, deviceInfo),
    });
  }

  // ==================== Payment Emails ====================

  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    amount: number,
    transactionRef: string,
    deviceInfo: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] Confirmation de paiement`,
      html: this.getPaymentConfirmationTemplate(name, amount, transactionRef, deviceInfo),
    });
  }

  async sendPaymentReceivedEmail(
    repairerEmail: string,
    repairerName: string,
    amount: number,
    clientName: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: repairerEmail,
      subject: `[${this.appName}] Paiement reçu`,
      html: this.getPaymentReceivedTemplate(repairerName, amount, clientName),
    });
  }

  // ==================== Repair Status Emails ====================

  async sendRepairStatusEmail(
    email: string,
    name: string,
    status: string,
    deviceInfo: string,
  ): Promise<EmailResult> {
    const statusMessages: Record<string, { subject: string; message: string }> = {
      accepted: {
        subject: 'Demande acceptée',
        message: 'Votre demande de réparation a été acceptée par le réparateur.',
      },
      in_progress: {
        subject: 'Réparation en cours',
        message: 'Votre réparation est maintenant en cours.',
      },
      completed: {
        subject: 'Réparation terminée',
        message: 'Bonne nouvelle! Votre réparation est terminée.',
      },
      delivered: {
        subject: 'Appareil livré',
        message: 'Votre appareil a été livré avec succès.',
      },
    };

    const statusInfo = statusMessages[status] || {
      subject: `Mise à jour de statut`,
      message: `Le statut de votre réparation est maintenant: ${status}`,
    };

    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] ${statusInfo.subject}`,
      html: this.getRepairStatusTemplate(name, statusInfo.message, deviceInfo),
    });
  }

  // ==================== Review Emails ====================

  async sendReviewReminderEmail(
    email: string,
    name: string,
    repairerName: string,
    deviceInfo: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] Laissez votre avis!`,
      html: this.getReviewReminderTemplate(name, repairerName, deviceInfo),
    });
  }

  // ==================== Dispute Emails ====================

  async sendDisputeCreatedEmail(
    email: string,
    name: string,
    disputeId: string,
    reason: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] Litige créé`,
      html: this.getDisputeCreatedTemplate(name, disputeId, reason),
    });
  }

  async sendDisputeResolvedEmail(
    email: string,
    name: string,
    resolution: string,
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `[${this.appName}] Litige résolu`,
      html: this.getDisputeResolvedTemplate(name, resolution),
    });
  }

  // ==================== Private Methods ====================

  private async sendEmail(options: EmailOptions): Promise<EmailResult> {
    this.logger.debug(`Sending email to ${options.to}: ${options.subject}`);
    const result = await this.provider.sendEmail({
      ...options,
      from: options.from || this.fromEmail,
    });

    if (!result.success) {
      this.logger.error(`Email failed to ${options.to}: ${result.error}`);
    }

    return result;
  }

  // ==================== Email Templates ====================

  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.appName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%); padding: 30px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .btn { display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .highlight { background: #FFF4E6; padding: 15px; border-radius: 8px; border-left: 4px solid #FF6B35; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: 700; color: #FF6B35; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${this.appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${this.appName}. Tous droits réservés.</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getWelcomeTemplate(firstName: string): string {
    return this.getBaseTemplate(`
      <h2>Bienvenue ${firstName}!</h2>
      <p>Nous sommes ravis de vous accueillir sur ${this.appName}, votre plateforme de réparation de téléphones en Côte d'Ivoire.</p>
      <div class="highlight">
        <strong>Que pouvez-vous faire?</strong>
        <ul>
          <li>Trouver des réparateurs qualifiés près de chez vous</li>
          <li>Comparer les devis et choisir le meilleur</li>
          <li>Suivre votre réparation en temps réel</li>
          <li>Payer en toute sécurité</li>
        </ul>
      </div>
      <p style="text-align: center;">
        <a href="#" class="btn">Commencer</a>
      </p>
    `);
  }

  private getOtpTemplate(code: string): string {
    return this.getBaseTemplate(`
      <h2>Votre code de vérification</h2>
      <p>Utilisez le code suivant pour vérifier votre compte:</p>
      <div class="highlight" style="text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FF6B35;">${code}</span>
      </div>
      <p><strong>Ce code expire dans 5 minutes.</strong></p>
      <p style="font-size: 12px; color: #6b7280;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
    `);
  }

  private getPasswordResetTemplate(resetLink: string): string {
    return this.getBaseTemplate(`
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="btn">Réinitialiser le mot de passe</a>
      </p>
      <p><strong>Ce lien expire dans 1 heure.</strong></p>
      <p style="font-size: 12px; color: #6b7280;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `);
  }

  private getNewQuoteTemplate(
    clientName: string,
    repairerName: string,
    amount: number,
    deviceInfo: string,
  ): string {
    return this.getBaseTemplate(`
      <h2>Nouveau devis reçu!</h2>
      <p>Bonjour ${clientName},</p>
      <p><strong>${repairerName}</strong> vous a envoyé un devis pour la réparation de votre <strong>${deviceInfo}</strong>.</p>
      <div class="highlight">
        <p style="margin: 0;">Montant proposé:</p>
        <p class="amount">${amount.toLocaleString('fr-FR')} FCFA</p>
      </div>
      <p style="text-align: center;">
        <a href="#" class="btn">Voir le devis</a>
      </p>
    `);
  }

  private getQuoteAcceptedTemplate(
    repairerName: string,
    clientName: string,
    deviceInfo: string,
  ): string {
    return this.getBaseTemplate(`
      <h2>Devis accepté!</h2>
      <p>Bonjour ${repairerName},</p>
      <p>Bonne nouvelle! <strong>${clientName}</strong> a accepté votre devis pour la réparation du <strong>${deviceInfo}</strong>.</p>
      <div class="highlight">
        <p>Vous pouvez maintenant commencer la réparation et mettre à jour le statut depuis votre tableau de bord.</p>
      </div>
      <p style="text-align: center;">
        <a href="#" class="btn">Voir la demande</a>
      </p>
    `);
  }

  private getPaymentConfirmationTemplate(
    name: string,
    amount: number,
    transactionRef: string,
    deviceInfo: string,
  ): string {
    return this.getBaseTemplate(`
      <h2>Paiement confirmé!</h2>
      <p>Bonjour ${name},</p>
      <p>Votre paiement a été effectué avec succès.</p>
      <div class="highlight">
        <p><strong>Appareil:</strong> ${deviceInfo}</p>
        <p><strong>Montant:</strong> <span class="amount">${amount.toLocaleString('fr-FR')} FCFA</span></p>
        <p><strong>Référence:</strong> ${transactionRef}</p>
      </div>
      <p>Conservez cet email comme preuve de paiement.</p>
    `);
  }

  private getPaymentReceivedTemplate(
    repairerName: string,
    amount: number,
    clientName: string,
  ): string {
    return this.getBaseTemplate(`
      <h2>Paiement reçu!</h2>
      <p>Bonjour ${repairerName},</p>
      <p>Vous avez reçu un paiement de <strong>${clientName}</strong>.</p>
      <div class="highlight">
        <p style="margin: 0;">Montant:</p>
        <p class="amount">${amount.toLocaleString('fr-FR')} FCFA</p>
      </div>
      <p>Le montant sera versé sur votre compte après déduction de la commission.</p>
    `);
  }

  private getRepairStatusTemplate(name: string, message: string, deviceInfo: string): string {
    return this.getBaseTemplate(`
      <h2>Mise à jour de votre réparation</h2>
      <p>Bonjour ${name},</p>
      <div class="highlight">
        <p><strong>Appareil:</strong> ${deviceInfo}</p>
        <p>${message}</p>
      </div>
      <p style="text-align: center;">
        <a href="#" class="btn">Suivre ma réparation</a>
      </p>
    `);
  }

  private getReviewReminderTemplate(
    name: string,
    repairerName: string,
    deviceInfo: string,
  ): string {
    return this.getBaseTemplate(`
      <h2>Partagez votre expérience!</h2>
      <p>Bonjour ${name},</p>
      <p>Votre réparation de <strong>${deviceInfo}</strong> par <strong>${repairerName}</strong> est terminée.</p>
      <div class="highlight">
        <p>Votre avis est précieux! Il aide les autres utilisateurs à choisir le bon réparateur.</p>
      </div>
      <p style="text-align: center;">
        <a href="#" class="btn">Laisser un avis</a>
      </p>
    `);
  }

  private getDisputeCreatedTemplate(name: string, disputeId: string, reason: string): string {
    return this.getBaseTemplate(`
      <h2>Litige créé</h2>
      <p>Bonjour ${name},</p>
      <p>Votre litige a bien été enregistré.</p>
      <div class="highlight">
        <p><strong>Référence:</strong> ${disputeId}</p>
        <p><strong>Motif:</strong> ${reason}</p>
      </div>
      <p>Notre équipe examinera votre demande dans les plus brefs délais (généralement sous 48h).</p>
    `);
  }

  private getDisputeResolvedTemplate(name: string, resolution: string): string {
    return this.getBaseTemplate(`
      <h2>Litige résolu</h2>
      <p>Bonjour ${name},</p>
      <p>Votre litige a été examiné et résolu.</p>
      <div class="highlight">
        <p><strong>Résolution:</strong> ${resolution}</p>
      </div>
      <p>Si vous avez des questions, n'hésitez pas à contacter notre support.</p>
    `);
  }
}

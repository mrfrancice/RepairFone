import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { FileUploadService } from './services/file-upload.service';
import { FirebaseService } from './services/firebase.service';

/**
 * CommonModule provides shared services across the application.
 *
 * Services included:
 * - SmsService: Send SMS (Twilio, Orange, Mock)
 * - EmailService: Send emails (SMTP, SendGrid, Mock)
 * - FileUploadService: Upload files (Local, S3, Cloudinary)
 * - FirebaseService: Firebase Auth + FCM Push Notifications
 *
 * Note: AuditService is managed by AuditModule (requires TypeORM + REQUEST scope)
 *
 * This module is marked as @Global so services are available
 * everywhere without explicit imports.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SmsService, EmailService, FileUploadService, FirebaseService],
  exports: [SmsService, EmailService, FileUploadService, FirebaseService],
})
export class CommonModule {}

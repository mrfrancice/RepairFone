import { Module, forwardRef } from '@nestjs/common';
import { QuoteListener } from './quote.listener';
import { PaymentListener } from './payment.listener';
import { RequestListener } from './request.listener';
import { ReviewListener } from './review.listener';
import { NotificationsModule } from '../../modules/notifications/notifications.module';
import { UsersModule } from '../../modules/users/users.module';

/**
 * Module that registers all event listeners
 * These listeners handle cross-entity mutations in a decoupled way
 */
@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => UsersModule),
  ],
  providers: [
    QuoteListener,
    PaymentListener,
    RequestListener,
    ReviewListener,
  ],
  exports: [
    QuoteListener,
    PaymentListener,
    RequestListener,
    ReviewListener,
  ],
})
export class ListenersModule {}

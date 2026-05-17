import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseUser {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
}

export interface PushNotificationResult {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  failedTokens?: string[];
  error?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured. Phone auth will use fallback OTP system.',
      );
      return;
    }

    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.app = admin.apps[0]!;
        this.logger.log('Firebase Admin SDK already initialized');
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  isInitialized(): boolean {
    return this.app !== null;
  }

  /**
   * Verify a Firebase ID token and return the decoded user info
   */
  async verifyIdToken(idToken: string): Promise<FirebaseUser | null> {
    if (!this.app) {
      this.logger.warn('Firebase not initialized, cannot verify token');
      return null;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      return {
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number,
        email: decodedToken.email,
        displayName: decodedToken.name as string | undefined,
      };
    } catch (error) {
      this.logger.error(
        `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Get user by phone number from Firebase
   */
  async getUserByPhone(phoneNumber: string): Promise<FirebaseUser | null> {
    if (!this.app) {
      return null;
    }

    try {
      const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
      return {
        uid: userRecord.uid,
        phoneNumber: userRecord.phoneNumber,
        email: userRecord.email,
        displayName: userRecord.displayName,
      };
    } catch (error) {
      // User not found is expected for new users
      if ((error as { code?: string }).code === 'auth/user-not-found') {
        return null;
      }
      this.logger.error(
        `Get user by phone failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Create a custom token for a user (for backend-initiated auth)
   */
  async createCustomToken(
    uid: string,
    claims?: Record<string, any>,
  ): Promise<string | null> {
    if (!this.app) {
      return null;
    }

    try {
      return await admin.auth().createCustomToken(uid, claims);
    } catch (error) {
      this.logger.error(
        `Create custom token failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Revoke all refresh tokens for a user (for logout)
   */
  async revokeRefreshTokens(uid: string): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      await admin.auth().revokeRefreshTokens(uid);
      return true;
    } catch (error) {
      this.logger.error(
        `Revoke tokens failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  // ==================== Push Notifications (FCM) ====================

  /**
   * Send a push notification to a single device
   */
  async sendPushNotification(
    token: string,
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    if (!this.app) {
      this.logger.warn(
        'Firebase not initialized, cannot send push notification',
      );
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            ...(payload.badge !== undefined && {
              notificationCount: payload.badge,
            }),
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              ...(payload.badge !== undefined && { badge: payload.badge }),
            },
          },
        },
        webpush: {
          notification: {
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/badge-72x72.png',
          },
        },
      };

      await admin.messaging().send(message);
      this.logger.log(
        `Push notification sent to token: ${token.substring(0, 20)}...`,
      );

      return { success: true, successCount: 1 };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Push notification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendMulticastPush(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    if (!this.app) {
      return { success: false, error: 'Firebase not initialized' };
    }

    if (tokens.length === 0) {
      return { success: true, successCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Collect failed tokens for cleanup
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      this.logger.log(
        `Multicast push: ${response.successCount} sent, ${response.failureCount} failed`,
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Multicast push failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Subscribe a device to a topic (for broadcast notifications)
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    if (!this.app) return false;

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      this.logger.log(`Device subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Subscribe to topic failed: ${error}`);
      return false;
    }
  }

  /**
   * Unsubscribe a device from a topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    if (!this.app) return false;

    try {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      return true;
    } catch (error) {
      this.logger.error(`Unsubscribe from topic failed: ${error}`);
      return false;
    }
  }

  /**
   * Send a notification to all devices subscribed to a topic
   */
  async sendTopicNotification(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    if (!this.app) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      await admin.messaging().send(message);
      this.logger.log(`Topic notification sent to: ${topic}`);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Topic notification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  // ==================== RepairFone Specific Notifications ====================

  /**
   * Notify client of a new quote received
   */
  async notifyNewQuote(
    token: string,
    repairerName: string,
    deviceModel: string,
    amount: number,
    quoteId: string,
  ): Promise<PushNotificationResult> {
    return this.sendPushNotification(token, {
      title: 'Nouveau devis reçu',
      body: `${repairerName} vous a envoyé un devis de ${amount.toLocaleString('fr-FR')} FCFA pour votre ${deviceModel}`,
      data: {
        type: 'new_quote',
        quoteId,
        action: 'view_quote',
      },
    });
  }

  /**
   * Notify repairer of quote acceptance
   */
  async notifyQuoteAccepted(
    token: string,
    clientName: string,
    deviceModel: string,
    quoteId: string,
    requestId: string,
  ): Promise<PushNotificationResult> {
    return this.sendPushNotification(token, {
      title: 'Devis accepté !',
      body: `${clientName} a accepté votre devis pour la réparation du ${deviceModel}`,
      data: {
        type: 'quote_accepted',
        quoteId,
        requestId,
        action: 'view_request',
      },
    });
  }

  /**
   * Notify client of repair status change
   */
  async notifyRepairStatus(
    token: string,
    status: string,
    deviceModel: string,
    requestId: string,
    message?: string,
  ): Promise<PushNotificationResult> {
    const statusMessages: Record<string, string> = {
      in_progress: 'La réparation de votre appareil a commencé',
      awaiting_parts: 'En attente de pièces détachées',
      ready: 'Votre appareil est prêt à être récupéré !',
      completed: 'Réparation terminée avec succès',
    };

    return this.sendPushNotification(token, {
      title: `Mise à jour: ${deviceModel}`,
      body: message || statusMessages[status] || `Statut: ${status}`,
      data: {
        type: 'repair_status',
        status,
        requestId,
        action: 'view_tracking',
      },
    });
  }

  /**
   * Notify of payment received
   */
  async notifyPaymentReceived(
    token: string,
    amount: number,
    paymentId: string,
  ): Promise<PushNotificationResult> {
    return this.sendPushNotification(token, {
      title: 'Paiement reçu',
      body: `Votre paiement de ${amount.toLocaleString('fr-FR')} FCFA a été confirmé`,
      data: {
        type: 'payment_received',
        paymentId,
        action: 'view_payment',
      },
    });
  }

  /**
   * Notify of new chat message
   */
  async notifyNewMessage(
    token: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
  ): Promise<PushNotificationResult> {
    return this.sendPushNotification(token, {
      title: senderName,
      body:
        messagePreview.length > 100
          ? messagePreview.substring(0, 97) + '...'
          : messagePreview,
      data: {
        type: 'new_message',
        conversationId,
        action: 'open_chat',
      },
    });
  }

  /**
   * Notify repairer of new repair request in their area
   */
  async notifyNewRequest(
    token: string,
    deviceModel: string,
    problemType: string,
    distance: string,
    requestId: string,
  ): Promise<PushNotificationResult> {
    return this.sendPushNotification(token, {
      title: 'Nouvelle demande de réparation',
      body: `${deviceModel} - ${problemType} (${distance})`,
      data: {
        type: 'new_request',
        requestId,
        action: 'view_request',
      },
    });
  }

  /**
   * Notify of dispute update
   */
  async notifyDisputeUpdate(
    token: string,
    disputeStatus: string,
    disputeId: string,
    message?: string,
  ): Promise<PushNotificationResult> {
    const statusMessages: Record<string, string> = {
      investigating: "Votre litige est en cours d'investigation",
      resolved: 'Votre litige a été résolu',
      closed: 'Le litige a été clôturé',
    };

    return this.sendPushNotification(token, {
      title: 'Mise à jour du litige',
      body:
        message ||
        statusMessages[disputeStatus] ||
        'Mise à jour de votre litige',
      data: {
        type: 'dispute_update',
        disputeId,
        action: 'view_dispute',
      },
    });
  }

  /**
   * Send reminder notification
   */
  async sendReminder(
    token: string,
    title: string,
    body: string,
    actionType: string,
    actionId: string,
  ): Promise<PushNotificationResult> {
    return this.sendPushNotification(token, {
      title,
      body,
      data: {
        type: 'reminder',
        actionType,
        actionId,
      },
    });
  }
}

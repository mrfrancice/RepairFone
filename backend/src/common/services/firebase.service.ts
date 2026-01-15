import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface FirebaseUser {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
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
      this.logger.warn('Firebase credentials not configured. Phone auth will use fallback OTP system.');
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
      this.logger.error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        displayName: decodedToken.name,
      };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      if ((error as any).code === 'auth/user-not-found') {
        return null;
      }
      this.logger.error(`Get user by phone failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Create a custom token for a user (for backend-initiated auth)
   */
  async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string | null> {
    if (!this.app) {
      return null;
    }

    try {
      return await admin.auth().createCustomToken(uid, claims);
    } catch (error) {
      this.logger.error(`Create custom token failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      this.logger.error(`Revoke tokens failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
}

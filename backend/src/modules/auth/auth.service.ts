import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RepairersService } from '../users/repairers.service';
import { User, UserRole } from '../users/entities/user.entity';
import { OtpCode } from './entities/otp.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { SmsService } from '../../common/services/sms.service';
import { EmailService } from '../../common/services/email.service';
import { FirebaseService } from '../../common/services/firebase.service';
import { RegisterDto, LoginDto, RepairerProfileDto } from './dto';
import { AUTH, BUSINESS, SUCCESS_MESSAGES, HTTP_MESSAGES } from '../../common/constants';

// Re-export DTOs for backward compatibility
export { RegisterDto, LoginDto, RepairerProfileDto } from './dto';

/**
 * Authentication tokens returned after successful login/registration
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly repairersService: RepairersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationRepository: Repository<EmailVerificationToken>,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; message: string; devCode?: string }> {
    this.logger.log(`Registration attempt for phone: ${dto.phone.slice(0, -4)}****`);

    // Check if phone already exists
    const existingUser = await this.usersService.findByPhone(dto.phone);
    if (existingUser) {
      this.logger.warn(`Registration failed: phone already exists ${dto.phone.slice(0, -4)}****`);
      throw new ConflictException('Ce numero de telephone est deja utilise');
    }

    // Hash password using centralized constant
    const passwordHash = await bcrypt.hash(dto.password, AUTH.PASSWORD_SALT_ROUNDS);

    // Create user
    const user = await this.usersService.create({
      phone: dto.phone,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role || UserRole.CLIENT,
    });

    // Create repairer profile if role is repairer
    if (dto.role === UserRole.REPAIRER && dto.repairerProfile) {
      const profileData = dto.repairerProfile;
      await this.repairersService.create(user.id, {
        // Personal identification
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
        nationalIdNumber: profileData.nationalIdNumber,
        personalAddress: profileData.personalAddress,

        // Business information
        businessName: profileData.businessName,
        description: profileData.description,
        businessType: profileData.businessType,
        rccmNumber: profileData.rccmNumber,
        taxId: profileData.taxId,
        businessPhone: profileData.businessPhone,
        businessEmail: profileData.businessEmail,

        // Shop location
        address: profileData.address,
        city: profileData.city || BUSINESS.DEFAULT_CITY,
        commune: profileData.commune,
        quarter: profileData.quarter,
        landmark: profileData.landmark,
        latitude: profileData.latitude,
        longitude: profileData.longitude,

        // Shop details
        specialties: profileData.specialties || [],
        yearsOfExperience: profileData.yearsOfExperience,
        acceptsHomeService: profileData.acceptsHomeService || false,
        homeServiceRadiusKm: profileData.homeServiceRadiusKm || BUSINESS.DEFAULT_HOME_SERVICE_RADIUS_KM,
      });
    }

    // Generate and send OTP
    const otpResult = await this.generateOtp(dto.phone);

    return {
      user,
      message: SUCCESS_MESSAGES.ACCOUNT_CREATED,
      ...(otpResult.devCode && { devCode: otpResult.devCode }),
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    // Use centralized authentication constants
    const { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES } = AUTH;

    this.logger.log(`Login attempt for phone: ${dto.phone.slice(0, -4)}****`);

    const user = await this.usersService.findByPhone(dto.phone);

    if (!user) {
      this.logger.warn(`Login failed: user not found ${dto.phone.slice(0, -4)}****`);
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (1000 * 60)
      );
      this.logger.warn(`Login blocked: account locked for user ${user.id}`);
      throw new UnauthorizedException(
        `Compte temporairement verrouille. Reessayez dans ${remainingMinutes} minute(s).`
      );
    }

    // Reset lock if lockout period has passed
    if (user.lockedUntil && new Date() >= new Date(user.lockedUntil)) {
      await this.usersService.resetLoginAttempts(user.id);
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock the account
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.usersService.lockAccount(user.id, lockUntil, newAttempts);
        this.logger.warn(`Account locked due to too many failed attempts: ${user.id}`);
        throw new UnauthorizedException(
          `Trop de tentatives echouees. Compte verrouille pour ${LOCKOUT_DURATION_MINUTES} minutes.`
        );
      }

      await this.usersService.incrementFailedAttempts(user.id, newAttempts);
      const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
      this.logger.warn(`Login failed: invalid password for user ${user.id}, ${remainingAttempts} attempts remaining`);
      throw new UnauthorizedException(
        `Identifiants incorrects. ${remainingAttempts} tentative(s) restante(s).`
      );
    }

    if (!user.isPhoneVerified) {
      this.logger.warn(`Login failed: phone not verified for user ${user.id}`);
      throw new UnauthorizedException('Veuillez d\'abord verifier votre numero de telephone');
    }

    if (user.status === 'suspended') {
      this.logger.warn(`Login failed: account suspended for user ${user.id}`);
      throw new UnauthorizedException('Votre compte est suspendu');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.usersService.resetLoginAttempts(user.id);
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);
    this.logger.log(`Login successful for user ${user.id}`);

    return this.generateTokens(user);
  }

  async generateOtp(phone: string): Promise<{ message: string; devCode?: string }> {
    // SEC-002: Use crypto.randomInt for cryptographically secure OTP generation
    // Generate 6-digit code using secure random (100000 to 999999)
    const min = Math.pow(10, 5); // 100000
    const max = Math.pow(10, 6); // 1000000
    const code = crypto.randomInt(min, max).toString();

    // Delete existing OTP for this phone
    await this.otpRepository.delete({ phone });

    // Create new OTP using centralized constant as fallback
    const expirationMinutes = this.configService.get<number>('otp.expirationMinutes') || AUTH.OTP_EXPIRATION_MINUTES;
    const otp = this.otpRepository.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    });
    await this.otpRepository.save(otp);

    // Send OTP via SMS (canal principal)
    const isDev = this.configService.get<string>('nodeEnv') === 'development';
    const smsResult = await this.smsService.sendOtp(phone, code);

    // Fallback / canal secondaire : si l'user a un email enregistré, on
    // envoie aussi l'OTP par email. Permet de fonctionner sans SMS configuré
    // (mode mock / pas de provider SMS en CI gratuit). Fire-and-forget,
    // on ne bloque pas la réponse sur le mail.
    const user = await this.usersService.findByPhone(phone).catch(() => null);
    if (user?.email) {
      this.emailService
        .sendOtpEmail(user.email, code)
        .catch((err) => this.logger.error(`OTP email fallback échoué pour ${user.email}: ${err?.message ?? err}`));
    }

    // En prod, on tolère un SMS qui échoue SI l'email a pu être envoyé
    // (sinon l'user serait bloqué — ex: provider SMS down). On ne sait pas
    // encore le résultat du mail (fire-and-forget), donc on accepte si :
    //   - SMS OK, OU
    //   - on est en dev, OU
    //   - l'user a un email (le mail compense le SMS HS).
    const hasEmailFallback = !!user?.email;
    if (!smsResult.success && !isDev && !hasEmailFallback) {
      throw new BadRequestException(HTTP_MESSAGES.BAD_REQUEST.INVALID_OTP);
    }

    // Return OTP in development mode only (for testing)
    return {
      message: SUCCESS_MESSAGES.OTP_SENT,
      ...(isDev && { devCode: code }),
    };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthTokens> {
    const otp = await this.otpRepository.findOne({
      where: {
        phone,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!otp) {
      throw new BadRequestException('Code OTP invalide ou expiré');
    }

    const maxAttempts = this.configService.get<number>('otp.maxAttempts') || 3;

    // Increment attempts counter BEFORE verification
    otp.attempts += 1;
    await this.otpRepository.save(otp);

    // Check if max attempts exceeded
    if (otp.attempts > maxAttempts) {
      throw new BadRequestException('Nombre maximum de tentatives atteint');
    }

    // SEC-001: Use timing-safe comparison to prevent timing attacks
    // crypto.timingSafeEqual requires buffers of equal length
    const storedCodeBuffer = Buffer.from(otp.code.padEnd(6, '0'));
    const providedCodeBuffer = Buffer.from(code.padEnd(6, '0'));
    const isCodeValid = crypto.timingSafeEqual(storedCodeBuffer, providedCodeBuffer);

    if (!isCodeValid) {
      throw new BadRequestException('Code OTP invalide');
    }

    // Mark OTP as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    // Find and verify user
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    await this.usersService.verifyPhone(user.id);

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find all non-revoked, non-expired tokens for comparison
    const storedTokens = await this.refreshTokenRepository.find({
      where: {
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    // Compare the provided token against each stored hash
    let validToken: RefreshToken | null = null;
    for (const token of storedTokens) {
      const isValid = await bcrypt.compare(refreshToken, token.tokenHash);
      if (isValid) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    // Revoke old token
    validToken.isRevoked = true;
    await this.refreshTokenRepository.save(validToken);

    return this.generateTokens(validToken.user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token using centralized constant
    const refreshTokenExpirySeconds = AUTH.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshTokenExpirySeconds,
    });

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, AUTH.REFRESH_TOKEN_SALT_ROUNDS);
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + refreshTokenExpirySeconds * 1000),
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
    };
  }

  /**
   * Authenticate using Firebase Phone Auth
   * Creates user if doesn't exist, otherwise logs in
   */
  async authenticateWithFirebase(idToken: string, displayName?: string): Promise<AuthTokens> {
    this.logger.log('Firebase authentication attempt');

    // Verify Firebase ID token
    const firebaseUser = await this.firebaseService.verifyIdToken(idToken);

    if (!firebaseUser || !firebaseUser.phoneNumber) {
      throw new UnauthorizedException('Token Firebase invalide ou numéro de téléphone manquant');
    }

    const phone = firebaseUser.phoneNumber;
    this.logger.log(`Firebase auth for phone: ${phone.slice(0, -4)}****`);

    // Check if user exists
    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      // Create new user
      this.logger.log('Creating new user from Firebase auth');

      // Parse name if provided
      let firstName: string | undefined;
      let lastName: string | undefined;
      const nameToUse = displayName || firebaseUser.displayName;

      if (nameToUse) {
        const nameParts = nameToUse.trim().split(/\s+/);
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || undefined;
      }

      // Generate a random password hash (user won't need it with Firebase auth)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await this.usersService.create({
        phone,
        passwordHash,
        firstName,
        lastName,
        role: UserRole.CLIENT,
        isPhoneVerified: true, // Phone is verified via Firebase
        firebaseUid: firebaseUser.uid,
      });

      this.logger.log(`User created via Firebase: ${user.id}`);
    } else {
      // Update Firebase UID if not set
      if (!user.firebaseUid) {
        await this.usersService.update(user.id, { firebaseUid: firebaseUser.uid });
      }

      // Ensure phone is marked as verified
      if (!user.isPhoneVerified) {
        await this.usersService.verifyPhone(user.id);
      }
    }

    // Reset failed login attempts
    await this.usersService.resetLoginAttempts(user.id);

    return this.generateTokens(user);
  }

  /**
   * Check if Firebase is available for phone auth
   */
  isFirebaseEnabled(): boolean {
    return this.firebaseService.isInitialized();
  }

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  /**
   * Demande de réinitialisation de mot de passe.
   *
   * SÉCURITÉ : on retourne TOUJOURS un succès générique, même si
   * l'email/téléphone est inconnu — évite l'énumération de comptes.
   * Le mail n'est envoyé que si l'utilisateur existe.
   *
   * Le token est 32 bytes hex (256 bits d'entropie), stocké hashé en DB.
   * Expiration : 1h. Limité à 1 demande active par user (les anciennes
   * sont supprimées avant insertion).
   */
  async requestPasswordReset(
    identifier: string,
    requestIp?: string,
  ): Promise<{ message: string; devToken?: string }> {
    const isDev = this.configService.get<string>('nodeEnv') === 'development';
    const success = {
      message:
        'Si un compte existe avec ces informations, un email de réinitialisation a été envoyé.',
    };

    // Cherche l'user par téléphone OU email
    const normalizedPhone = identifier.replace(/\s/g, '');
    const user =
      (await this.usersService.findByPhone(normalizedPhone).catch(() => null)) ||
      (await this.usersService.findByEmail(identifier).catch(() => null));

    if (!user) {
      this.logger.log(`Password reset requested for unknown identifier: ${identifier.slice(0, 4)}***`);
      // Réponse identique pour ne pas leaker l'existence du compte.
      return success;
    }

    // Génération du token brut (32 bytes hex = 64 chars) + hash SHA-256.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Invalide les anciens tokens du même user (1 demande active à la fois).
    await this.passwordResetRepository.delete({ userId: user.id });

    await this.passwordResetRepository.save(
      this.passwordResetRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        requestIp,
      }),
    );

    // Envoi du mail si l'user a un email (sinon on n'a pas de canal).
    if (user.email) {
      const frontUrl =
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
      const resetLink = `${frontUrl}/auth/reset-password?token=${rawToken}`;
      this.emailService
        .sendPasswordResetEmail(user.email, resetLink)
        .catch((err) =>
          this.logger.error(`Reset email failed for ${user.email}: ${err?.message ?? err}`),
        );
    } else {
      this.logger.warn(`User ${user.id} has no email — reset link cannot be delivered`);
    }

    this.logger.log(`Password reset token created for user ${user.id}`);
    return {
      ...success,
      ...(isDev && { devToken: rawToken }),
    };
  }

  /**
   * Réinitialise le mot de passe à partir d'un token valide.
   *
   * SÉCURITÉ :
   * - Token comparé en hash SHA-256 (jamais en clair en DB).
   * - Vérifie expiration + non-réutilisé (usedAt null).
   * - Marque le token comme utilisé après succès.
   * - Révoque tous les refresh tokens de l'user → toutes les sessions
   *   actives sont déconnectées (force le re-login partout).
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    if (!rawToken || rawToken.length < 32) {
      throw new BadRequestException('Token invalide');
    }
    const minLength = 8;
    if (!newPassword || newPassword.length < minLength) {
      throw new BadRequestException(
        `Le mot de passe doit contenir au moins ${minLength} caractères`,
      );
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.passwordResetRepository.findOne({ where: { tokenHash } });

    if (!record) {
      throw new BadRequestException('Token invalide ou expiré');
    }
    if (record.usedAt) {
      throw new BadRequestException('Ce lien a déjà été utilisé');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Ce lien a expiré');
    }

    // Mise à jour du mot de passe (UsersService.updatePassword hashe en interne)
    await this.usersService.updatePassword(record.userId, newPassword);

    // Marquer le token utilisé (audit trail)
    record.usedAt = new Date();
    await this.passwordResetRepository.save(record);

    // Révoque toutes les sessions actives — sécurité standard après reset.
    await this.refreshTokenRepository.update(
      { userId: record.userId, isRevoked: false },
      { isRevoked: true },
    );

    this.logger.log(`Password reset successful for user ${record.userId}`);
    return { message: 'Mot de passe réinitialisé. Reconnectez-vous.' };
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  /**
   * Génère + envoie un email de vérification à l'user courant.
   * Idempotent : si un token actif existe, on le remplace.
   */
  async sendEmailVerification(
    userId: string,
  ): Promise<{ message: string; devToken?: string }> {
    const isDev = this.configService.get<string>('nodeEnv') === 'development';
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    if (!user.email) {
      throw new BadRequestException("Cet utilisateur n'a pas d'email enregistré");
    }
    if (user.isEmailVerified) {
      return { message: 'Email déjà vérifié.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.emailVerificationRepository.delete({ userId });

    await this.emailVerificationRepository.save(
      this.emailVerificationRepository.create({
        userId,
        email: user.email,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      }),
    );

    const frontUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const verifyLink = `${frontUrl}/auth/verify-email?token=${rawToken}`;
    this.emailService
      .sendEmailVerificationEmail(user.email, verifyLink)
      .catch((err) =>
        this.logger.error(
          `Verification email failed for ${user.email}: ${err?.message ?? err}`,
        ),
      );

    this.logger.log(`Email verification token sent to user ${userId}`);
    return {
      message: 'Email de vérification envoyé. Vérifiez votre boîte mail.',
      ...(isDev && { devToken: rawToken }),
    };
  }

  /**
   * Valide un token de vérification email et marque l'user comme vérifié.
   */
  async verifyEmail(rawToken: string): Promise<{ message: string; email: string }> {
    if (!rawToken || rawToken.length < 32) {
      throw new BadRequestException('Token invalide');
    }
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.emailVerificationRepository.findOne({ where: { tokenHash } });
    if (!record) {
      throw new BadRequestException('Token invalide ou expiré');
    }
    if (record.usedAt) {
      throw new BadRequestException('Ce lien a déjà été utilisé');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Ce lien a expiré');
    }

    await this.usersService.verifyEmail(record.userId);

    record.usedAt = new Date();
    await this.emailVerificationRepository.save(record);

    this.logger.log(`Email verified for user ${record.userId} (${record.email})`);
    return { message: 'Email vérifié avec succès.', email: record.email };
  }
}

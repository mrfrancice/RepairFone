import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { IsStrongPassword } from '../../common/validators/password.validator';
import { UsersService } from '../users/users.service';
import { RepairersService } from '../users/repairers.service';
import { User, UserRole } from '../users/entities/user.entity';
import { OtpCode } from './entities/otp.entity';
import { RefreshToken } from './entities/refresh-token.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RepairerProfileDto {
  // Personal identification
  dateOfBirth?: string;
  nationalIdNumber?: string;
  personalAddress?: string;

  // Business information
  businessName: string;
  description?: string;
  businessType?: string;
  rccmNumber?: string;
  taxId?: string;
  businessPhone?: string;
  businessEmail?: string;

  // Shop location
  address: string;
  city?: string;
  commune?: string;
  quarter?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;

  // Shop details
  specialties?: string[];
  yearsOfExperience?: number;
  acceptsHomeService?: boolean;
  homeServiceRadiusKm?: number;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  // Repairer profile data (only for repairer role)
  @IsOptional()
  repairerProfile?: RepairerProfileDto;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly repairersService: RepairersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; message: string; devCode?: string }> {
    // Check if phone already exists
    const existingUser = await this.usersService.findByPhone(dto.phone);
    if (existingUser) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

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
        city: profileData.city || 'Abidjan',
        commune: profileData.commune,
        quarter: profileData.quarter,
        landmark: profileData.landmark,
        latitude: profileData.latitude,
        longitude: profileData.longitude,

        // Shop details
        specialties: profileData.specialties || [],
        yearsOfExperience: profileData.yearsOfExperience,
        acceptsHomeService: profileData.acceptsHomeService || false,
        homeServiceRadiusKm: profileData.homeServiceRadiusKm || 10,
      });
    }

    // Generate and send OTP
    const otpResult = await this.generateOtp(dto.phone);

    return {
      user,
      message: 'Compte créé. Veuillez vérifier votre téléphone avec le code OTP envoyé.',
      ...(otpResult.devCode && { devCode: otpResult.devCode }),
    };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MINUTES = 30;

    const user = await this.usersService.findByPhone(dto.phone);

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / (1000 * 60)
      );
      throw new UnauthorizedException(
        `Compte temporairement verrouillé. Réessayez dans ${remainingMinutes} minute(s).`
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
        throw new UnauthorizedException(
          `Trop de tentatives échouées. Compte verrouillé pour ${LOCKOUT_DURATION_MINUTES} minutes.`
        );
      }

      await this.usersService.incrementFailedAttempts(user.id, newAttempts);
      const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
      throw new UnauthorizedException(
        `Identifiants incorrects. ${remainingAttempts} tentative(s) restante(s).`
      );
    }

    if (!user.isPhoneVerified) {
      throw new UnauthorizedException('Veuillez d\'abord vérifier votre numéro de téléphone');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException('Votre compte est suspendu');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.usersService.resetLoginAttempts(user.id);
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return this.generateTokens(user);
  }

  async generateOtp(phone: string): Promise<{ message: string; devCode?: string }> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTP for this phone
    await this.otpRepository.delete({ phone });

    // Create new OTP
    const expirationMinutes = this.configService.get<number>('otp.expirationMinutes') || 5;
    const otp = this.otpRepository.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    });
    await this.otpRepository.save(otp);

    // TODO: Send OTP via SMS (integrate with SMS provider)
    const isDev = this.configService.get<string>('nodeEnv') === 'development';
    console.log(`[DEV] OTP for ${phone}: ${code}`);

    // Return OTP in development mode only
    return {
      message: 'Code OTP envoyé',
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

    // Verify the code matches
    if (otp.code !== code) {
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

    // Generate refresh token (7 days in seconds)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: 604800, // 7 days in seconds
    });

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}

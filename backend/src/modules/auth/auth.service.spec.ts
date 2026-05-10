import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService, RegisterDto, LoginDto } from './auth.service';
import { UsersService } from '../users/users.service';
import { RepairersService } from '../users/repairers.service';
import { OtpCode } from './entities/otp.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { SmsService } from '../../common/services/sms.service';
import { FirebaseService } from '../../common/services/firebase.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let repairersService: jest.Mocked<RepairersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let smsService: jest.Mocked<SmsService>;
  let otpRepository: jest.Mocked<Repository<OtpCode>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;

  // Test fixtures
  const mockUser: User = {
    id: 'user-uuid-1',
    phone: '+2250700000001',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.CLIENT,
    status: UserStatus.ACTIVE,
    firstName: 'John',
    lastName: 'Doe',
    isPhoneVerified: true,
    isEmailVerified: false,
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    preferredLanguage: 'fr',
    createdAt: new Date(),
    updatedAt: new Date(),
    get fullName() { return `${this.firstName} ${this.lastName}`; },
  } as User;

  const mockUnverifiedUser: User = {
    ...mockUser,
    id: 'user-uuid-2',
    isPhoneVerified: false,
  } as User;

  const mockSuspendedUser: User = {
    ...mockUser,
    id: 'user-uuid-3',
    status: 'suspended' as UserStatus,
  } as User;

  const mockLockedUser: User = {
    ...mockUser,
    id: 'user-uuid-4',
    failedLoginAttempts: 5,
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
  } as User;

  const mockOtp: OtpCode = {
    id: 'otp-uuid-1',
    phone: '+2250700000001',
    code: '123456',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    isUsed: false,
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as OtpCode;

  const mockRefreshToken: RefreshToken = {
    id: 'refresh-uuid-1',
    userId: 'user-uuid-1',
    tokenHash: 'hashed-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    isRevoked: false,
    deviceInfo: {},
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as RefreshToken;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByPhone: jest.fn(),
            create: jest.fn(),
            verifyPhone: jest.fn(),
            updateLastLogin: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            lockAccount: jest.fn(),
            resetLoginAttempts: jest.fn(),
          },
        },
        {
          provide: RepairersService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendOtp: jest.fn(),
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            verifyIdToken: jest.fn(),
            isInitialized: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: getRepositoryToken(OtpCode),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    repairersService = module.get(RepairersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    smsService = module.get(SmsService);
    otpRepository = module.get(getRepositoryToken(OtpCode));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // REGISTER TESTS
  // ============================================
  describe('register', () => {
    const registerDto: RegisterDto = {
      phone: '+2250700000001',
      password: 'SecureP@ss123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(mockUser);
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.expirationMinutes') return 5;
        if (key === 'nodeEnv') return 'development';
        return null;
      });
      otpRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      otpRepository.create.mockReturnValue(mockOtp);
      otpRepository.save.mockResolvedValue(mockOtp);
      smsService.sendOtp.mockResolvedValue({ success: true });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.user).toEqual(mockUser);
      expect(result.message).toContain('Compte cree');
      expect(usersService.findByPhone).toHaveBeenCalledWith(registerDto.phone);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(usersService.create).toHaveBeenCalledWith({
        phone: registerDto.phone,
        passwordHash: 'hashed-password',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.CLIENT,
      });
    });

    it('should throw ConflictException if phone already exists', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Ce numero de telephone est deja utilise');
    });

    it('should register a repairer with profile', async () => {
      // Arrange
      const repairerDto: RegisterDto = {
        ...registerDto,
        role: UserRole.REPAIRER,
        repairerProfile: {
          businessName: 'Test Repair Shop',
          address: '123 Repair Street',
        },
      };
      const repairerUser = { ...mockUser, role: UserRole.REPAIRER } as User;

      usersService.findByPhone.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(repairerUser);
      repairersService.create.mockResolvedValue({} as any);
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.expirationMinutes') return 5;
        if (key === 'nodeEnv') return 'development';
        return null;
      });
      otpRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      otpRepository.create.mockReturnValue(mockOtp);
      otpRepository.save.mockResolvedValue(mockOtp);
      smsService.sendOtp.mockResolvedValue({ success: true });

      // Act
      const result = await service.register(repairerDto);

      // Assert
      expect(repairersService.create).toHaveBeenCalledWith(
        repairerUser.id,
        expect.objectContaining({
          businessName: 'Test Repair Shop',
          address: '123 Repair Street',
        }),
      );
    });

    it('should return devCode in development mode', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue(mockUser);
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.expirationMinutes') return 5;
        if (key === 'nodeEnv') return 'development';
        return null;
      });
      otpRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      otpRepository.create.mockReturnValue(mockOtp);
      otpRepository.save.mockResolvedValue(mockOtp);
      smsService.sendOtp.mockResolvedValue({ success: true });

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.devCode).toBeDefined();
    });
  });

  // ============================================
  // LOGIN TESTS
  // ============================================
  describe('login', () => {
    const loginDto: LoginDto = {
      phone: '+2250700000001',
      password: 'SecureP@ss123',
    };

    beforeEach(() => {
      // Default mock implementations for generateTokens
      jwtService.sign.mockReturnValue('mock-jwt-token');
      configService.get.mockReturnValue('jwt-refresh-secret');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.resetLoginAttempts.mockResolvedValue(undefined);
      usersService.updateLastLogin.mockResolvedValue(undefined);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Identifiants incorrects');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue({ ...mockUser, failedLoginAttempts: 0 } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.incrementFailedAttempts.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if phone not verified', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(mockUnverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Veuillez d\'abord verifier votre numero de telephone');
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(mockSuspendedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Votre compte est suspendu');
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      // Arrange
      usersService.findByPhone.mockResolvedValue(mockLockedUser);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Arrange
      const userWith4FailedAttempts = { ...mockUser, failedLoginAttempts: 4 } as User;
      usersService.findByPhone.mockResolvedValue(userWith4FailedAttempts);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      usersService.lockAccount.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(usersService.lockAccount).toHaveBeenCalled();
    });

    it('should reset failed attempts on successful login', async () => {
      // Arrange
      const userWithFailedAttempts = { ...mockUser, failedLoginAttempts: 2 } as User;
      usersService.findByPhone.mockResolvedValue(userWithFailedAttempts);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.resetLoginAttempts.mockResolvedValue(undefined);
      usersService.updateLastLogin.mockResolvedValue(undefined);

      // Act
      await service.login(loginDto);

      // Assert
      expect(usersService.resetLoginAttempts).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // ============================================
  // GENERATE OTP TESTS
  // ============================================
  describe('generateOtp', () => {
    const phone = '+2250700000001';

    it('should generate and save OTP code', async () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.expirationMinutes') return 5;
        if (key === 'nodeEnv') return 'production';
        return null;
      });
      otpRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      otpRepository.create.mockReturnValue(mockOtp);
      otpRepository.save.mockResolvedValue(mockOtp);
      smsService.sendOtp.mockResolvedValue({ success: true });

      // Act
      const result = await service.generateOtp(phone);

      // Assert
      expect(result.message).toBe('Code OTP envoye');
      expect(otpRepository.delete).toHaveBeenCalledWith({ phone });
      expect(otpRepository.create).toHaveBeenCalled();
      expect(otpRepository.save).toHaveBeenCalled();
      expect(smsService.sendOtp).toHaveBeenCalledWith(phone, expect.any(String));
    });

    it('should return devCode in development mode', async () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.expirationMinutes') return 5;
        if (key === 'nodeEnv') return 'development';
        return null;
      });
      otpRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      otpRepository.create.mockReturnValue(mockOtp);
      otpRepository.save.mockResolvedValue(mockOtp);
      smsService.sendOtp.mockResolvedValue({ success: true });

      // Act
      const result = await service.generateOtp(phone);

      // Assert
      expect(result.devCode).toBeDefined();
      expect(typeof result.devCode).toBe('string');
      expect(result.devCode?.length).toBe(6);
    });

    it('should throw BadRequestException if SMS fails in production', async () => {
      // Arrange
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.expirationMinutes') return 5;
        if (key === 'nodeEnv') return 'production';
        return null;
      });
      otpRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      otpRepository.create.mockReturnValue(mockOtp);
      otpRepository.save.mockResolvedValue(mockOtp);
      smsService.sendOtp.mockResolvedValue({ success: false });

      // Act & Assert
      await expect(service.generateOtp(phone)).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // VERIFY OTP TESTS
  // ============================================
  describe('verifyOtp', () => {
    const phone = '+2250700000001';
    const code = '123456';

    beforeEach(() => {
      // Default mock implementations for generateTokens
      jwtService.sign.mockReturnValue('mock-jwt-token');
      configService.get.mockReturnValue('jwt-refresh-secret');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
    });

    it('should verify OTP and return tokens', async () => {
      // Arrange
      otpRepository.findOne.mockResolvedValue(mockOtp);
      otpRepository.save.mockResolvedValue({ ...mockOtp, isUsed: true });
      usersService.findByPhone.mockResolvedValue(mockUser);
      usersService.verifyPhone.mockResolvedValue(undefined);
      configService.get.mockImplementation((key: string) => {
        if (key === 'otp.maxAttempts') return 3;
        return 'jwt-secret';
      });

      // Act
      const result = await service.verifyOtp(phone, code);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(usersService.verifyPhone).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException if OTP not found or expired', async () => {
      // Arrange
      otpRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyOtp(phone, code)).rejects.toThrow(BadRequestException);
      await expect(service.verifyOtp(phone, code)).rejects.toThrow('Code OTP invalide ou expiré');
    });

    it('should throw BadRequestException if code does not match', async () => {
      // Arrange
      const otpWithDifferentCode = { ...mockOtp, code: '654321' };
      otpRepository.findOne.mockResolvedValue(otpWithDifferentCode);
      otpRepository.save.mockResolvedValue({ ...otpWithDifferentCode, attempts: 1 });
      configService.get.mockReturnValue(3);

      // Act & Assert
      await expect(service.verifyOtp(phone, code)).rejects.toThrow(BadRequestException);
      await expect(service.verifyOtp(phone, code)).rejects.toThrow('Code OTP invalide');
    });

    it('should throw BadRequestException if max attempts exceeded', async () => {
      // Arrange
      const otpWithMaxAttempts = { ...mockOtp, attempts: 3 };
      otpRepository.findOne.mockResolvedValue(otpWithMaxAttempts);
      otpRepository.save.mockResolvedValue({ ...otpWithMaxAttempts, attempts: 4 });
      configService.get.mockReturnValue(3);

      // Act & Assert
      await expect(service.verifyOtp(phone, code)).rejects.toThrow(BadRequestException);
      await expect(service.verifyOtp(phone, code)).rejects.toThrow('Nombre maximum de tentatives atteint');
    });

    it('should throw BadRequestException if user not found', async () => {
      // Arrange
      otpRepository.findOne.mockResolvedValue(mockOtp);
      otpRepository.save.mockResolvedValue({ ...mockOtp, isUsed: true });
      usersService.findByPhone.mockResolvedValue(null);
      configService.get.mockReturnValue(3);

      // Act & Assert
      await expect(service.verifyOtp(phone, code)).rejects.toThrow(BadRequestException);
      await expect(service.verifyOtp(phone, code)).rejects.toThrow('Utilisateur non trouvé');
    });
  });

  // ============================================
  // REFRESH TOKEN TESTS
  // ============================================
  describe('refreshToken', () => {
    const refreshTokenString = 'valid-refresh-token';

    beforeEach(() => {
      jwtService.sign.mockReturnValue('new-jwt-token');
      configService.get.mockReturnValue('jwt-refresh-secret');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');
      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
    });

    it('should refresh tokens successfully', async () => {
      // Arrange
      refreshTokenRepository.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.refreshToken(refreshTokenString);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isRevoked: true }),
      );
    });

    it('should throw UnauthorizedException if token not found', async () => {
      // Arrange
      refreshTokenRepository.find.mockResolvedValue([]);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenString)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshTokenString)).rejects.toThrow('Token de rafraîchissement invalide');
    });

    it('should throw UnauthorizedException if token does not match any stored hash', async () => {
      // Arrange
      refreshTokenRepository.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.refreshToken(refreshTokenString)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // LOGOUT TESTS
  // ============================================
  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      // Arrange
      const userId = 'user-uuid-1';
      refreshTokenRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      // Act
      await service.logout(userId);

      // Assert
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId, isRevoked: false },
        { isRevoked: true },
      );
    });
  });
});

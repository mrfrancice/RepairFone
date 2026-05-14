import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  SendOtpDto,
  RefreshTokenDto,
  FirebaseAuthDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('send-otp')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.generateOtp(dto.phone);
  }

  @Post('verify-otp')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  @Post('refresh-token')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('firebase')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Firebase Phone Auth' })
  async firebaseAuth(@Body() dto: FirebaseAuthDto) {
    return this.authService.authenticateWithFirebase(
      dto.idToken,
      dto.displayName,
    );
  }

  @Get('firebase/status')
  @Public()
  @ApiOperation({ summary: 'Check if Firebase auth is available' })
  getFirebaseStatus() {
    return {
      enabled: this.authService.isFirebaseEnabled(),
      message: this.authService.isFirebaseEnabled()
        ? 'Firebase Phone Auth is available'
        : 'Firebase not configured, using fallback OTP system',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke tokens' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
  }

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  // 3 demandes max par minute par IP — limite l'énumération + spam mail.
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: 'Demander un email de réinitialisation de mot de passe',
    description:
      "Retourne toujours un message générique pour éviter l'énumération de comptes.",
  })
  async forgotPassword(
    @Body() body: { identifier: string },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.requestPasswordReset(body.identifier, ip);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe avec un token reçu par email',
  })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  @Post('send-verification-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Envoyer (ou renvoyer) l'email de vérification" })
  async sendVerificationEmail(@CurrentUser() user: User) {
    return this.authService.sendEmailVerification(user.id);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Valider un token de vérification d'email reçu par lien",
  })
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }
}

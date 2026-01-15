import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpCode } from './entities/otp.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { SmsService } from '../../common/services/sms.service';
import { FirebaseService } from '../../common/services/firebase.service';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: 900, // 15 minutes in seconds
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OtpCode, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SmsService, FirebaseService],
  exports: [AuthService, FirebaseService],
})
export class AuthModule {}

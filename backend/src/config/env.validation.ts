import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
  MinLength,
  validateSync,
  IsOptional,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = 'api/v1';

  // Database (required)
  @IsString()
  DB_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  // JWT (required, with minimum length)
  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters for security',
  })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRATION: string = '15m';

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters for security',
  })
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_REFRESH_EXPIRATION: string = '7d';

  // OTP
  @IsNumber()
  @Min(1)
  @Max(30)
  OTP_EXPIRATION_MINUTES: number = 5;

  @IsNumber()
  @Min(1)
  @Max(10)
  OTP_MAX_ATTEMPTS: number = 3;

  // SMS Provider (optional in dev, required in prod)
  @IsString()
  @IsOptional()
  SMS_PROVIDER?: string; // 'twilio' | 'orange' | 'mock'

  @IsString()
  @IsOptional()
  SMS_API_KEY?: string;

  @IsString()
  @IsOptional()
  SMS_API_SECRET?: string;

  @IsString()
  @IsOptional()
  SMS_SENDER_ID?: string;

  // CORS
  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS?: string;

  // Throttle
  @IsNumber()
  @IsOptional()
  THROTTLE_TTL?: number;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT?: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'validation failed';
        return `${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  // Additional production checks
  if (validatedConfig.NODE_ENV === Environment.Production) {
    const productionRequired = ['SMS_PROVIDER', 'SMS_API_KEY'];
    const missing = productionRequired.filter(
      (key) => !config[key] || config[key] === '',
    );

    if (missing.length > 0) {
      throw new Error(`Production environment requires: ${missing.join(', ')}`);
    }
  }

  return validatedConfig;
}

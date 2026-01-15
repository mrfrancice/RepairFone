import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/password.validator';
import { UserRole } from '../../users/entities/user.entity';
import { RepairerProfileDto } from './repairer-profile.dto';

/**
 * DTO for user registration
 *
 * Supports both client and repairer registration.
 * For repairers, include the repairerProfile object.
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Phone number (primary identifier)',
    example: '+2250701020304',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Password (min 8 chars, uppercase, lowercase, number, special char)',
    example: 'SecureP@ss123',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Jean',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Kouassi',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User role (defaults to client)',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Repairer profile data (required when role is repairer)',
    type: () => RepairerProfileDto,
  })
  @IsOptional()
  repairerProfile?: RepairerProfileDto;
}

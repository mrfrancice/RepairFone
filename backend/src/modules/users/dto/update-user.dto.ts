import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour la mise à jour du profil utilisateur.
 *
 * SÉCURITÉ: Seuls les champs explicitement listés ici peuvent être modifiés.
 * Les champs sensibles (role, status, passwordHash, etc.) ne sont PAS inclus.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Prénom de l\'utilisateur',
    example: 'Jean',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Dupont',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Adresse email (sera marquée comme non vérifiée après modification)',
    example: 'jean.dupont@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Langue préférée',
    example: 'fr',
    enum: ['fr', 'en'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en'], { message: 'La langue doit être fr ou en' })
  preferredLanguage?: string;
}

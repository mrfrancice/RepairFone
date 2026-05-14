import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for OTP verification
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number that received the OTP',
    example: '+2250701020304',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Six-digit OTP code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  @Matches(/^\d{6}$/, {
    message: 'Le code OTP doit contenir uniquement des chiffres',
  })
  code: string;
}

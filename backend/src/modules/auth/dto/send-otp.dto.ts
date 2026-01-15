import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for requesting OTP
 */
export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number to send OTP to',
    example: '+2250701020304',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Le numero de telephone doit etre valide (10-15 chiffres)',
  })
  phone: string;
}

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user login
 */
export class LoginDto {
  @ApiProperty({
    description: 'Phone number',
    example: '+2250701020304',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ss123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

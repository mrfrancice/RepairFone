import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Firebase Phone Authentication
 */
export class FirebaseAuthDto {
  @ApiProperty({
    description: 'Firebase ID token obtained after phone verification',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({
    description: 'Optional user name for new registrations',
    example: 'Kouassi Jean',
    required: false,
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}

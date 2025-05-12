import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por email' })
  @IsString()
  token: string;

  @ApiProperty({ minLength: 8, description: 'Nueva contraseña' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ format: 'email', description: 'Email de la cuenta a recuperar' })
  @IsEmail()
  email: string;
}

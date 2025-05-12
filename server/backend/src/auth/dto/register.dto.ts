import { IsEmail, IsString, MinLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ 
    description: 'Correo electrónico del usuario', 
    example: 'usuario@ejemplo.com',
    format: 'email' 
  })
  @IsEmail({}, { message: 'Por favor introduce un email válido' })
  email: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario (mínimo 8 caracteres)', 
    example: 'contraseña123',
    minLength: 8 
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ 
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
    minLength: 2
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @ApiProperty({ 
    description: 'Edad del usuario (entre 13 y 120 años)',
    example: 30,
    minimum: 13,
    maximum: 120
  })
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(13, { message: 'La edad mínima es 13 años' })
  @Max(120, { message: 'La edad máxima es 120 años' })
  @Type(() => Number) // Transforma la entrada a número
  age: number;
}
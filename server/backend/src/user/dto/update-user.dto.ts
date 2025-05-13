import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({ 
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  name?: string;

  @ApiProperty({ 
    description: 'Edad del usuario',
    example: 30,
    minimum: 1,
    maximum: 120,
    required: false
  })
  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(1, { message: 'La edad mínima es 1 año' })
  @Max(120, { message: 'La edad máxima es 120 años' })
  @Type(() => Number)
  age?: number;
}
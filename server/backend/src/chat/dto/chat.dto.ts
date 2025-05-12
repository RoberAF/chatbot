import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ 
    description: 'Mensaje del usuario', 
    example: 'Hola, ¿cómo estás?' 
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
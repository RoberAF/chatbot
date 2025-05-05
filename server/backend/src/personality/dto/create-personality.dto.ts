import { IsObject, IsNotEmpty } from 'class-validator';

export class CreatePersonalityDto {
  @IsObject()
  @IsNotEmpty()
  traits: Record<string, any>;
}

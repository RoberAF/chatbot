import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PersonalityService } from './personality.service';
import { CreatePersonalityDto } from './dto/create-personality.dto';

@ApiTags('My Personality')
@Controller('users/me/personalities')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MePersonalityController {
  constructor(private readonly service: PersonalityService) { }

  @Post('random')
  @ApiOperation({ summary: 'Genera una personalidad aleatoria para el user autenticado' })
  @ApiResponse({ status: 201, description: 'Personalidad creada' })
  createRandom(@Req() req: any) {
    const userId = req.user.sub as number;
    return this.service.createRandomTraits(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una personalidad custom para el user autenticado' })
  @ApiResponse({ status: 201, description: 'Personalidad creada' })
  createCustom(
    @Req() req: any,
    @Body() dto: CreatePersonalityDto,
  ) {
    const userId = req.user.sub as number;
    return this.service.createWithTraits(userId, dto.traits);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas las personalidades del user autenticado' })
  @ApiResponse({ status: 200, description: 'Listado de personalidades' })
  list(@Req() req: any) {
    const userId = req.user.sub as number;
    return this.service.listPersonalities(userId);
  }

  @Post(':pid/select')
  @ApiOperation({ summary: 'Selecciona una personalidad activa para el user autenticado' })
  @ApiResponse({ status: 200, description: 'Personalidad marcada como activa' })
  select(
    @Req() req: any,
    @Param('pid') pid: string,  // cuid string
  ) {
    const userId = req.user.sub as number;
    return this.service.selectPersonality(userId, pid);
  }

  @Post('default')
  @ApiOperation({ summary: 'Crea una personalidad predeterminada para el usuario actual' })
  @ApiResponse({ status: 201, description: 'Personalidad predeterminada creada' })
  createDefault(@Req() req: any) {
    const userId = req.user.sub as number;
    return this.service.createDefaultPersonality(userId);
  }

}

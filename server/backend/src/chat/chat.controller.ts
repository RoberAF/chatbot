import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly prisma: PrismaService,
  ) { }

  @Post('message')
  @ApiOperation({ summary: 'Envía un mensaje y recibe la respuesta del chatbot' })
  async message(@Req() req: any, @Body() dto: ChatDto) {
    const userId = req.user.sub;
    return this.chat.sendMessage(userId, dto.message);
  }

  @Get('history/:pid')
  @ApiOperation({ summary: 'Recupera el historial de mensajes de una personalidad' })
  async history(
    @Req() req: any,
    @Param('pid') pid: string,
  ) {
    const userId = req.user.sub;
  
    const persona = await this.prisma.personality.findUnique({
      where: { id: pid }, 
      select: { userId: true },
    });
    if (!persona || persona.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta personalidad');
    }
    return this.chat.getHistory(pid);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('proactive')
  @ApiOperation({ summary: 'Genera un mensaje proactivo del chatbot' })
  async proactive(@Req() req: any) {
    const userId = req.user.sub;
    const pid = Number(req.query?.pid);
    if (isNaN(pid)) {
      throw new Error('Parametro pid inválido');
    }
    const reply = await this.chat.sendProactiveMessage(userId, pid);
    return { reply };
  }
}
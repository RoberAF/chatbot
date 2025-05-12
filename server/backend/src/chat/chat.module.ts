import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MemoryModule } from '../memory/memory.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonalityModule } from '../personality/personality.module';

@Module({
  imports: [MemoryModule, PrismaModule, PersonalityModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}

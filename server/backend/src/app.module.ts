import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PersonalityModule } from './personality/personality.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ChatModule } from './chat/chat.module';
import { MemoryModule } from './memory/memory.module';
import { UserModule } from './user/user.module'; 

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PersonalityModule,
    SubscriptionModule,
    ChatModule,
    MemoryModule,
    UserModule,  
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
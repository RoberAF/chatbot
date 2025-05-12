import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PersonalityService } from './personality.service';
import { MePersonalityController } from './personality.controller';

@Module({
  imports: [
    PrismaModule,
    SubscriptionModule,
  ],
  providers: [PersonalityService],
  controllers: [MePersonalityController],
  exports: [PersonalityService],  
})
export class PersonalityModule {}

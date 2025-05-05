import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()      // <-- importante
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

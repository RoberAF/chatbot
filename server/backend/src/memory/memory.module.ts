// src/memory/memory.module.ts
import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';

@Module({
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}

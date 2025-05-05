// src/memory/memory.service.ts
import { Injectable, Logger } from '@nestjs/common';

// Tipo simplificado de un fragmento de memoria
interface MemoryItem {
  userId: number;
  text: string;
  timestamp: Date;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private store: MemoryItem[] = []; // aquí podrías enchufar Pinecone, Weaviate, etc.

  /** Añade un fragmento a la memoria del usuario */
  async addMemory(userId: number, text: string) {
    const item: MemoryItem = { userId, text, timestamp: new Date() };
    this.store.push(item);
    this.logger.debug(`addMemory user=${userId} text="${text}"`);
  }

  /** Recupera los k fragmentos más recientes (o más relevantes) */
  async retrieve(userId: number, k = 5): Promise<MemoryItem[]> {
    const all = this.store.filter(item => item.userId === userId);
    // Aquí podrías usar similitud semántica, embeddings, etc.
    const sorted = all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const slice = sorted.slice(0, k);
    this.logger.debug(`retrieve: devuelto ${slice.length} items para user=${userId}`);
    return slice;
  }
}

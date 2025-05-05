// src/chat/chat.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MemoryService } from '../memory/memory.service';
import { PrismaService } from '../prisma/prisma.service';
import { PersonalityService } from '../personality/personality.service';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(
    private readonly memory: MemoryService,
    private readonly prisma: PrismaService,
    private readonly personalityService: PersonalityService,
  ) { }

  private async buildSystemPrompt(userId: number): Promise<string> {
    // 1) Intentar recuperar la personalidad activa
    const userWithActive = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { activePersonality: { select: { id: true, traits: true } } },
    });

    let personality = userWithActive?.activePersonality;
    if (!personality) {
      this.logger.log(`No hay personalidad activa para userId=${userId}, generando una nueva`);
      // Usa el método correcto:
      personality = await this.personalityService.createRandomTraits(userId);
      await this.prisma.user.update({
        where: { id: userId },
        data: { activePersonalityId: personality.id },
      });
    }

    // Asegúrate de que no sea undefined
    if (!personality) {
      throw new NotFoundException('Fallo al generar la personalidad');
    }

    // 2) Recuperar memoria
    const mems = await this.memory.retrieve(userId, 5);
    const memText = mems.map(m => `- (${m.timestamp.toISOString()}): ${m.text}`).join('\n');

    // 3) Montar el prompt
    const systemPrompt = `
  Eres un chatbot IA con esta personalidad:
  ${JSON.stringify(personality.traits, null, 2)}
  
  Memoria reciente del usuario:
  ${memText}
  
  Responde siempre en ese tono y mantén coherencia con la personalidad.
  `.trim();

    this.logger.debug(`buildSystemPrompt para userId=${userId}`, systemPrompt);
    return systemPrompt;
  }

  async sendMessage(userId: number, userMessage: string) {
    this.logger.debug(`sendMessage() userId=${userId} msg="${userMessage}"`);

    // 1) Encuentra la personalidad activa (igual que antes)
    const userWithActive = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { activePersonality: true },
    });
    const persona = userWithActive?.activePersonality;
    if (!persona) throw new NotFoundException('No hay personalidad activa');

    // 2) Guarda en DB el mensaje del usuario
    await this.prisma.message.create({
      data: {
        personalityId: persona.id,
        sender: 'user',
        content: userMessage,
      },
    });

    // 3) Añade a tu memoria de contexto
    await this.memory.addMemory(userId, userMessage);

    // 4) Llama a OpenAI
    const systemPrompt = await this.buildSystemPrompt(userId);
    const chat = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    const reply = chat.choices[0].message?.content?.trim() ?? '';
    this.logger.log(`sendMessage: respuesta="${reply}"`);

    // 5) Guarda la respuesta del bot
    await this.prisma.message.create({
      data: {
        personalityId: persona.id,
        sender: 'bot',
        content: reply,
      },
    });

    // 6) También a memoria si quieres
    await this.memory.addMemory(userId, reply);

    return { reply };
  }

  /** Genera un mensaje proactivo (p. ej. saludo de bienvenida) */
  async sendProactiveMessage(userId: number, personalityId: number): Promise<string> {
    // Asegúrate de que la personalidad está seleccionada
    await this.memory.addMemory(userId, `BOT_INIT for pid=${personalityId}`);

    // Construye un prompt de bienvenida o chequeo
    const systemPrompt = await this.buildSystemPrompt(userId);

    const chat = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        // Mensaje especial de inicio
        { role: 'user', content: 'Inicia la conversación con un saludo amistoso.' },
      ],
    });

    const reply = chat.choices[0].message?.content?.trim() ?? '';
    await this.memory.addMemory(userId, reply);
    return reply;
  }

  /** Recupera todo el historial para una personalidad */
  async getHistory(personalityId: string) {
    return this.prisma.message.findMany({
      where: { personalityId: personalityId.toString() },
      orderBy: { createdAt: 'asc' },
    });
  }
}

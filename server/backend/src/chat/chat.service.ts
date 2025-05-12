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
    const userWithActive = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { activePersonality: { select: { id: true, traits: true } } },
    });

    let personality = userWithActive?.activePersonality;
    if (!personality) {
      this.logger.log(`No hay personalidad activa para userId=${userId}, generando una nueva`);
      personality = await this.personalityService.createRandomTraits(userId);
      await this.prisma.user.update({
        where: { id: userId },
        data: { activePersonalityId: personality.id },
      });
    }

    if (!personality) {
      throw new NotFoundException('Fallo al generar la personalidad');
    }

    const mems = await this.memory.retrieve(userId, 5);
    const memText = mems.map(m => `- (${m.timestamp.toISOString()}): ${m.text}`).join('\n');

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

    const userWithActive = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { activePersonality: true },
    });
    const persona = userWithActive?.activePersonality;
    if (!persona) throw new NotFoundException('No hay personalidad activa');

    await this.prisma.message.create({
      data: {
        personalityId: persona.id,
        sender: 'user',
        content: userMessage,
      },
    });

    await this.memory.addMemory(userId, userMessage);

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

    await this.prisma.message.create({
      data: {
        personalityId: persona.id,
        sender: 'bot',
        content: reply,
      },
    });

    await this.memory.addMemory(userId, reply);

    return { reply };
  }

  async sendProactiveMessage(userId: number, personalityId: number): Promise<string> {
    await this.memory.addMemory(userId, `BOT_INIT for pid=${personalityId}`);

    const systemPrompt = await this.buildSystemPrompt(userId);

    const chat = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Inicia la conversación con un saludo amistoso.' },
      ],
    });

    const reply = chat.choices[0].message?.content?.trim() ?? '';
    await this.memory.addMemory(userId, reply);
    return reply;
  }

  async getHistory(personalityId: string) {
    return this.prisma.message.findMany({
      where: { personalityId: personalityId.toString() },
      orderBy: { createdAt: 'asc' },
    });
  }
}

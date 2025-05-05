import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { OpenAI } from 'openai';
import { Tier } from '@prisma/client';

@Injectable()
export class PersonalityService {
  private readonly logger = new Logger(PersonalityService.name);
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) { }

  /**
 * Crea una personalidad predeterminada para nuevos usuarios
 * sin verificar límites de plan
 */
  async createDefaultPersonality(userId: number) {
    this.logger.debug(`Creando personalidad predeterminada para userId=${userId}`);

    // Personalidad simple y amigable por defecto
    const traits = {
      name: "Asistente",
      age: 25,
      tone: "amigable y servicial",
      hobbies: ["ayudar a las personas", "aprender cosas nuevas", "resolver problemas"],
      quirks: "Siempre intenta ver el lado positivo de las cosas"
    };

    // Crear la personalidad sin verificación de límites
    const personality = await this.prisma.personality.create({
      data: { userId, traits },
    });

    // Establecerla como activa
    await this.prisma.user.update({
      where: { id: userId },
      data: { activePersonalityId: personality.id },
    });

    return personality;
  }

  /** Comprueba si el usuario puede crear una nueva personalidad */
  async canCreateNew(userId: number): Promise<void> {
    const { tier } = await this.subscriptionService.getStatus(userId);
    const count = await this.prisma.personality.count({ where: { userId } });
    if (tier === Tier.FREE && count >= 1) {
      throw new ForbiddenException('Los usuarios FREE sólo pueden crear 1 personalidad.');
    }
    if (tier === Tier.PRO && count >= 3) {
      throw new ForbiddenException('Los usuarios PREMIUM sólo pueden crear hasta 3 personalidades.');
    }
    if (tier === Tier.PRO_PLUS && count >= 5) {
      throw new ForbiddenException('Los usuarios PREMIUM sólo pueden crear hasta 5 personalidades.');
    }
  }

  /** Genera una personalidad aleatoria vía OpenAI y la persiste */
  async createRandomTraits(userId: number) {
    await this.canCreateNew(userId);

    this.logger.debug(`Generando personalidad aleatoria para userId=${userId}`);
    const prompt = `Eres un sistema que genera atributos únicos para un chatbot IA.\nDevuélvelos en JSON con keys: name, age, tone, hobbies, quirks.`;
    const chat = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: prompt }],
    });
    const content = chat.choices[0].message.content;
    let traits: any;
    try {
      if (!content) {
        throw new Error('OpenAI devolvió contenido nulo o vacío');
      }
      traits = JSON.parse(content);
    } catch {
      throw new Error('OpenAI devolvió JSON inválido');
    }

    const personality = await this.prisma.personality.create({
      data: { userId, traits },
    });
    return personality;
  }

  /** Crea una personalidad con los traits enviados por el usuario */
  async createWithTraits(userId: number, traits: any) {
    await this.canCreateNew(userId);
    this.logger.debug(`Creando personalidad custom para userId=${userId}`);
    return this.prisma.personality.create({ data: { userId, traits } });
  }

  /** Lista todas las personalidades del usuario */
  async listPersonalities(userId: number) {
    return this.prisma.personality.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Selecciona una de las personalidades como activa */
  async selectPersonality(userId: number, pid: string) {
    // Comprueba que existe y pertenece al usuario
    const p = await this.prisma.personality.findUnique({
      where: { id: pid },
    });
    if (!p || p.userId !== userId) {
      throw new NotFoundException('Personalidad no encontrada');
    }
    // Marca como activa en User
    await this.prisma.user.update({
      where: { id: userId },
      data: { activePersonalityId: pid },
    });
    return { success: true };
  }


}

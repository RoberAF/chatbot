import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { Tier } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      this.logger.error('STRIPE_SECRET_KEY no definido en entorno');
      throw new InternalServerErrorException('Configuración de Stripe faltante');
    }
    this.stripe = new Stripe(secret, { apiVersion: '2025-03-31.basil' });
    this.logger.log('Stripe client inicializado');
  }

  async getStatus(userId: number) {
    this.logger.debug(`getStatus() llamado para userId=${userId}`);
    try {
      const sub = await this.prisma.subscription.findUnique({ where: { userId } });
      if (!sub) {
        this.logger.log(`getStatus: sin suscripción, devolviendo FREE para userId=${userId}`);
        return { 
          tier: Tier.FREE, 
          expiresAt: null,
          isOnTrial: false,
          trialEndDate: null,
          daysLeftInTrial: 0
        };
      }

      const now = new Date();
      const isOnTrial = sub.trialStartDate && sub.trialEndDate && 
                       now >= sub.trialStartDate && now <= sub.trialEndDate;

      let daysLeftInTrial = 0;
      if (isOnTrial && sub.trialEndDate) {
        const timeDiff = sub.trialEndDate.getTime() - now.getTime();
        daysLeftInTrial = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      }

      if (sub.trialEndDate && now > sub.trialEndDate && !sub.stripeId) {
        await this.prisma.subscription.update({
          where: { userId },
          data: { tier: Tier.FREE }
        });
        return { 
          tier: Tier.FREE, 
          expiresAt: null,
          isOnTrial: false,
          trialEndDate: sub.trialEndDate,
          daysLeftInTrial: 0
        };
      }

      this.logger.log(`getStatus: tier=${sub.tier} expiresAt=${sub.expiresAt} isOnTrial=${isOnTrial}`);
      return { 
        tier: sub.tier, 
        expiresAt: sub.expiresAt,
        isOnTrial,
        trialEndDate: sub.trialEndDate,
        daysLeftInTrial
      };
    } catch (error) {
      this.logger.error(`getStatus() fallo para userId=${userId}`, error.stack);
      throw new InternalServerErrorException('Error al obtener estado de suscripción');
    }
  }

  async startTrial(userId: number, tier: 'PRO' | 'PRO_PLUS') {
    this.logger.debug(`startTrial() userId=${userId} tier=${tier}`);
    
    const existingSub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existingSub?.hasUsedTrial) {
      throw new Error('Ya has utilizado tu período de prueba gratuito');
    }

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 2);

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier,
        trialStartDate,
        trialEndDate,
        hasUsedTrial: true,
      },
      update: {
        tier,
        trialStartDate,
        trialEndDate,
        hasUsedTrial: true,
      },
    });

    this.logger.log(`startTrial: trial iniciado para userId=${userId} hasta ${trialEndDate}`);
    return { 
      success: true, 
      trialEndDate,
      message: `Tu prueba gratuita de ${tier} está activa hasta ${trialEndDate.toLocaleDateString()}`
    };
  }

  async createCustomer(userId: number) {
    this.logger.debug(`createCustomer() llamado para userId=${userId}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`createCustomer: usuario no encontrado userId=${userId}`);
        throw new NotFoundException('Usuario no encontrado');
      }

      let sub = await this.prisma.subscription.findUnique({ where: { userId } });
      if (sub?.stripeId) {
        this.logger.log(`createCustomer: ya existe stripeId=${sub.stripeId}`);
        return sub;
      }

      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      this.logger.log(`createCustomer: stripe customer creado id=${customer.id}`);

      sub = await this.prisma.subscription.upsert({
        where: { userId },
        create: { userId, stripeId: customer.id },
        update: { stripeId: customer.id },
      });
      this.logger.log(`createCustomer: registro Subscription upsert userId=${userId}`);
      return sub;
    } catch (error) {
      this.logger.error(`createCustomer() fallo para userId=${userId}`, error.stack);
      throw new InternalServerErrorException('Error al crear cliente en Stripe');
    }
  }

 
  async createCheckoutSession(
    userId: number,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    this.logger.debug(`createCheckoutSession() userId=${userId} priceId=${priceId}`);
    try {
      const sub = await this.createCustomer(userId);
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: sub.stripeId!,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      this.logger.log(`createCheckoutSession: session creada id=${session.id}`);
      return { url: session.url };
    } catch (error) {
      this.logger.error(`createCheckoutSession() fallo para userId=${userId}`, error.stack);
      throw new InternalServerErrorException('Error al crear la sesión de pago');
    }
  }

  /**
   * Maneja eventos de Stripe Webhook.
   * @param signature Firma del header stripe-signature
   * @param payload Cuerpo RAW de la petición en Buffer
   */
  async handleWebhook(signature: string, payload: Buffer) {
    this.logger.debug('handleWebhook() llamado');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET no definido');
      throw new InternalServerErrorException('Configuración de webhook faltante');
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      this.logger.error('handleWebhook: firma inválida', err.stack);
      throw new InternalServerErrorException('Firma de webhook inválida');
    }
    this.logger.log(`handleWebhook: evento recibido ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = session.customer as string;
          await this.prisma.subscription.updateMany({
            where: { stripeId: customerId },
            data: {
              tier: Tier.PRO,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
          this.logger.log('handleWebhook: suscripción actualizada a Tier.PRO');
          break;
        }
        default:
          this.logger.debug(`handleWebhook: evento no manejado ${event.type}`);
      }
    } catch (err) {
      this.logger.error('handleWebhook: error procesando evento', err.stack);
      throw new InternalServerErrorException('Error al procesar webhook');
    }

    return { received: true };
  }
}

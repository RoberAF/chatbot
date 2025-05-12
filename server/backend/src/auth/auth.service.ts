import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) { }

  private async issueRefreshToken(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId }
    });
    
    if (!user) {
      this.logger.warn(`issueRefreshToken: usuario no encontrado userId=${userId}`);
      throw new Error('Usuario no encontrado');
    }
    
    if (user.activePersonalityId === null) {
      const personalities = await this.prisma.personality.findMany({
        where: { userId: user.id },
        take: 1
      });
      
      if (personalities.length > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { activePersonalityId: personalities[0].id }
        });
        this.logger.log(`issueRefreshToken: personalidad existente seleccionada id=${personalities[0].id}`);
      } else {
        this.logger.warn(`issueRefreshToken: sin personalidades disponibles userId=${userId}, creando por defecto`);
        
        const defaultPersonality = await this.prisma.personality.create({
          data: {
            userId: user.id,
            traits: {
              name: "Asistente",
              age: 25,
              tone: "amigable y servicial",
              hobbies: ["ayudar a las personas", "aprender cosas nuevas", "resolver problemas"],
              quirks: "Siempre intenta ver el lado positivo de las cosas"
            }
          }
        });
        
        await this.prisma.user.update({
          where: { id: userId },
          data: { activePersonalityId: defaultPersonality.id }
        });
        
        this.logger.log(`issueRefreshToken: personalidad por defecto creada id=${defaultPersonality.id}`);
      }
    }
    
    const rawToken = uuidv4();
    const hashed = await bcrypt.hash(rawToken, 10);
    await this.prisma.refreshToken.create({
      data: { tokenHash: hashed, userId },
    });
    this.logger.debug(`issueRefreshToken: creado para userId=${userId}`);
    return rawToken;
  }

  async register(dto: RegisterDto) {
    this.logger.debug(`register() email=${dto.email}`);
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`register conflict: email en uso=${dto.email}`);
      throw new ConflictException('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const confirmToken = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); 

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        age: dto.age,
        confirmToken,
        confirmTokenExpiry: expiry,
      },
    });
    this.logger.log(`register: user creado id=${user.id}`);

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 2); 

    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        tier: 'PRO_PLUS', 
        trialStartDate,
        trialEndDate,
        hasUsedTrial: true,
      },
    });
    this.logger.log(`register: trial de 2 días creado para userId=${user.id}`);

    const confirmLink = `${process.env.FRONTEND_URL}/auth/confirm?token=${confirmToken}`;
    await this.mailer.sendConfirmationEmail(dto.email, confirmLink);
    this.logger.log(`register: email confirmación enviado a=${dto.email}`);

    return { message: 'Usuario creado. Revisa tu correo para confirmar.' };
  }

 async confirmEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { confirmToken: token, confirmTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Token inválido o expirado');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        confirmToken: null,
        confirmTokenExpiry: null,
      },
    });
    
    const existingPersonalities = await this.prisma.personality.count({
      where: { userId: user.id }
    });
    
    if (existingPersonalities === 0) {
      const defaultPersonality = await this.prisma.personality.create({
        data: {
          userId: user.id,
          traits: {
            name: "Asistente",
            age: 25,
            tone: "amigable y servicial",
            hobbies: ["ayudar a las personas", "aprender cosas nuevas", "resolver problemas"],
            quirks: "Siempre intenta ver el lado positivo de las cosas"
          }
        }
      });
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: { activePersonalityId: defaultPersonality.id }
      });
      
      this.logger.log(`confirmEmail: personalidad por defecto creada para usuario ${user.id}`);
    }
    
    this.logger.log(`confirmEmail: usuario ${user.id} confirmado`);
    return { message: 'Email confirmado. Ya puedes iniciar sesión.' };
  }

 async login(dto: LoginDto) {
    this.logger.debug(`login() email=${dto.email}`);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      this.logger.warn(`login failed: usuario no encontrado ${dto.email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.logger.warn(`login failed: contraseña inválida ${dto.email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const existingPersonalities = await this.prisma.personality.count({
      where: { userId: user.id }
    });
    
    if (existingPersonalities === 0) {
      this.logger.log(`login: creando personalidad por defecto para usuario ${user.id}`);
      
      const defaultPersonality = await this.prisma.personality.create({
        data: {
          userId: user.id,
          traits: {
            name: "Asistente",
            age: 25,
            tone: "amigable y servicial",
            hobbies: ["ayudar a las personas", "aprender cosas nuevas", "resolver problemas"],
            quirks: "Siempre intenta ver el lado positivo de las cosas"
          }
        }
      });
      
      await this.prisma.user.update({
        where: { id: user.id },
        data: { activePersonalityId: defaultPersonality.id }
      });
    }

    const accessToken = this.jwtService.sign({ sub: user.id });
    const refreshToken = await this.issueRefreshToken(user.id);
    this.logger.log(`login: tokens emitidos userId=${user.id}`);
    return { accessToken, refreshToken };
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async refreshTokens(refreshToken: string) {
    this.logger.debug('refreshTokens()');
    const allTokens = await this.prisma.refreshToken.findMany();
    let tokenRecord;
    for (const rec of allTokens) {
      if (await bcrypt.compare(refreshToken, rec.tokenHash)) {
        tokenRecord = rec;
        break;
      }
    }
    if (!tokenRecord) {
      this.logger.warn('refreshTokens: token inválido');
      throw new UnauthorizedException('Refresh token inválido');
    }

    const userId = tokenRecord.userId;
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    const newAt = this.jwtService.sign({ sub: userId });
    const newRt = await this.issueRefreshToken(userId);
    this.logger.log(`refreshTokens: rotados tokens userId=${userId}`);
    return { accessToken: newAt, refreshToken: newRt };
  }

  async logout(userId: number) {
    this.logger.debug(`logout() userId=${userId}`);
    
    try {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      

      await this.prisma.user.update({
        where: { id: userId },
        data: { 

          activePersonalityId: null 
        }
      });
      
      this.logger.log(`logout: tokens revocados userId=${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error en logout para usuario ${userId}:`, error.stack);
      throw new Error('Error al cerrar sesión');
    }
  }


  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`forgotPassword: usuario no encontrado ${email}`);
      throw new NotFoundException('Usuario no encontrado');
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await this.prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.mailer.sendResetPasswordEmail(email, resetLink);
    this.logger.log(`forgotPassword: email reset enviado a=${email}`);

    return { message: 'Email de recuperación enviado' };
  }


  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) {
      this.logger.warn(`resetPassword: token inválido o expirado ${token}`);
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    this.logger.log(`resetPassword: contraseña actualizada userId=${user.id}`);
    return { message: 'Contraseña actualizada exitosamente' };
  }
}
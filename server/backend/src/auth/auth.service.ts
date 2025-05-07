// src/auth/auth.service.ts
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

  /** 
   * Emite y guarda un refresh token 
   */
  private async issueRefreshToken(userId: number): Promise<string> {
    const rawToken = uuidv4();
    const hashed = await bcrypt.hash(rawToken, 10);
    await this.prisma.refreshToken.create({
      data: { tokenHash: hashed, userId },
    });
    this.logger.debug(`issueRefreshToken: creado para userId=${userId}`);
    return rawToken;
  }

  /**
   * Registro de usuario + envío de email de confirmación
   */
  async register(dto: RegisterDto) {
    this.logger.debug(`register() email=${dto.email}`);
    // 1️⃣ Verificar conflicto
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`register conflict: email en uso=${dto.email}`);
      throw new ConflictException('El email ya está en uso');
    }

    // 2️⃣ Crear usuario con token de confirmación
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const confirmToken = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1h

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        confirmToken,
        confirmTokenExpiry: expiry,
      },
    });
    this.logger.log(`register: user creado id=${user.id}`);

    // 3️⃣ Mandar email de confirmación
    const confirmLink = `${process.env.FRONTEND_URL}/auth/confirm?token=${confirmToken}`;
    await this.mailer.sendConfirmationEmail(dto.email, confirmLink);
    this.logger.log(`register: email confirmación enviado a=${dto.email}`);

    return { message: 'Usuario creado. Revisa tu correo para confirmar.' };
  }

  /**
   * Confirma cuenta (token)
   */
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
    this.logger.log(`confirmEmail: usuario ${user.id} confirmado`);
    return { message: 'Email confirmado. Ya puedes iniciar sesión.' };
  }

  /**
   * Login y emisión de tokens
   */
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

    const accessToken = this.jwtService.sign({ sub: user.id });
    const refreshToken = await this.issueRefreshToken(user.id);
    this.logger.log(`login: tokens emitidos userId=${user.id}`);
    return { accessToken, refreshToken };
  }

  async firebaseLogin(firebaseToken: string) {
    try {
      // Aquí necesitarías verificar el token de Firebase
      // Puedes usar firebase-admin para esto
      const decodedToken = await this.verifyFirebaseToken(firebaseToken);
      const email = decodedToken.email;

      // Buscar usuario por email o crearlo si no existe
      let user = await this.findUserByEmail(email);

      if (!user) {
        // Crear usuario automáticamente
        user = await this.prisma.user.create({
          data: {
            email,
            password: await bcrypt.hash(randomBytes(16).toString('hex'), 10),
            emailConfirmed: true, // Consideramos que los emails de Google ya están verificados
          },
        });
        this.logger.log(`firebaseLogin: usuario creado automáticamente id=${user.id}`);
      }

      // Generar tokens
      const accessToken = this.jwtService.sign({ sub: user.id });
      const refreshToken = await this.issueRefreshToken(user.id);

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`firebaseLogin error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Error al verificar token de Firebase');
    }
  }

  // Método auxiliar para verificar tokens de Firebase
  private async verifyFirebaseToken(token: string) {
    // Implementar verificación de token usando firebase-admin
    // Esto requiere configurar firebase-admin en el proyecto
    // return admin.auth().verifyIdToken(token);

    // Implementación simplificada para pruebas (NO USAR EN PRODUCCIÓN)
    try {
      // Decodificar token sin verificar (solo para depuración)
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Token de Firebase inválido');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Renueva tokens con refresh token
   */
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

  /**
   * Logout: revoca todos los refresh tokens
   */
  async logout(userId: number) {
    this.logger.debug(`logout() userId=${userId}`);
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    this.logger.log(`logout: tokens revocados userId=${userId}`);
    return { success: true };
  }

  /**
   * Olvidé mi contraseña: genera token y envía email de reset
   */
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

  /**
   * Reseteo de contraseña
   */
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

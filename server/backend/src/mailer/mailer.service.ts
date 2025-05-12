import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly mailDomain: string;

  constructor(
    @Inject('MAIL_TRANSPORT') private readonly transporter: nodemailer.Transporter,
    private readonly configService: ConfigService,
  ) {
    this.mailDomain = this.configService.get('MAIL_DOMAIN') || 'mailtrap.io';
    this.logger.log(`Usando dominio de correo: ${this.mailDomain}`);
  }

  async sendConfirmationEmail(to: string, confirmLink: string) {
    try {
      const result = await this.transporter.sendMail({
        from: `"Tu App" <no-reply@${this.mailDomain}>`,
        to: to,
        subject: 'Confirma tu cuenta',
        text: `Pulsa aquí para confirmar: ${confirmLink}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirma tu cuenta</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); margin-top: 20px;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #333333; margin-top: 0;">Confirma tu cuenta</h2>
              </div>
              <div style="padding: 20px; color: #555555;">
                <p>Gracias por registrarte. Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
                
                <!-- Botón mejorado y garantizado para funcionar en clientes de correo -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmLink}" target="_blank" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    Confirmar mi cuenta
                  </a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
                  <a href="${confirmLink}" target="_blank" style="color: #3498db; text-decoration: underline; word-break: break-all;">
                    ${confirmLink}
                  </a>
                </p>
                
                <p style="font-size: 14px; color: #999; margin-top: 30px;">Este enlace expirará en 1 hora.</p>
              </div>
              <div style="padding: 20px; background-color: #f8f8f8; color: #666; text-align: center; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 13px;">© 2025 Tu App. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      
      this.logger.log(`Email de confirmación enviado a ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error al enviar email de confirmación a ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendResetPasswordEmail(to: string, resetLink: string) {
    try {
      const result = await this.transporter.sendMail({
        from: `"Tu App" <no-reply@${this.mailDomain}>`,
        to: to,
        subject: 'Recupera tu contraseña',
        text: `Pincha aquí para resetear tu contraseña: ${resetLink}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restablece tu contraseña</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); margin-top: 20px;">
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #333333; margin-top: 0;">Restablece tu contraseña</h2>
              </div>
              <div style="padding: 20px; color: #555555;">
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
                
                <!-- Botón mejorado -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" target="_blank" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    Restablecer contraseña
                  </a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
                  <a href="${resetLink}" target="_blank" style="color: #3498db; text-decoration: underline; word-break: break-all;">
                    ${resetLink}
                  </a>
                </p>
                
                <p style="font-size: 14px; color: #999; margin-top: 30px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este email.</p>
              </div>
              <div style="padding: 20px; background-color: #f8f8f8; color: #666; text-align: center; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 13px;">© 2025 Tu App. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      
      this.logger.log(`Email de restablecimiento de contraseña enviado a ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error al enviar email de restablecimiento a ${to}: ${error.message}`);
      throw error;
    }
  }
}
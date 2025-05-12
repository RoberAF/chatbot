import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';
import * as nodemailer from 'nodemailer';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MAIL_TRANSPORT',
      useFactory: (config: ConfigService) => {
        return nodemailer.createTransport({
          host: 'send.smtp.mailtrap.io',
          port: 587,
          auth: {
            user: 'api',
            pass: config.get('MAILTRAP_API_TOKEN')
          }
        });
      },
      inject: [ConfigService],
    },
    MailerService,
  ],
  exports: [MailerService],
})
export class MailModule {}
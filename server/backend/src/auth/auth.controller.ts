import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, Get, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export class RefreshTokenDto {
  refreshToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Registra un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado con éxito' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('confirm')
  @ApiOperation({ summary: 'Confirma cuenta vía token' })
  async confirm(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Autentica un usuario existente' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.findUserByEmail(dto.email);
    if (!user?.emailConfirmed) {
      throw new UnauthorizedException('Debes confirmar tu email antes de entrar');
    }
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renueva tokens usando un refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados correctamente' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Cierra sesión y revoca todos los refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  async logout(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID is undefined');
    }
    return this.authService.logout(userId);
  }

  @Post('forgot')
  @ApiOperation({ summary: 'Inicia flujo de recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Email de recuperación enviado' })
  async forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Resetea la contraseña con token válido' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  async reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
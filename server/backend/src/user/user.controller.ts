import { Controller, Get, Req, UseGuards, Patch, Body, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  async getProfile(@Req() req: any) {
    const userId = req.user.sub;
    this.logger.debug(`getProfile: userId=${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualiza el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  async updateProfile(@Req() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub;
    this.logger.debug(`updateProfile: userId=${userId}, dto=${JSON.stringify(updateUserDto)}`);
    
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateUserDto,
      });

      this.logger.log(`Usuario actualizado exitosamente: id=${userId}`);
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      this.logger.error(`Error actualizando usuario: ${error.message}`, error.stack);
      throw error;
    }
  }
}
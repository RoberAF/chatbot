import { Controller, Get, Post, Body, Req, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionService } from './subscription.service';

class CreateSessionDto {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
}

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
    constructor(private readonly service: SubscriptionService) { }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @Get('status')
    @ApiOperation({ summary: 'Estado de suscripción del usuario' })
    @ApiResponse({ status: 200, description: 'Retorna tier y fecha de expiración' })
    getStatus(@Req() req: any) {
        const userId = req.user.sub;
        return this.service.getStatus(userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @Post('create-session')
    @ApiOperation({ summary: 'Crea Checkout Session de Stripe para suscripción' })
    @ApiResponse({ status: 201, description: 'URL de checkout' })
    @HttpCode(HttpStatus.CREATED)
    createSession(@Req() req: any, @Body() dto: CreateSessionDto) {
        const userId = req.user.sub;
        return this.service.createCheckoutSession(
            userId,
            dto.priceId,
            dto.successUrl,
            dto.cancelUrl,
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @Post('start-trial')
    @ApiOperation({ summary: 'Inicia el trial de 2 días para un plan' })
    @ApiResponse({ status: 201, description: 'Trial iniciado' })
    async startTrial(@Req() req: any, @Body() dto: { tier: 'PRO' | 'PRO_PLUS' }) {
        const userId = req.user.sub;
        return this.service.startTrial(userId, dto.tier);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Endpoint para webhooks de Stripe' })
    @ApiResponse({ status: 200, description: 'Webhook handled' })
    handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: any,
    ) {
        return this.service.handleWebhook(signature, req.rawBody);
    }

}

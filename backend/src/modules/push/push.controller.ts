import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

interface SubscriptionDto {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

@ApiTags('Push')
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  /**
   * Clé publique VAPID — nécessaire au navigateur pour s'abonner.
   * Public (pas d'auth) — c'est une clé publique destinée à être partagée.
   */
  @Get('vapid-public-key')
  @Public()
  @ApiOperation({ summary: 'Clé publique VAPID pour souscription Web Push' })
  getPublicKey() {
    const key = this.pushService.getPublicKey();
    if (!key) {
      throw new NotFoundException('Web Push non configuré sur ce serveur');
    }
    return { publicKey: key };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Enregistre l'abonnement push du device courant" })
  async subscribe(
    @CurrentUser() user: User,
    @Body() body: SubscriptionDto,
    @Req() req: Request,
  ) {
    const ua = req.get('user-agent');
    const sub = await this.pushService.subscribe(user.id, body, ua);
    return { id: sub.id, endpoint: sub.endpoint };
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprime un abonnement push (envoyer l'endpoint dans body)" })
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.pushService.unsubscribe(body.endpoint);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RepairersService, SearchRepairersParams } from './repairers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RepairerProfile,
  VerificationStatus,
} from './entities/repairer-profile.entity';
import { User } from './entities/user.entity';

@ApiTags('Repairers')
@Controller('repairers')
export class RepairersController {
  constructor(private readonly repairersService: RepairersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search repairers' })
  async search(@Query() params: SearchRepairersParams) {
    return this.repairersService.search(params);
  }

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Find nearby repairers' })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.repairersService.search({
      latitude,
      longitude,
      radiusKm: radius || 10,
    });
  }

  // ⚠️ Routes statiques AVANT les routes paramétrées (:id)
  // Sinon @Get(':id') intercepte /profile/me → ParseUUIDPipe rejette "profile" → 400.

  @Get('profile/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REPAIRER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own repairer profile' })
  async getMyProfile(
    @CurrentUser() user: User,
  ): Promise<RepairerProfile | null> {
    return this.repairersService.findByUserId(user.id);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REPAIRER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create repairer profile' })
  async createProfile(
    @CurrentUser() user: User,
    @Body() data: Partial<RepairerProfile>,
  ): Promise<RepairerProfile> {
    return this.repairersService.create(user.id, data);
  }

  @Patch('profile/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REPAIRER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own repairer profile' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() data: Partial<RepairerProfile>,
  ): Promise<RepairerProfile> {
    const profile = await this.repairersService.findByUserId(user.id);
    if (!profile) {
      throw new Error('Profil réparateur non trouvé');
    }
    return this.repairersService.update(profile.id, data);
  }

  @Patch('profile/me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REPAIRER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle availability' })
  async toggleAvailability(
    @CurrentUser() user: User,
  ): Promise<RepairerProfile> {
    const profile = await this.repairersService.findByUserId(user.id);
    if (!profile) {
      throw new Error('Profil réparateur non trouvé');
    }
    return this.repairersService.toggleAvailability(profile.id);
  }

  // Route paramétrée : DOIT rester en dernier pour ne pas masquer les routes statiques.
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get repairer by ID (profile ID or user ID)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    // Try to find by profile ID first, then by user ID
    let profile = await this.repairersService.findByIdOrNull(id);
    if (!profile) {
      profile = await this.repairersService.findByUserId(id);
    }
    if (!profile) {
      throw new Error('Réparateur non trouvé');
    }
    // Return in frontend expected format
    return {
      id: profile.user?.id || profile.userId,
      firstName: profile.user?.firstName,
      lastName: profile.user?.lastName,
      phone: profile.user?.phone || '',
      avatarUrl: profile.user?.avatarUrl,
      repairerProfile: {
        id: profile.id,
        businessName: profile.businessName,
        description: profile.description,
        address: profile.address,
        latitude: profile.latitude,
        longitude: profile.longitude,
        rating: Number(profile.ratingAvg) || 0,
        reviewCount: profile.ratingCount || 0,
        isAvailable: profile.isAvailable,
        specialties: [],
        isVerified: profile.verificationStatus === VerificationStatus.VERIFIED,
        responseTime: 15,
        completedRepairs: profile.totalRepairs || 0,
        yearsOfExperience: 0,
        acceptanceRate: profile.completionRate || 0,
        serviceRadius: profile.homeServiceRadiusKm || 10,
      },
    };
  }
}

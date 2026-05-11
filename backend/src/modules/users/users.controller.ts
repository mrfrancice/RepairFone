import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RepairersService } from './repairers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileUploadService } from '../../common/services/file-upload.service';
import { User } from './entities/user.entity';
import { RepairerProfile } from './entities/repairer-profile.entity';
import { UpdateUserDto, UpdateRepairerProfileDto } from './dto';
import { BadRequestException } from '@nestjs/common';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly repairersService: RepairersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile (PATCH)' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfilePatch(
    @CurrentUser() user: User,
    @Body() updateData: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, updateData);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile (PUT)' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfilePut(
    @CurrentUser() user: User,
    @Body() updateData: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, updateData);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar (multipart field: avatar)' })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile()
    file:
      | { originalname: string; buffer: Buffer; mimetype: string; size: number }
      | undefined,
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('Fichier manquant (champ multipart "avatar")');
    }

    const result = await this.fileUploadService.uploadAvatar(
      {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      user.id,
    );

    if (!result.success || !result.url) {
      throw new BadRequestException(result.error || 'Échec de l\'upload');
    }

    await this.usersService.update(user.id, { avatarUrl: result.url });
    return { avatarUrl: result.url };
  }

  @Put('me/repairer-profile')
  @ApiOperation({ summary: 'Update repairer profile for current user' })
  @ApiBody({ type: UpdateRepairerProfileDto })
  async updateRepairerProfile(
    @CurrentUser() user: User,
    @Body() data: UpdateRepairerProfileDto,
  ): Promise<RepairerProfile> {
    // Check if user is a repairer
    if (user.role !== 'repairer') {
      throw new ForbiddenException('Seuls les réparateurs peuvent modifier leur profil réparateur');
    }

    // Find existing profile
    const profile = await this.repairersService.findByUserId(user.id);

    if (profile) {
      // Update existing profile
      return this.repairersService.update(profile.id, data);
    } else {
      // Create new profile
      return this.repairersService.create(user.id, data);
    }
  }

  @Patch('me/repairer-profile')
  @ApiOperation({ summary: 'Partially update repairer profile for current user' })
  @ApiBody({ type: UpdateRepairerProfileDto })
  async patchRepairerProfile(
    @CurrentUser() user: User,
    @Body() data: UpdateRepairerProfileDto,
  ): Promise<RepairerProfile> {
    return this.updateRepairerProfile(user, data);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account (RGPD Art. 17)' })
  async deleteAccount(@CurrentUser() user: User): Promise<void> {
    await this.usersService.softDelete(user.id);
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export user data (RGPD Art. 20 — portabilité)' })
  async exportData(@CurrentUser() user: User): Promise<Record<string, unknown>> {
    return this.usersService.exportUserData(user.id);
  }
}

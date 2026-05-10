import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import type { VerificationDecisionDto, RepairerListParams } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { VerificationStatus } from '../users/entities/repairer-profile.entity';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard summary' })
  async getDashboard() {
    return this.adminService.getDashboardSummary();
  }

  // ==========================================
  // REPAIRERS MANAGEMENT
  // ==========================================

  @Get('repairers')
  @ApiOperation({ summary: 'List all repairers with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'pending', 'under_review', 'verified', 'rejected', 'suspended'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getRepairers(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const params: RepairerListParams = {
      status: status as VerificationStatus | 'all',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    };
    return this.adminService.getRepairers(params);
  }

  @Get('repairers/pending')
  @ApiOperation({ summary: 'List pending repairers for verification' })
  async getPendingRepairers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getRepairers({
      status: VerificationStatus.PENDING,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('repairers/stats')
  @ApiOperation({ summary: 'Get verification statistics' })
  async getRepairerStats() {
    return this.adminService.getVerificationStats();
  }

  @Get('repairers/:id')
  @ApiOperation({ summary: 'Get repairer detail for verification' })
  async getRepairerDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getRepairerDetail(id);
  }

  @Patch('repairers/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify or reject a repairer' })
  async verifyRepairer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() decision: VerificationDecisionDto,
    @CurrentUser() admin: User,
  ) {
    const result = await this.adminService.verifyRepairer(id, decision, admin.id);
    return {
      success: true,
      message: decision.status === 'verified'
        ? 'Réparateur vérifié avec succès'
        : 'Réparateur rejeté',
      data: {
        id: result.id,
        verificationStatus: result.verificationStatus,
        verifiedAt: result.verifiedAt,
      },
    };
  }

  @Patch('repairers/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set repairer status to under review' })
  async setUnderReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ) {
    const result = await this.adminService.setUnderReview(id, notes);
    return {
      success: true,
      message: 'Statut mis à jour: en cours de révision',
      data: {
        id: result.id,
        verificationStatus: result.verificationStatus,
      },
    };
  }

  @Patch('repairers/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a repairer' })
  async suspendRepairer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    const result = await this.adminService.suspendRepairer(id, reason);
    return {
      success: true,
      message: 'Réparateur suspendu',
      data: {
        id: result.id,
        verificationStatus: result.verificationStatus,
      },
    };
  }

  @Patch('repairers/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a suspended repairer' })
  async reactivateRepairer(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminService.reactivateRepairer(id);
    return {
      success: true,
      message: 'Réparateur réactivé',
      data: {
        id: result.id,
        verificationStatus: result.verificationStatus,
      },
    };
  }

  // ==========================================
  // USER ACCOUNT MANAGEMENT
  // ==========================================

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'role', required: false, enum: ['all', 'client', 'repairer'] })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'pending', 'active', 'suspended', 'deactivated'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['createdAt', 'firstName', 'role', 'status'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const normalizedOrder =
      order?.toLowerCase() === 'asc'
        ? 'asc'
        : order?.toLowerCase() === 'desc'
          ? 'desc'
          : undefined;
    return this.adminService.getUsers({
      role: role as UserRole | 'all',
      status: status as UserStatus | 'all',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      sort: sort as 'createdAt' | 'firstName' | 'role' | 'status' | undefined,
      order: normalizedOrder,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail' })
  async getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a user account' })
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.adminService.activateUser(id);
    return {
      success: true,
      message: 'Compte activé avec succès',
      data: {
        id: result.id,
        status: result.status,
      },
    };
  }

  @Patch('users/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate/suspend a user account' })
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.adminService.deactivateUser(id, reason);
    return {
      success: true,
      message: 'Compte suspendu avec succès',
      data: {
        id: result.id,
        status: result.status,
      },
    };
  }

  @Patch('users/:id/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete/deactivate a user account' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deleteUser(id);
    return {
      success: true,
      message: 'Compte supprimé avec succès',
    };
  }
}

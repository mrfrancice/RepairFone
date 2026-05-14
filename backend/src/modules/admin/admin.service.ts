import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RepairerProfile,
  VerificationStatus,
} from '../users/entities/repairer-profile.entity';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import {
  AdminRepairerListResponse,
  AdminRepairerDetailResponse,
  AdminUserListResponse,
  AdminUserDetailResponse,
  RepairerListParams,
  UserListParams,
  VerificationDecisionDto,
  VerificationStats,
} from './interfaces';

// Re-export interfaces for backward compatibility
export type { VerificationDecisionDto, RepairerListParams } from './interfaces';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(RepairerProfile)
    private readonly repairerRepository: Repository<RepairerProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get all repairers with filters (for admin dashboard)
   */
  async getRepairers(
    params: RepairerListParams,
  ): Promise<AdminRepairerListResponse> {
    const { status = 'all', page = 1, limit = 20, search } = params;

    const queryBuilder = this.repairerRepository
      .createQueryBuilder('repairer')
      .leftJoinAndSelect('repairer.user', 'user');

    // Filter by status
    if (status !== 'all') {
      queryBuilder.andWhere('repairer.verificationStatus = :status', {
        status,
      });
    }

    // Search by business name, user name, or phone
    if (search) {
      queryBuilder.andWhere(
        '(repairer.businessName ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Order by creation date (newest first for pending)
    queryBuilder.orderBy('repairer.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const profiles = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Get stats for all statuses
    const stats = await this.getVerificationStats();

    // Transform to response format
    const data = profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      businessType: profile.businessType,
      description: profile.description,
      address: profile.address,
      city: profile.city,
      commune: profile.commune,
      quarter: profile.quarter,
      latitude: profile.latitude,
      longitude: profile.longitude,
      verificationStatus: profile.verificationStatus,
      verificationNotes: profile.verificationNotes,
      verifiedAt: profile.verifiedAt,
      createdAt: profile.createdAt,
      // Identity documents
      nationalIdNumber: profile.nationalIdNumber,
      nationalIdFrontUrl: profile.nationalIdFrontUrl,
      nationalIdBackUrl: profile.nationalIdBackUrl,
      dateOfBirth: profile.dateOfBirth,
      // Business documents
      rccmNumber: profile.rccmNumber,
      rccmDocumentUrl: profile.rccmDocumentUrl,
      taxId: profile.taxId,
      businessPhone: profile.businessPhone,
      businessEmail: profile.businessEmail,
      // Shop
      shopPhotoUrl: profile.shopPhotoUrl,
      specialties: profile.specialties,
      yearsOfExperience: profile.yearsOfExperience,
      // User info
      user: profile.user
        ? {
            id: profile.user.id,
            firstName: profile.user.firstName,
            lastName: profile.user.lastName,
            phone: profile.user.phone,
            email: profile.user.email,
            avatarUrl: profile.user.avatarUrl,
            createdAt: profile.user.createdAt,
          }
        : null,
    }));

    return { data, total, page, limit, stats };
  }

  /**
   * Get a single repairer profile with all details
   */
  async getRepairerDetail(id: string): Promise<AdminRepairerDetailResponse> {
    const profile = await this.repairerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profil réparateur non trouvé');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      // Personal identification
      dateOfBirth: profile.dateOfBirth,
      nationalIdNumber: profile.nationalIdNumber,
      nationalIdFrontUrl: profile.nationalIdFrontUrl,
      nationalIdBackUrl: profile.nationalIdBackUrl,
      personalAddress: profile.personalAddress,
      // Business information
      businessName: profile.businessName,
      businessType: profile.businessType,
      description: profile.description,
      rccmNumber: profile.rccmNumber,
      rccmDocumentUrl: profile.rccmDocumentUrl,
      taxId: profile.taxId,
      businessPhone: profile.businessPhone,
      businessEmail: profile.businessEmail,
      // Location
      address: profile.address,
      city: profile.city,
      commune: profile.commune,
      quarter: profile.quarter,
      landmark: profile.landmark,
      latitude: profile.latitude,
      longitude: profile.longitude,
      locationVerified: profile.locationVerified,
      // Shop details
      shopPhotoUrl: profile.shopPhotoUrl,
      specialties: profile.specialties,
      yearsOfExperience: profile.yearsOfExperience,
      // Verification
      verificationStatus: profile.verificationStatus,
      verificationNotes: profile.verificationNotes,
      verifiedAt: profile.verifiedAt,
      idVerified: profile.idVerified,
      businessVerified: profile.businessVerified,
      certifications: profile.certifications,
      // Stats
      ratingAvg: profile.ratingAvg,
      ratingCount: profile.ratingCount,
      totalRepairs: profile.totalRepairs,
      completionRate: profile.completionRate,
      isAvailable: profile.isAvailable,
      // Timestamps
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      // User
      user: profile.user
        ? {
            id: profile.user.id,
            firstName: profile.user.firstName,
            lastName: profile.user.lastName,
            phone: profile.user.phone,
            email: profile.user.email,
            avatarUrl: profile.user.avatarUrl,
            createdAt: profile.user.createdAt,
          }
        : null,
    };
  }

  /**
   * Verify or reject a repairer
   */
  async verifyRepairer(
    id: string,
    decision: VerificationDecisionDto,
    _adminId: string,
  ): Promise<RepairerProfile> {
    const profile = await this.repairerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profil réparateur non trouvé');
    }

    // Check current status
    if (
      profile.verificationStatus === VerificationStatus.VERIFIED &&
      decision.status === 'verified'
    ) {
      throw new BadRequestException('Ce réparateur est déjà vérifié');
    }

    if (
      profile.verificationStatus === VerificationStatus.REJECTED &&
      decision.status === 'rejected'
    ) {
      throw new BadRequestException('Ce réparateur est déjà rejeté');
    }

    // Update status
    if (decision.status === 'verified') {
      profile.verificationStatus = VerificationStatus.VERIFIED;
      profile.verifiedAt = new Date();
      profile.idVerified = true;
      profile.businessVerified = true;
    } else {
      profile.verificationStatus = VerificationStatus.REJECTED;
      profile.verifiedAt = undefined;
    }

    profile.verificationNotes = decision.notes || undefined;

    return this.repairerRepository.save(profile);
  }

  /**
   * Set repairer status to under review
   */
  async setUnderReview(id: string, notes?: string): Promise<RepairerProfile> {
    const profile = await this.repairerRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Profil réparateur non trouvé');
    }

    profile.verificationStatus = VerificationStatus.UNDER_REVIEW;
    profile.verificationNotes = notes || 'Dossier en cours de révision';

    return this.repairerRepository.save(profile);
  }

  /**
   * Suspend a repairer
   */
  async suspendRepairer(id: string, reason: string): Promise<RepairerProfile> {
    const profile = await this.repairerRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Profil réparateur non trouvé');
    }

    profile.verificationStatus = VerificationStatus.SUSPENDED;
    profile.verificationNotes = reason;
    profile.isAvailable = false;

    return this.repairerRepository.save(profile);
  }

  /**
   * Reactivate a suspended repairer
   */
  async reactivateRepairer(id: string): Promise<RepairerProfile> {
    const profile = await this.repairerRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Profil réparateur non trouvé');
    }

    if (profile.verificationStatus !== VerificationStatus.SUSPENDED) {
      throw new BadRequestException("Ce réparateur n'est pas suspendu");
    }

    profile.verificationStatus = VerificationStatus.VERIFIED;
    profile.verificationNotes = undefined;

    return this.repairerRepository.save(profile);
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<VerificationStats> {
    const counts = await this.repairerRepository
      .createQueryBuilder('repairer')
      .select('repairer.verificationStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('repairer.verificationStatus')
      .getRawMany();

    const stats = {
      pending: 0,
      underReview: 0,
      verified: 0,
      rejected: 0,
      suspended: 0,
    };

    counts.forEach((item) => {
      switch (item.status) {
        case VerificationStatus.PENDING:
          stats.pending = parseInt(item.count, 10);
          break;
        case VerificationStatus.UNDER_REVIEW:
          stats.underReview = parseInt(item.count, 10);
          break;
        case VerificationStatus.VERIFIED:
          stats.verified = parseInt(item.count, 10);
          break;
        case VerificationStatus.REJECTED:
          stats.rejected = parseInt(item.count, 10);
          break;
        case VerificationStatus.SUSPENDED:
          stats.suspended = parseInt(item.count, 10);
          break;
      }
    });

    return stats;
  }

  /**
   * Get dashboard summary for admin
   */
  async getDashboardSummary(): Promise<{
    repairers: {
      total: number;
      pending: number;
      verified: number;
    };
    users: {
      total: number;
      clients: number;
      repairers: number;
      active: number;
      suspended: number;
    };
  }> {
    const repairerStats = await this.getVerificationStats();

    const userCounts = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const statusCounts = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany();

    const users = {
      total: 0,
      clients: 0,
      repairers: 0,
      active: 0,
      suspended: 0,
    };

    userCounts.forEach((item) => {
      const count = parseInt(item.count, 10);
      // Cohérence avec /admin/users (qui exclut les admins via filtre SQL).
      // total = clients + réparateurs uniquement, l'admin n'est pas un
      // utilisateur "métier" qu'on liste.
      if (item.role === 'client') {
        users.clients = count;
        users.total += count;
      }
      if (item.role === 'repairer') {
        users.repairers = count;
        users.total += count;
      }
    });

    statusCounts.forEach((item) => {
      const count = parseInt(item.count, 10);
      if (item.status === 'active') users.active = count;
      if (item.status === 'suspended') users.suspended = count;
    });

    return {
      repairers: {
        total:
          repairerStats.pending +
          repairerStats.underReview +
          repairerStats.verified +
          repairerStats.rejected +
          repairerStats.suspended,
        pending: repairerStats.pending,
        verified: repairerStats.verified,
      },
      users,
    };
  }

  // ==========================================
  // USER ACCOUNT MANAGEMENT
  // ==========================================

  /**
   * Get all users with filters
   */
  async getUsers(params: UserListParams): Promise<AdminUserListResponse> {
    const {
      role = 'all',
      status = 'all',
      page = 1,
      limit = 20,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = params;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role != :adminRole', { adminRole: UserRole.ADMIN }); // Don't list admins

    if (role !== 'all') {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status !== 'all') {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Whitelist des colonnes triables (évite l'injection)
    const sortColumnMap: Record<string, string> = {
      createdAt: 'user.createdAt',
      firstName: 'user.firstName',
      role: 'user.role',
      status: 'user.status',
    };
    const sortColumn = sortColumnMap[sort] ?? 'user.createdAt';
    const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(sortColumn, sortDirection);

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }));

    return { data, total, page, limit };
  }

  /**
   * Get user detail
   */
  async getUserDetail(id: string): Promise<AdminUserDetailResponse> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Get repairer profile if user is a repairer
    let repairerProfile: RepairerProfile | null = null;
    if (user.role === UserRole.REPAIRER) {
      repairerProfile = await this.repairerRepository.findOne({
        where: { userId: user.id },
      });
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      repairerProfile: repairerProfile
        ? {
            id: repairerProfile.id,
            businessName: repairerProfile.businessName,
            verificationStatus: repairerProfile.verificationStatus,
          }
        : null,
    };
  }

  /**
   * Activate a user account
   */
  async activateUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Impossible de modifier un compte admin');
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Ce compte est déjà actif');
    }

    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  /**
   * Deactivate/suspend a user account
   */
  async deactivateUser(id: string, reason?: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Impossible de modifier un compte admin');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('Ce compte est déjà suspendu');
    }

    user.status = UserStatus.SUSPENDED;

    // If user is a repairer, also suspend their profile
    if (user.role === UserRole.REPAIRER) {
      const profile = await this.repairerRepository.findOne({
        where: { userId: user.id },
      });
      if (profile) {
        profile.verificationStatus = VerificationStatus.SUSPENDED;
        profile.verificationNotes =
          reason || "Compte suspendu par l'administrateur";
        profile.isAvailable = false;
        await this.repairerRepository.save(profile);
      }
    }

    return this.userRepository.save(user);
  }

  /**
   * Delete a user account (soft delete or hard delete)
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Impossible de supprimer un compte admin');
    }

    // Mark as deactivated instead of deleting
    user.status = UserStatus.DEACTIVATED;
    await this.userRepository.save(user);

    // Also deactivate repairer profile if exists
    if (user.role === UserRole.REPAIRER) {
      const profile = await this.repairerRepository.findOne({
        where: { userId: user.id },
      });
      if (profile) {
        profile.verificationStatus = VerificationStatus.SUSPENDED;
        profile.isAvailable = false;
        await this.repairerRepository.save(profile);
      }
    }
  }
}

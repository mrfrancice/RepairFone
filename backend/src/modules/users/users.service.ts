import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { RepairerProfile } from './entities/repairer-profile.entity';
import { RepairRequest, RequestStatus } from '../requests/entities/repair-request.entity';

export interface BlockedRepairerResult {
  repairerId: string;
  repairerProfileId: string;
  blockedAt: Date;
  activeRequestsCount: number;
  cancelledRequests: string[];
  notifiedClients: string[];
}

export class RepairerBlockedEvent {
  constructor(
    public readonly repairerId: string,
    public readonly repairerProfileId: string,
    public readonly reason: string,
    public readonly activeRequestIds: string[],
    public readonly clientIds: string[],
  ) {}
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RepairerProfile)
    private readonly repairerProfileRepository: Repository<RepairerProfile>,
    @InjectRepository(RepairRequest)
    private readonly repairRequestRepository: Repository<RepairRequest>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['repairerProfile'],
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    if (data.phone) {
      const existingPhone = await this.findByPhone(data.phone);
      if (existingPhone) {
        throw new ConflictException('Ce numero de telephone est deja utilise');
      }
    }
    if (data.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) {
        throw new ConflictException('Cette adresse email est deja utilisee');
      }
    }
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(id, { passwordHash });
  }

  async verifyPhone(id: string): Promise<void> {
    await this.userRepository.update(id, {
      isPhoneVerified: true,
      status: UserStatus.ACTIVE,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async incrementFailedAttempts(id: string, attempts: number): Promise<void> {
    await this.userRepository.update(id, { failedLoginAttempts: attempts });
  }

  async lockAccount(id: string, lockedUntil: Date, attempts: number): Promise<void> {
    await this.userRepository.update(id, {
      failedLoginAttempts: attempts,
      lockedUntil,
    });
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.userRepository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined as unknown as Date,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  /**
   * BIZ-010: Handle active repair requests when a repairer is blocked
   */
  async handleBlockedRepairerRequests(
    repairerId: string,
    reason: string = 'Repairer account blocked',
  ): Promise<BlockedRepairerResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repairerProfile = await queryRunner.manager.findOne(RepairerProfile, {
        where: { userId: repairerId },
      });

      if (!repairerProfile) {
        throw new NotFoundException('Profil reparateur non trouve');
      }

      const activeStatuses = [
        RequestStatus.PENDING,
        RequestStatus.ACCEPTED,
        RequestStatus.IN_PROGRESS,
        RequestStatus.AWAITING_PARTS,
        RequestStatus.DISPUTED,
      ];

      const activeRequests = await queryRunner.manager.find(RepairRequest, {
        where: {
          repairerId: repairerProfile.id,
          status: In(activeStatuses),
        },
        relations: ['client'],
        lock: { mode: 'pessimistic_write' },
      });

      const cancelledRequestIds: string[] = [];
      const notifiedClientIds: string[] = [];
      const blockedAt = new Date();

      for (const request of activeRequests) {
        request.status = RequestStatus.CANCELLED;
        request.cancelledAt = blockedAt;
        request.cancelledBy = repairerId;
        request.cancellationReason = 'Demande annulee: reparateur bloque. Raison: ' + reason;

        await queryRunner.manager.save(RepairRequest, request);
        cancelledRequestIds.push(request.id);

        if (request.clientId && !notifiedClientIds.includes(request.clientId)) {
          notifiedClientIds.push(request.clientId);
        }
      }

      repairerProfile.isBlocked = true;
      repairerProfile.blockedAt = blockedAt;
      repairerProfile.blockedReason = reason;
      repairerProfile.isAvailable = false;

      await queryRunner.manager.save(RepairerProfile, repairerProfile);

      await queryRunner.manager.update(User, repairerId, {
        status: UserStatus.SUSPENDED,
      });

      await queryRunner.commitTransaction();

      if (activeRequests.length > 0) {
        this.eventEmitter.emit(
          'repairer.blocked',
          new RepairerBlockedEvent(
            repairerId,
            repairerProfile.id,
            reason,
            cancelledRequestIds,
            notifiedClientIds,
          ),
        );
      }

      return {
        repairerId,
        repairerProfileId: repairerProfile.id,
        blockedAt,
        activeRequestsCount: activeRequests.length,
        cancelledRequests: cancelledRequestIds,
        notifiedClients: notifiedClientIds,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * BIZ-010: Check if a repairer has active repair requests
   */
  async getRepairerActiveRequests(repairerId: string): Promise<{
    hasActiveRequests: boolean;
    count: number;
    requestIds: string[];
    clientsAffected: number;
  }> {
    const repairerProfile = await this.repairerProfileRepository.findOne({
      where: { userId: repairerId },
    });

    if (!repairerProfile) {
      throw new NotFoundException('Profil reparateur non trouve');
    }

    const activeStatuses = [
      RequestStatus.PENDING,
      RequestStatus.ACCEPTED,
      RequestStatus.IN_PROGRESS,
      RequestStatus.AWAITING_PARTS,
      RequestStatus.DISPUTED,
    ];

    const activeRequests = await this.repairRequestRepository.find({
      where: {
        repairerId: repairerProfile.id,
        status: In(activeStatuses),
      },
      select: ['id', 'clientId'],
    });

    const uniqueClients = new Set(activeRequests.map((r) => r.clientId));

    return {
      hasActiveRequests: activeRequests.length > 0,
      count: activeRequests.length,
      requestIds: activeRequests.map((r) => r.id),
      clientsAffected: uniqueClients.size,
    };
  }

  /**
   * BIZ-010: Block a repairer and handle their active requests
   */
  async blockRepairer(
    repairerId: string,
    reason: string,
    forceBlock: boolean = false,
  ): Promise<BlockedRepairerResult> {
    const activeRequestsInfo = await this.getRepairerActiveRequests(repairerId);

    if (activeRequestsInfo.hasActiveRequests && !forceBlock) {
      throw new BadRequestException(
        'Le reparateur a ' + activeRequestsInfo.count + ' demandes actives. forceBlock=true requis.',
      );
    }

    return this.handleBlockedRepairerRequests(repairerId, reason);
  }

  /**
   * BIZ-010: Unblock a repairer
   */
  async unblockRepairer(repairerId: string): Promise<RepairerProfile> {
    const repairerProfile = await this.repairerProfileRepository.findOne({
      where: { userId: repairerId },
    });

    if (!repairerProfile) {
      throw new NotFoundException('Profil reparateur non trouve');
    }

    if (!repairerProfile.isBlocked) {
      throw new BadRequestException('Le reparateur nest pas bloque');
    }

    repairerProfile.isBlocked = false;
    repairerProfile.blockedAt = undefined;
    repairerProfile.blockedReason = undefined;

    await this.repairerProfileRepository.save(repairerProfile);

    await this.userRepository.update(repairerId, {
      status: UserStatus.ACTIVE,
    });

    return repairerProfile;
  }
}

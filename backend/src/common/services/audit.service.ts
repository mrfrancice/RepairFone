import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

export interface AuditLogOptions {
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  metadata?: object;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @Optional() @Inject(REQUEST) private readonly request?: Request,
  ) {}

  /**
   * Log an audit event
   * @param action The action performed (LOGIN, LOGOUT, CREATE, UPDATE, DELETE)
   * @param entityType The type of entity being acted upon
   * @param entityId Optional ID of the entity
   * @param userId The user performing the action
   * @param metadata Optional additional data about the action
   */
  async log(
    action: string,
    entityType: string,
    entityId: string | undefined,
    userId: string,
    metadata?: object,
  ): Promise<AuditLog> {
    const ipAddress = this.getIpAddress();
    const userAgent = this.getUserAgent();

    const auditLog = this.auditLogRepo.create({
      action,
      entityType,
      entityId,
      userId,
      ipAddress,
      userAgent,
      metadata,
    });

    return this.auditLogRepo.save(auditLog);
  }

  /**
   * Log an audit event with explicit IP and user agent
   */
  async logWithContext(options: AuditLogOptions): Promise<AuditLog> {
    const auditLog = this.auditLogRepo.create({
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      userId: options.userId,
      ipAddress: options.ipAddress || this.getIpAddress(),
      userAgent: options.userAgent || this.getUserAgent(),
      metadata: options.metadata,
    });

    return this.auditLogRepo.save(auditLog);
  }

  /**
   * Log a login event
   */
  async logLogin(userId: string, metadata?: object): Promise<AuditLog> {
    return this.log(AuditAction.LOGIN, 'User', userId, userId, metadata);
  }

  /**
   * Log a logout event
   */
  async logLogout(userId: string, metadata?: object): Promise<AuditLog> {
    return this.log(AuditAction.LOGOUT, 'User', userId, userId, metadata);
  }

  /**
   * Log a create event
   */
  async logCreate(
    entityType: string,
    entityId: string,
    userId: string,
    metadata?: object,
  ): Promise<AuditLog> {
    return this.log(AuditAction.CREATE, entityType, entityId, userId, metadata);
  }

  /**
   * Log an update event
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    userId: string,
    metadata?: object,
  ): Promise<AuditLog> {
    return this.log(AuditAction.UPDATE, entityType, entityId, userId, metadata);
  }

  /**
   * Log a delete event
   */
  async logDelete(
    entityType: string,
    entityId: string,
    userId: string,
    metadata?: object,
  ): Promise<AuditLog> {
    return this.log(AuditAction.DELETE, entityType, entityId, userId, metadata);
  }

  /**
   * Get audit logs with filtering options
   */
  async findLogs(filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepo.createQueryBuilder('audit');

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', {
        entityId: filters.entityId,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('audit.createdAt', 'DESC');
    queryBuilder.skip(skip);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  private getIpAddress(): string | undefined {
    if (!this.request) return undefined;

    const forwarded = this.request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    const realIp = this.request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return this.request.ip || this.request.socket?.remoteAddress;
  }

  private getUserAgent(): string | undefined {
    if (!this.request) return undefined;

    const userAgent = this.request.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent[0] : userAgent;
  }
}

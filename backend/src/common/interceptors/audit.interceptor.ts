import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from '../services/audit.service';
import { AuditAction } from '../entities/audit-log.entity';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;

    // Only audit POST, PUT, PATCH, DELETE requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;

    // Skip if no authenticated user
    if (!user?.id) {
      return next.handle();
    }

    const action = this.getActionFromMethod(method);
    const entityType = this.getEntityTypeFromRoute(request);
    const entityId = this.getEntityIdFromRoute(request);
    const ipAddress = this.getIpAddress(request);
    const uaHeader = request.headers['user-agent'];
    const userAgent = typeof uaHeader === 'string' ? uaHeader : undefined;

    // Resolve AuditService dynamically for request-scoped service
    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId(request, contextId);

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          void (async () => {
            try {
              // Resolve the request-scoped AuditService
              const auditService = await this.moduleRef.resolve<AuditService>(
                AuditService,
                contextId,
                { strict: false },
              );

              if (!auditService) {
                this.logger.warn(
                  'AuditService not available, skipping audit log',
                );
                return;
              }

              // Log after successful response
              const metadata: Record<string, unknown> = {
                path: request.path,
                method: request.method,
              };

              // Include request body (sanitize sensitive data)
              const body = request.body as Record<string, unknown> | undefined;
              if (body && Object.keys(body).length > 0) {
                metadata.body = this.sanitizeBody(body);
              }

              // Extract entity ID from response if it's a CREATE action
              const data = responseData as { id?: string } | undefined;
              let finalEntityId = entityId;
              if (action === AuditAction.CREATE && data?.id) {
                finalEntityId = data.id;
              }

              // Log the audit event (don't block the response)
              await auditService.logWithContext({
                action,
                entityType,
                entityId: finalEntityId,
                userId: user.id,
                ipAddress,
                userAgent,
                metadata,
              });
            } catch (error) {
              // Log error but don't fail the request
              const err = error as Error;
              this.logger.error('Failed to log audit event', err.stack);
            }
          })();
        },
        error: () => {
          // Optionally log failed requests
          // Could add a separate error logging here if needed
        },
      }),
    );
  }

  private getActionFromMethod(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        // Methods are pre-filtered (POST/PUT/PATCH/DELETE), default unreachable.
        return AuditAction.UPDATE;
    }
  }

  private getEntityTypeFromRoute(request: Request): string {
    // Extract entity type from the route path
    // e.g., /api/users/123 -> User, /api/quotes/456 -> Quote
    const path = request.path || request.url;
    const segments = path.split('/').filter(Boolean);

    // Common patterns: /api/entity-type or /entity-type
    for (const segment of segments) {
      if (segment === 'api') continue;

      // Convert plural to singular and capitalize
      return this.formatEntityType(segment);
    }

    return 'Unknown';
  }

  private formatEntityType(segment: string): string {
    // Remove trailing 's' for simple plurals and capitalize
    let singular = segment;

    // Handle common plural patterns
    if (singular.endsWith('ies')) {
      singular = singular.slice(0, -3) + 'y';
    } else if (singular.endsWith('es') && !singular.endsWith('ices')) {
      singular = singular.slice(0, -2);
    } else if (singular.endsWith('s') && !singular.endsWith('ss')) {
      singular = singular.slice(0, -1);
    }

    // Handle kebab-case
    const words = singular.split('-');
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private getEntityIdFromRoute(request: Request): string | undefined {
    // Extract entity ID from route params
    const params = request.params;

    if (params?.id) {
      return params.id;
    }

    // Try to find any UUID-like parameter
    for (const key of Object.keys(params || {})) {
      const value = params[key];
      if (this.isUuid(value)) {
        return value;
      }
    }

    return undefined;
  }

  private isUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private getIpAddress(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket?.remoteAddress;
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    // List of sensitive fields to redact
    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'cardNumber',
      'cvv',
      'pin',
      'otp',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (
        sensitiveFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        sanitized[key] = this.sanitizeBody(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

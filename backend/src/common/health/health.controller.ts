import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../decorators/public.decorator';

/**
 * Endpoints health pour load balancers / orchestrateurs (Kubernetes, Docker Swarm).
 *
 * - GET /health    → liveness : le process tourne (toujours 200 si l'app a démarré)
 * - GET /health/db → readiness : la DB répond (200 OK ou 503 Service Unavailable)
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startedAt = new Date();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return {
      status: 'ok',
      service: 'repairfone-api',
      uptime: Math.round((Date.now() - this.startedAt.getTime()) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @Public()
  @ApiOperation({ summary: 'Readiness probe (DB connectivity)' })
  async readiness() {
    try {
      // Ping PostgreSQL via une requête triviale
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Database connection failed';
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

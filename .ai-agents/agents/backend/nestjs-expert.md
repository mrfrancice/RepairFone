---
name: nestjs-expert
version: "2.0"
description: |
  Expert NestJS 11+ spécialisé pour RepairFone.
  TypeORM, PostgreSQL, JWT, WebSockets.
  
  ## Quand utiliser
  - Création de modules/controllers/services NestJS
  - Entités TypeORM et migrations
  - Guards et interceptors
  - WebSockets (chat, notifications)
  - API REST et DTOs
  
  ## Quand NE PAS utiliser
  - Frontend Angular → angular-expert
  - Optimisation SQL pure → database-expert
  - CI/CD → devops-sre

model: opus
domain: backend
level: expert
stack: nestjs
---

# NestJS Expert - RepairFone

## MISSION

Expert NestJS 11+ dédié au projet RepairFone. Vous maîtrisez TypeORM, l'authentification JWT, les WebSockets et les patterns NestJS modernes.

---

## CONVENTIONS REPAIRFONE

### Structure d'un module

```
modules/feature-name/
├── dto/
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
├── entities/
│   └── feature.entity.ts
├── feature.controller.ts
├── feature.service.ts
├── feature.module.ts
└── feature.gateway.ts (si WebSocket)
```

### Entité TypeORM

```typescript
// entities/feature.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  })
  status: 'pending' | 'active' | 'completed';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @ManyToOne(() => User, user => user.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### DTOs avec validation

```typescript
// dto/create-feature.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ example: 'Réparation écran', description: 'Titre de la demande' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Écran cassé suite à une chute' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['pending', 'active', 'completed'], default: 'pending' })
  @IsEnum(['pending', 'active', 'completed'])
  @IsOptional()
  status?: 'pending' | 'active' | 'completed';

  @ApiPropertyOptional({ example: 150.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}

// dto/update-feature.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateFeatureDto } from './create-feature.dto';

export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
```

### Controller

```typescript
// feature.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request, ParseUUIDPipe, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@ApiTags('Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une feature' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Feature créée' })
  create(@Request() req, @Body() dto: CreateFeatureDto) {
    return this.featureService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des features' })
  findAll(@Request() req, @Query('status') status?: string) {
    return this.featureService.findAll(req.user.id, { status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une feature' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une feature' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureDto
  ) {
    return this.featureService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une feature' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureService.remove(id);
  }
}
```

### Service

```typescript
// feature.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from './entities/feature.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,
  ) {}

  async create(userId: string, dto: CreateFeatureDto): Promise<Feature> {
    const feature = this.featureRepository.create({
      ...dto,
      userId,
    });
    return this.featureRepository.save(feature);
  }

  async findAll(userId: string, filters?: { status?: string }): Promise<Feature[]> {
    const query = this.featureRepository.createQueryBuilder('feature')
      .where('feature.userId = :userId', { userId })
      .orderBy('feature.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('feature.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Feature> {
    const feature = await this.featureRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!feature) {
      throw new NotFoundException(`Feature #${id} not found`);
    }

    return feature;
  }

  async update(id: string, dto: UpdateFeatureDto): Promise<Feature> {
    const feature = await this.findOne(id);
    Object.assign(feature, dto);
    return this.featureRepository.save(feature);
  }

  async remove(id: string): Promise<void> {
    const result = await this.featureRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Feature #${id} not found`);
    }
  }
}
```

### Module

```typescript
// feature.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entities/feature.entity';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

@Module({
  imports: [TypeOrmModule.forFeature([Feature])],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

### WebSocket Gateway

```typescript
// feature.gateway.ts
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  namespace: '/features',
  cors: { origin: '*' }
})
export class FeatureGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    client.join(data.roomId);
    return { event: 'joined', data: { roomId: data.roomId } };
  }

  // Émettre vers tous les clients d'une room
  notifyRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }
}
```

---

## MODULES REPAIRFONE

### Modules existants
- `auth/` - JWT, guards, strategies
- `users/` - Gestion utilisateurs
- `requests/` - Demandes de réparation
- `quotes/` - Devis
- `payments/` - Paiements
- `chat/` - Messagerie WebSocket
- `notifications/` - Notifications push
- `reviews/` - Avis
- `disputes/` - Litiges
- `admin/` - Administration
- `devices/` - Appareils
- `locations/` - Géolocalisation

---

## PATTERNS DE SÉCURITÉ

### Guards

```typescript
// Vérifier le propriétaire d'une ressource
@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceUserId = request.params.userId || request.body.userId;
    
    return user.id === resourceUserId || user.role === 'admin';
  }
}
```

### Interceptors

```typescript
// Transformer les réponses
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

---

## ANTI-PATTERNS

❌ Logique métier dans les controllers
❌ Queries SQL raw sans paramètres
❌ Pas de validation DTO
❌ Secrets en dur dans le code
❌ any types
❌ Catch-all sans logging

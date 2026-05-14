import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ServiceTypesService,
  CreateServiceTypeDto,
  UpdateServiceTypeDto,
} from './service-types.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Service Types')
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get('device/:deviceId')
  @Public()
  @ApiOperation({ summary: 'Liste les types de service pour un appareil' })
  findByDevice(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    return this.serviceTypesService.findByDevice(deviceId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: "Détails d'un type de service" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceTypesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un type de service (admin)' })
  create(@Body() dto: CreateServiceTypeDto) {
    return this.serviceTypesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un type de service (admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceTypeDto,
  ) {
    return this.serviceTypesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un type de service (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceTypesService.remove(id);
  }

  @Post('seed/:deviceId/:category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initialiser les services pour un appareil (admin)',
  })
  seed(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Param('category') category: string,
  ) {
    return this.serviceTypesService.seedServiceTypes(deviceId, category);
  }
}

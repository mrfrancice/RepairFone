import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { ServiceType } from './entities/service-type.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { ServiceTypesService } from './service-types.service';
import { ServiceTypesController } from './service-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Device, ServiceType])],
  controllers: [DevicesController, ServiceTypesController],
  providers: [DevicesService, ServiceTypesService],
  exports: [DevicesService, ServiceTypesService],
})
export class DevicesModule {}

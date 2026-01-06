import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairRequest } from './entities/repair-request.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { UsersModule } from '../users/users.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RepairRequest, RequestStatusHistory, RepairerProfile]),
    UsersModule,
    DevicesModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}

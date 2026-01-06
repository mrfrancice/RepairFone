import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '../../modules/users/entities/user.entity';
import { RepairerProfile } from '../../modules/users/entities/repairer-profile.entity';
import { Device } from '../../modules/devices/entities/device.entity';
import { ServiceType } from '../../modules/devices/entities/service-type.entity';
import { RepairRequest } from '../../modules/requests/entities/repair-request.entity';
import { Review } from '../../modules/reviews/entities/review.entity';
import { Expert } from '../../modules/conseils/entities/expert.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RepairerProfile,
      Device,
      ServiceType,
      RepairRequest,
      Review,
      Expert,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}

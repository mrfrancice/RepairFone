import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RepairerProfile } from './entities/repairer-profile.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RepairersService } from './repairers.service';
import { RepairersController } from './repairers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, RepairerProfile])],
  controllers: [UsersController, RepairersController],
  providers: [UsersService, RepairersService],
  exports: [UsersService, RepairersService],
})
export class UsersModule {}

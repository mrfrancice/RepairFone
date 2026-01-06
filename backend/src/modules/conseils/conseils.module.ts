import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expert } from './entities/expert.entity';
import { ConseilSession } from './entities/conseil-session.entity';
import { ConseilMessage } from './entities/conseil-message.entity';
import { ConseilsService } from './conseils.service';
import { ConseilsController } from './conseils.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expert, ConseilSession, ConseilMessage, User]),
  ],
  controllers: [ConseilsController],
  providers: [ConseilsService],
  exports: [ConseilsService],
})
export class ConseilsModule {}

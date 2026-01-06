import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { GeocodingController } from './geocoding.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  controllers: [LocationsController, GeocodingController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}

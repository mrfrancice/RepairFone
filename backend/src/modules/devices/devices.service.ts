import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Device, DeviceCategory } from './entities/device.entity';

export class CreateDeviceDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SearchDevicesDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(dto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepository.create({
      brand: dto.brand,
      model: dto.model,
      category: dto.category as DeviceCategory,
      imageUrl: dto.imageUrl,
    });
    return this.deviceRepository.save(device);
  }

  async findAll(query: SearchDevicesDto): Promise<{ data: Device[]; total: number; page: number; limit: number }> {
    const { brand, category, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.serviceTypes', 'serviceTypes')
      .where('device.isActive = :isActive', { isActive: true });

    if (brand) {
      queryBuilder.andWhere('device.brand = :brand', { brand });
    }

    if (category) {
      queryBuilder.andWhere('device.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(device.brand ILIKE :search OR device.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('device.brand', 'ASC')
      .addOrderBy('device.model', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['serviceTypes'],
    });

    if (!device) {
      throw new NotFoundException('Appareil non trouvé');
    }

    return device;
  }

  async findByBrandAndModel(brand: string, model: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { brand, model },
      relations: ['serviceTypes'],
    });
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    Object.assign(device, dto);
    return this.deviceRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);
    await this.deviceRepository.remove(device);
  }

  async getBrands(): Promise<string[]> {
    const result = await this.deviceRepository
      .createQueryBuilder('device')
      .select('DISTINCT device.brand', 'brand')
      .where('device.isActive = :isActive', { isActive: true })
      .orderBy('device.brand', 'ASC')
      .getRawMany();

    return result.map((r) => r.brand);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.deviceRepository
      .createQueryBuilder('device')
      .select('DISTINCT device.category', 'category')
      .where('device.isActive = :isActive', { isActive: true })
      .orderBy('device.category', 'ASC')
      .getRawMany();

    return result.map((r) => r.category);
  }

  async seedDevices(): Promise<void> {
    const count = await this.deviceRepository.count();
    if (count > 0) return;

    const devices: CreateDeviceDto[] = [
      // Smartphones
      { brand: 'Apple', model: 'iPhone 15 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 15 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 15', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 13', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 12', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 11', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S24+', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S24', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S23 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A54', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A34', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 13 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 12', category: 'smartphone' },
      { brand: 'Huawei', model: 'P60 Pro', category: 'smartphone' },
      { brand: 'Oppo', model: 'Reno 10 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Camon 20 Pro', category: 'smartphone' },
      { brand: 'Infinix', model: 'Note 30 Pro', category: 'smartphone' },
      // Tablets
      { brand: 'Apple', model: 'iPad Pro 12.9"', category: 'tablet' },
      { brand: 'Apple', model: 'iPad Pro 11"', category: 'tablet' },
      { brand: 'Apple', model: 'iPad Air', category: 'tablet' },
      { brand: 'Apple', model: 'iPad 10e gen', category: 'tablet' },
      { brand: 'Samsung', model: 'Galaxy Tab S9 Ultra', category: 'tablet' },
      { brand: 'Samsung', model: 'Galaxy Tab S9', category: 'tablet' },
      { brand: 'Samsung', model: 'Galaxy Tab A9', category: 'tablet' },
      // Laptops
      { brand: 'Apple', model: 'MacBook Pro 16"', category: 'laptop' },
      { brand: 'Apple', model: 'MacBook Pro 14"', category: 'laptop' },
      { brand: 'Apple', model: 'MacBook Air M3', category: 'laptop' },
      { brand: 'HP', model: 'Pavilion 15', category: 'laptop' },
      { brand: 'HP', model: 'Envy x360', category: 'laptop' },
      { brand: 'Dell', model: 'XPS 15', category: 'laptop' },
      { brand: 'Dell', model: 'Inspiron 15', category: 'laptop' },
      { brand: 'Lenovo', model: 'ThinkPad X1 Carbon', category: 'laptop' },
      { brand: 'Lenovo', model: 'IdeaPad 5', category: 'laptop' },
      { brand: 'Asus', model: 'ZenBook 14', category: 'laptop' },
    ];

    for (const device of devices) {
      await this.create(device);
    }
  }
}

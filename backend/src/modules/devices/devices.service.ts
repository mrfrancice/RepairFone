import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Device, DeviceCategory } from './entities/device.entity';
import { ServiceTypesService } from './service-types.service';

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
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @Inject(forwardRef(() => ServiceTypesService))
    private readonly serviceTypesService: ServiceTypesService,
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

  async findAll(
    query: SearchDevicesDto,
  ): Promise<{ data: Device[]; total: number; page: number; limit: number }> {
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

  async findByBrandAndModel(
    brand: string,
    model: string,
  ): Promise<Device | null> {
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

  async getBrands(category?: string): Promise<string[]> {
    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .select('DISTINCT device.brand', 'brand')
      .where('device.isActive = :isActive', { isActive: true });

    if (category) {
      queryBuilder.andWhere('device.category = :category', { category });
    }

    const result = await queryBuilder
      .orderBy('device.brand', 'ASC')
      .getRawMany<{ brand: string }>();

    return result.map((r) => r.brand);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.deviceRepository
      .createQueryBuilder('device')
      .select('DISTINCT device.category', 'category')
      .where('device.isActive = :isActive', { isActive: true })
      .orderBy('device.category', 'ASC')
      .getRawMany<{ category: string }>();

    return result.map((r) => r.category);
  }

  async seedDevices(
    force = false,
  ): Promise<{ created: number; message: string }> {
    if (force) {
      // Delete existing devices (cascade will delete service_types)
      await this.deviceRepository.delete({});
    } else {
      const count = await this.deviceRepository.count();
      if (count > 0) {
        return {
          created: 0,
          message:
            'Données déjà présentes. Utilisez force=true pour réinitialiser.',
        };
      }
    }

    const devices: CreateDeviceDto[] = [
      // ==========================================
      // SMARTPHONES
      // ==========================================

      // Apple iPhone
      { brand: 'Apple', model: 'iPhone 15 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 15 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 15 Plus', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 15', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14 Plus', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 14', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 13 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 13 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 13', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 13 Mini', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 12 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 12 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 12', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 12 Mini', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 11 Pro Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 11 Pro', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone 11', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone XS Max', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone XS', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone XR', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone X', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone SE (2022)', category: 'smartphone' },
      { brand: 'Apple', model: 'iPhone SE (2020)', category: 'smartphone' },

      // Samsung Galaxy S Series
      { brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S24+', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S24', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S23 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S23+', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S23', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S22 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S22+', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S22', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S21 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S21+', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S21', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S20 Ultra', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S20+', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy S20', category: 'smartphone' },

      // Samsung Galaxy A Series
      { brand: 'Samsung', model: 'Galaxy A55', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A54', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A53', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A35', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A34', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A33', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A25', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A24', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A15', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A14', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A05s', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy A05', category: 'smartphone' },

      // Samsung Galaxy Z (Foldables)
      { brand: 'Samsung', model: 'Galaxy Z Fold 5', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy Z Flip 5', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy Z Fold 4', category: 'smartphone' },
      { brand: 'Samsung', model: 'Galaxy Z Flip 4', category: 'smartphone' },

      // Xiaomi
      { brand: 'Xiaomi', model: 'Xiaomi 14 Ultra', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Xiaomi 14 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Xiaomi 14', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Xiaomi 13 Ultra', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Xiaomi 13 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Xiaomi 13', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 13 Pro+', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 13 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 13', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 12 Pro+', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 12 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi Note 12', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi 13C', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Redmi 12', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Poco X6 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Poco X6', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Poco M6 Pro', category: 'smartphone' },
      { brand: 'Xiaomi', model: 'Poco C65', category: 'smartphone' },

      // Tecno
      { brand: 'Tecno', model: 'Phantom X2 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Phantom X2', category: 'smartphone' },
      { brand: 'Tecno', model: 'Phantom V Fold', category: 'smartphone' },
      { brand: 'Tecno', model: 'Camon 30 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Camon 30', category: 'smartphone' },
      { brand: 'Tecno', model: 'Camon 20 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Camon 20', category: 'smartphone' },
      { brand: 'Tecno', model: 'Spark 20 Pro+', category: 'smartphone' },
      { brand: 'Tecno', model: 'Spark 20 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Spark 20', category: 'smartphone' },
      { brand: 'Tecno', model: 'Spark 10 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Spark 10', category: 'smartphone' },
      { brand: 'Tecno', model: 'Pova 6 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Pova 5 Pro', category: 'smartphone' },
      { brand: 'Tecno', model: 'Pova 5', category: 'smartphone' },
      { brand: 'Tecno', model: 'Pop 8', category: 'smartphone' },
      { brand: 'Tecno', model: 'Pop 7 Pro', category: 'smartphone' },

      // Infinix
      { brand: 'Infinix', model: 'Zero 30 5G', category: 'smartphone' },
      { brand: 'Infinix', model: 'Zero 30', category: 'smartphone' },
      { brand: 'Infinix', model: 'Note 40 Pro', category: 'smartphone' },
      { brand: 'Infinix', model: 'Note 40', category: 'smartphone' },
      { brand: 'Infinix', model: 'Note 30 Pro', category: 'smartphone' },
      { brand: 'Infinix', model: 'Note 30', category: 'smartphone' },
      { brand: 'Infinix', model: 'Note 30 VIP', category: 'smartphone' },
      { brand: 'Infinix', model: 'Hot 40 Pro', category: 'smartphone' },
      { brand: 'Infinix', model: 'Hot 40', category: 'smartphone' },
      { brand: 'Infinix', model: 'Hot 30 Play', category: 'smartphone' },
      { brand: 'Infinix', model: 'Hot 30', category: 'smartphone' },
      { brand: 'Infinix', model: 'Smart 8', category: 'smartphone' },
      { brand: 'Infinix', model: 'Smart 7', category: 'smartphone' },

      // Huawei
      { brand: 'Huawei', model: 'P60 Pro', category: 'smartphone' },
      { brand: 'Huawei', model: 'P60', category: 'smartphone' },
      { brand: 'Huawei', model: 'P50 Pro', category: 'smartphone' },
      { brand: 'Huawei', model: 'P50', category: 'smartphone' },
      { brand: 'Huawei', model: 'Mate 60 Pro', category: 'smartphone' },
      { brand: 'Huawei', model: 'Mate 60', category: 'smartphone' },
      { brand: 'Huawei', model: 'Mate 50 Pro', category: 'smartphone' },
      { brand: 'Huawei', model: 'Nova 12 Pro', category: 'smartphone' },
      { brand: 'Huawei', model: 'Nova 12', category: 'smartphone' },
      { brand: 'Huawei', model: 'Nova 11 Pro', category: 'smartphone' },
      { brand: 'Huawei', model: 'Nova Y91', category: 'smartphone' },
      { brand: 'Huawei', model: 'Nova Y72', category: 'smartphone' },

      // Oppo
      { brand: 'Oppo', model: 'Find X7 Ultra', category: 'smartphone' },
      { brand: 'Oppo', model: 'Find X6 Pro', category: 'smartphone' },
      { brand: 'Oppo', model: 'Reno 11 Pro', category: 'smartphone' },
      { brand: 'Oppo', model: 'Reno 11', category: 'smartphone' },
      { brand: 'Oppo', model: 'Reno 10 Pro+', category: 'smartphone' },
      { brand: 'Oppo', model: 'Reno 10 Pro', category: 'smartphone' },
      { brand: 'Oppo', model: 'Reno 10', category: 'smartphone' },
      { brand: 'Oppo', model: 'A98', category: 'smartphone' },
      { brand: 'Oppo', model: 'A78', category: 'smartphone' },
      { brand: 'Oppo', model: 'A58', category: 'smartphone' },
      { brand: 'Oppo', model: 'A38', category: 'smartphone' },
      { brand: 'Oppo', model: 'A18', category: 'smartphone' },

      // Realme
      { brand: 'Realme', model: 'GT 5 Pro', category: 'smartphone' },
      { brand: 'Realme', model: 'GT Neo 5', category: 'smartphone' },
      { brand: 'Realme', model: '12 Pro+', category: 'smartphone' },
      { brand: 'Realme', model: '12 Pro', category: 'smartphone' },
      { brand: 'Realme', model: '11 Pro+', category: 'smartphone' },
      { brand: 'Realme', model: '11 Pro', category: 'smartphone' },
      { brand: 'Realme', model: 'C67', category: 'smartphone' },
      { brand: 'Realme', model: 'C55', category: 'smartphone' },
      { brand: 'Realme', model: 'C53', category: 'smartphone' },

      // Vivo
      { brand: 'Vivo', model: 'X100 Pro', category: 'smartphone' },
      { brand: 'Vivo', model: 'X100', category: 'smartphone' },
      { brand: 'Vivo', model: 'V30 Pro', category: 'smartphone' },
      { brand: 'Vivo', model: 'V30', category: 'smartphone' },
      { brand: 'Vivo', model: 'V29 Pro', category: 'smartphone' },
      { brand: 'Vivo', model: 'V29', category: 'smartphone' },
      { brand: 'Vivo', model: 'Y100', category: 'smartphone' },
      { brand: 'Vivo', model: 'Y36', category: 'smartphone' },
      { brand: 'Vivo', model: 'Y27', category: 'smartphone' },

      // OnePlus
      { brand: 'OnePlus', model: '12', category: 'smartphone' },
      { brand: 'OnePlus', model: '11', category: 'smartphone' },
      { brand: 'OnePlus', model: 'Open', category: 'smartphone' },
      { brand: 'OnePlus', model: 'Nord 3', category: 'smartphone' },
      { brand: 'OnePlus', model: 'Nord CE 3', category: 'smartphone' },

      // Google Pixel
      { brand: 'Google', model: 'Pixel 8 Pro', category: 'smartphone' },
      { brand: 'Google', model: 'Pixel 8', category: 'smartphone' },
      { brand: 'Google', model: 'Pixel 8a', category: 'smartphone' },
      { brand: 'Google', model: 'Pixel 7 Pro', category: 'smartphone' },
      { brand: 'Google', model: 'Pixel 7', category: 'smartphone' },
      { brand: 'Google', model: 'Pixel 7a', category: 'smartphone' },

      // Nokia
      { brand: 'Nokia', model: 'G42', category: 'smartphone' },
      { brand: 'Nokia', model: 'G22', category: 'smartphone' },
      { brand: 'Nokia', model: 'C32', category: 'smartphone' },
      { brand: 'Nokia', model: 'C22', category: 'smartphone' },

      // Motorola
      { brand: 'Motorola', model: 'Edge 40 Pro', category: 'smartphone' },
      { brand: 'Motorola', model: 'Edge 40', category: 'smartphone' },
      { brand: 'Motorola', model: 'Moto G84', category: 'smartphone' },
      { brand: 'Motorola', model: 'Moto G54', category: 'smartphone' },
      { brand: 'Motorola', model: 'Moto G34', category: 'smartphone' },

      // ==========================================
      // COMPUTERS (Laptops)
      // ==========================================

      // Apple MacBook
      { brand: 'Apple', model: 'MacBook Pro 16" M3 Max', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 16" M3 Pro', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 14" M3 Max', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 14" M3 Pro', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 14" M3', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Air 15" M3', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Air 13" M3', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 16" M2 Max', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 16" M2 Pro', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Pro 14" M2', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Air 15" M2', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Air 13" M2', category: 'computer' },
      { brand: 'Apple', model: 'MacBook Air M1', category: 'computer' },
      { brand: 'Apple', model: 'iMac 24" M3', category: 'computer' },
      { brand: 'Apple', model: 'Mac Mini M2', category: 'computer' },
      { brand: 'Apple', model: 'Mac Studio M2', category: 'computer' },

      // HP
      { brand: 'HP', model: 'Spectre x360 16"', category: 'computer' },
      { brand: 'HP', model: 'Spectre x360 14"', category: 'computer' },
      { brand: 'HP', model: 'Envy x360 15"', category: 'computer' },
      { brand: 'HP', model: 'Envy x360 13"', category: 'computer' },
      { brand: 'HP', model: 'Pavilion Plus 14"', category: 'computer' },
      { brand: 'HP', model: 'Pavilion 15"', category: 'computer' },
      { brand: 'HP', model: 'Pavilion 14"', category: 'computer' },
      { brand: 'HP', model: 'EliteBook 840 G10', category: 'computer' },
      { brand: 'HP', model: 'EliteBook 850 G10', category: 'computer' },
      { brand: 'HP', model: 'ProBook 450 G10', category: 'computer' },
      { brand: 'HP', model: 'ProBook 440 G10', category: 'computer' },
      { brand: 'HP', model: 'Victus 15"', category: 'computer' },
      { brand: 'HP', model: 'Victus 16"', category: 'computer' },
      { brand: 'HP', model: 'Omen 16"', category: 'computer' },
      { brand: 'HP', model: 'Omen 17"', category: 'computer' },
      { brand: 'HP', model: '250 G9', category: 'computer' },
      { brand: 'HP', model: '255 G9', category: 'computer' },

      // Dell
      { brand: 'Dell', model: 'XPS 17 (2024)', category: 'computer' },
      { brand: 'Dell', model: 'XPS 15 (2024)', category: 'computer' },
      { brand: 'Dell', model: 'XPS 14 (2024)', category: 'computer' },
      { brand: 'Dell', model: 'XPS 13 Plus', category: 'computer' },
      { brand: 'Dell', model: 'XPS 13', category: 'computer' },
      { brand: 'Dell', model: 'Inspiron 16 Plus', category: 'computer' },
      { brand: 'Dell', model: 'Inspiron 16 2-in-1', category: 'computer' },
      { brand: 'Dell', model: 'Inspiron 15', category: 'computer' },
      { brand: 'Dell', model: 'Inspiron 14', category: 'computer' },
      { brand: 'Dell', model: 'Latitude 7440', category: 'computer' },
      { brand: 'Dell', model: 'Latitude 5540', category: 'computer' },
      { brand: 'Dell', model: 'Latitude 5440', category: 'computer' },
      { brand: 'Dell', model: 'Vostro 16 5640', category: 'computer' },
      { brand: 'Dell', model: 'Vostro 15 3530', category: 'computer' },
      { brand: 'Dell', model: 'G16 Gaming', category: 'computer' },
      { brand: 'Dell', model: 'G15 Gaming', category: 'computer' },
      { brand: 'Dell', model: 'Alienware m18', category: 'computer' },
      { brand: 'Dell', model: 'Alienware m16', category: 'computer' },
      { brand: 'Dell', model: 'Alienware x16', category: 'computer' },

      // Lenovo
      {
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon Gen 11',
        category: 'computer',
      },
      {
        brand: 'Lenovo',
        model: 'ThinkPad X1 Yoga Gen 8',
        category: 'computer',
      },
      { brand: 'Lenovo', model: 'ThinkPad T14s Gen 4', category: 'computer' },
      { brand: 'Lenovo', model: 'ThinkPad T14 Gen 4', category: 'computer' },
      { brand: 'Lenovo', model: 'ThinkPad E14 Gen 5', category: 'computer' },
      { brand: 'Lenovo', model: 'ThinkPad E15 Gen 5', category: 'computer' },
      { brand: 'Lenovo', model: 'ThinkPad L14 Gen 4', category: 'computer' },
      { brand: 'Lenovo', model: 'IdeaPad Pro 5 16"', category: 'computer' },
      { brand: 'Lenovo', model: 'IdeaPad Slim 5 16"', category: 'computer' },
      { brand: 'Lenovo', model: 'IdeaPad Slim 5 14"', category: 'computer' },
      { brand: 'Lenovo', model: 'IdeaPad Flex 5 16"', category: 'computer' },
      { brand: 'Lenovo', model: 'IdeaPad 3 15"', category: 'computer' },
      { brand: 'Lenovo', model: 'Yoga 9i 14"', category: 'computer' },
      { brand: 'Lenovo', model: 'Yoga Slim 7 Pro', category: 'computer' },
      { brand: 'Lenovo', model: 'Legion Pro 7i', category: 'computer' },
      { brand: 'Lenovo', model: 'Legion Pro 5i', category: 'computer' },
      { brand: 'Lenovo', model: 'Legion 5i', category: 'computer' },
      { brand: 'Lenovo', model: 'LOQ 15"', category: 'computer' },
      { brand: 'Lenovo', model: 'V15 Gen 4', category: 'computer' },

      // Asus
      { brand: 'Asus', model: 'ZenBook Pro 16X OLED', category: 'computer' },
      { brand: 'Asus', model: 'ZenBook 14 OLED', category: 'computer' },
      { brand: 'Asus', model: 'ZenBook S 13 OLED', category: 'computer' },
      { brand: 'Asus', model: 'ZenBook Duo 14', category: 'computer' },
      { brand: 'Asus', model: 'VivoBook Pro 16X OLED', category: 'computer' },
      { brand: 'Asus', model: 'VivoBook S 15 OLED', category: 'computer' },
      { brand: 'Asus', model: 'VivoBook 15', category: 'computer' },
      { brand: 'Asus', model: 'VivoBook Go 15', category: 'computer' },
      { brand: 'Asus', model: 'ExpertBook B9 OLED', category: 'computer' },
      { brand: 'Asus', model: 'ExpertBook B5', category: 'computer' },
      { brand: 'Asus', model: 'ROG Zephyrus G16', category: 'computer' },
      { brand: 'Asus', model: 'ROG Zephyrus G14', category: 'computer' },
      { brand: 'Asus', model: 'ROG Strix G16', category: 'computer' },
      { brand: 'Asus', model: 'ROG Strix G15', category: 'computer' },
      { brand: 'Asus', model: 'TUF Gaming A15', category: 'computer' },
      { brand: 'Asus', model: 'TUF Gaming A17', category: 'computer' },

      // Acer
      { brand: 'Acer', model: 'Swift X 14', category: 'computer' },
      { brand: 'Acer', model: 'Swift Go 14', category: 'computer' },
      { brand: 'Acer', model: 'Swift 3', category: 'computer' },
      { brand: 'Acer', model: 'Aspire 5', category: 'computer' },
      { brand: 'Acer', model: 'Aspire 3', category: 'computer' },
      { brand: 'Acer', model: 'Aspire Vero', category: 'computer' },
      { brand: 'Acer', model: 'Spin 5', category: 'computer' },
      { brand: 'Acer', model: 'Nitro 5', category: 'computer' },
      { brand: 'Acer', model: 'Nitro 16', category: 'computer' },
      { brand: 'Acer', model: 'Predator Helios 16', category: 'computer' },
      { brand: 'Acer', model: 'Predator Helios 18', category: 'computer' },
      { brand: 'Acer', model: 'TravelMate P4', category: 'computer' },

      // MSI
      { brand: 'MSI', model: 'Creator Z17', category: 'computer' },
      { brand: 'MSI', model: 'Creator M16', category: 'computer' },
      { brand: 'MSI', model: 'Prestige 16', category: 'computer' },
      { brand: 'MSI', model: 'Prestige 14', category: 'computer' },
      { brand: 'MSI', model: 'Modern 15', category: 'computer' },
      { brand: 'MSI', model: 'Modern 14', category: 'computer' },
      { brand: 'MSI', model: 'Raider GE78 HX', category: 'computer' },
      { brand: 'MSI', model: 'Stealth 16 Studio', category: 'computer' },
      { brand: 'MSI', model: 'Katana 15', category: 'computer' },
      { brand: 'MSI', model: 'Thin GF63', category: 'computer' },
      { brand: 'MSI', model: 'Cyborg 15', category: 'computer' },

      // Huawei
      { brand: 'Huawei', model: 'MateBook X Pro (2024)', category: 'computer' },
      { brand: 'Huawei', model: 'MateBook 16s', category: 'computer' },
      { brand: 'Huawei', model: 'MateBook 14s', category: 'computer' },
      { brand: 'Huawei', model: 'MateBook D 16', category: 'computer' },
      { brand: 'Huawei', model: 'MateBook D 15', category: 'computer' },
      { brand: 'Huawei', model: 'MateBook D 14', category: 'computer' },

      // Microsoft Surface
      {
        brand: 'Microsoft',
        model: 'Surface Laptop Studio 2',
        category: 'computer',
      },
      {
        brand: 'Microsoft',
        model: 'Surface Laptop 5 15"',
        category: 'computer',
      },
      {
        brand: 'Microsoft',
        model: 'Surface Laptop 5 13"',
        category: 'computer',
      },
      { brand: 'Microsoft', model: 'Surface Pro 9', category: 'computer' },
      { brand: 'Microsoft', model: 'Surface Go 3', category: 'computer' },

      // Samsung
      { brand: 'Samsung', model: 'Galaxy Book4 Ultra', category: 'computer' },
      { brand: 'Samsung', model: 'Galaxy Book4 Pro 360', category: 'computer' },
      { brand: 'Samsung', model: 'Galaxy Book4 Pro', category: 'computer' },
      { brand: 'Samsung', model: 'Galaxy Book4 360', category: 'computer' },
      { brand: 'Samsung', model: 'Galaxy Book4', category: 'computer' },
      { brand: 'Samsung', model: 'Galaxy Book3 Pro', category: 'computer' },
      { brand: 'Samsung', model: 'Galaxy Book Go', category: 'computer' },
    ];

    let created = 0;
    for (const deviceDto of devices) {
      try {
        const device = await this.create(deviceDto);
        // Seed service types for this device
        await this.serviceTypesService.seedServiceTypes(
          device.id,
          device.category,
        );
        created++;
      } catch (_err) {
        // Skip duplicates
        this.logger.debug(
          `Skipped duplicate: ${deviceDto.brand} ${deviceDto.model}`,
        );
      }
    }

    return {
      created,
      message: `${created} appareils créés avec leurs types de services`,
    };
  }

  async reseedDevices(): Promise<{ created: number; message: string }> {
    return this.seedDevices(true);
  }
}

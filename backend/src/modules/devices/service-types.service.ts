import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from './entities/service-type.entity';

export class CreateServiceTypeDto {
  deviceId: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDuration?: number;
}

export class UpdateServiceTypeDto {
  name?: string;
  description?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
}

@Injectable()
export class ServiceTypesService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async create(dto: CreateServiceTypeDto): Promise<ServiceType> {
    const serviceType = this.serviceTypeRepository.create(dto);
    return this.serviceTypeRepository.save(serviceType);
  }

  async findByDevice(deviceId: string): Promise<ServiceType[]> {
    return this.serviceTypeRepository.find({
      where: { deviceId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ServiceType> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!serviceType) {
      throw new NotFoundException('Type de service non trouvé');
    }

    return serviceType;
  }

  async update(id: string, dto: UpdateServiceTypeDto): Promise<ServiceType> {
    const serviceType = await this.findOne(id);
    Object.assign(serviceType, dto);
    return this.serviceTypeRepository.save(serviceType);
  }

  async remove(id: string): Promise<void> {
    const serviceType = await this.findOne(id);
    await this.serviceTypeRepository.remove(serviceType);
  }

  async seedServiceTypes(deviceId: string, category: string): Promise<void> {
    const existingCount = await this.serviceTypeRepository.count({ where: { deviceId } });
    if (existingCount > 0) return;

    let services: Omit<CreateServiceTypeDto, 'deviceId'>[] = [];

    if (category === 'smartphone') {
      services = [
        { name: 'Remplacement écran', description: 'Remplacement complet de l\'écran LCD/OLED', basePrice: 25000, estimatedDuration: 60 },
        { name: 'Remplacement batterie', description: 'Changement de la batterie', basePrice: 15000, estimatedDuration: 45 },
        { name: 'Réparation connecteur de charge', description: 'Réparation ou remplacement du port de charge', basePrice: 12000, estimatedDuration: 45 },
        { name: 'Réparation haut-parleur', description: 'Réparation des haut-parleurs', basePrice: 10000, estimatedDuration: 30 },
        { name: 'Réparation caméra', description: 'Remplacement de la caméra arrière ou avant', basePrice: 18000, estimatedDuration: 45 },
        { name: 'Déblocage logiciel', description: 'Déblocage iCloud/Google ou réseau', basePrice: 20000, estimatedDuration: 60 },
        { name: 'Récupération de données', description: 'Récupération des données du téléphone', basePrice: 25000, estimatedDuration: 120 },
        { name: 'Nettoyage système', description: 'Nettoyage et optimisation du système', basePrice: 5000, estimatedDuration: 30 },
      ];
    } else if (category === 'tablet') {
      services = [
        { name: 'Remplacement écran', description: 'Remplacement de l\'écran tactile', basePrice: 45000, estimatedDuration: 90 },
        { name: 'Remplacement batterie', description: 'Changement de la batterie', basePrice: 25000, estimatedDuration: 60 },
        { name: 'Réparation connecteur', description: 'Réparation du port de charge', basePrice: 18000, estimatedDuration: 45 },
        { name: 'Réinstallation système', description: 'Réinstallation du système d\'exploitation', basePrice: 15000, estimatedDuration: 60 },
      ];
    } else if (category === 'laptop') {
      services = [
        { name: 'Remplacement écran', description: 'Remplacement de l\'écran LCD', basePrice: 65000, estimatedDuration: 90 },
        { name: 'Remplacement clavier', description: 'Changement du clavier', basePrice: 35000, estimatedDuration: 60 },
        { name: 'Remplacement batterie', description: 'Changement de la batterie', basePrice: 45000, estimatedDuration: 45 },
        { name: 'Upgrade RAM', description: 'Ajout ou remplacement de mémoire RAM', basePrice: 25000, estimatedDuration: 30 },
        { name: 'Upgrade SSD', description: 'Remplacement du disque dur par SSD', basePrice: 35000, estimatedDuration: 45 },
        { name: 'Nettoyage ventilateur', description: 'Nettoyage du système de refroidissement', basePrice: 15000, estimatedDuration: 45 },
        { name: 'Réinstallation Windows', description: 'Réinstallation du système Windows', basePrice: 20000, estimatedDuration: 90 },
        { name: 'Réinstallation macOS', description: 'Réinstallation du système macOS', basePrice: 20000, estimatedDuration: 90 },
        { name: 'Récupération de données', description: 'Récupération des données du disque', basePrice: 40000, estimatedDuration: 180 },
      ];
    }

    for (const service of services) {
      await this.create({ ...service, deviceId });
    }
  }
}

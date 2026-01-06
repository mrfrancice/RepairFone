import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import { RepairerProfile, VerificationStatus } from '../../modules/users/entities/repairer-profile.entity';
import { Device, DeviceCategory } from '../../modules/devices/entities/device.entity';
import { ServiceType } from '../../modules/devices/entities/service-type.entity';
import { Expert, ConseilType, ConseilFormat } from '../../modules/conseils/entities/expert.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RepairerProfile)
    private readonly repairerProfileRepository: Repository<RepairerProfile>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
    @InjectRepository(Expert)
    private readonly expertRepository: Repository<Expert>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('🌱 Starting database seeding...');

    await this.seedUsers();
    await this.seedDevices();
    await this.seedServiceTypes();
    await this.seedExperts();

    this.logger.log('✅ Database seeding completed successfully!');
  }

  // ========================================
  // SEED USERS AND REPAIRERS
  // ========================================
  private async seedUsers(): Promise<void> {
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      this.logger.log('Users already seeded, skipping...');
      return;
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create admin user
    const admin = this.userRepository.create({
      phone: '+225 07 00 00 00',
      email: 'admin@repairfone.ci',
      passwordHash,
      firstName: 'Admin',
      lastName: 'RepairFone',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
    });
    await this.userRepository.save(admin);

    // Create test client
    const client = this.userRepository.create({
      phone: '+225 07 11 11 11',
      email: 'client@test.ci',
      passwordHash,
      firstName: 'Awa',
      lastName: 'Koné',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
    });
    await this.userRepository.save(client);

    // Create repairers
    const repairersData = [
      {
        user: {
          phone: '+225 07 22 22 22',
          email: 'jean.kouame@repair.ci',
          firstName: 'Kouamé',
          lastName: 'Jean',
        },
        profile: {
          businessName: 'Tech Repair Pro',
          description: 'Expert en réparation iPhone et Samsung depuis 8 ans. Spécialiste micro-soudure.',
          address: 'Cocody Angré, Abidjan',
          city: 'Abidjan',
          commune: 'Cocody',
          latitude: 5.3600,
          longitude: -4.0083,
          ratingAvg: 4.8,
          ratingCount: 127,
          totalRepairs: 245,
          completionRate: 98.5,
          acceptsHomeService: true,
          homeServiceRadiusKm: 15,
        },
      },
      {
        user: {
          phone: '+225 07 33 33 33',
          email: 'sylvain.yao@repair.ci',
          firstName: 'Yao',
          lastName: 'Sylvain',
        },
        profile: {
          businessName: 'Mobile Fix CI',
          description: 'Réparation tous smartphones et tablettes. Service rapide et garanti.',
          address: 'Marcory Zone 4, Abidjan',
          city: 'Abidjan',
          commune: 'Marcory',
          latitude: 5.3450,
          longitude: -4.0200,
          ratingAvg: 4.6,
          ratingCount: 89,
          totalRepairs: 156,
          completionRate: 95.0,
          acceptsHomeService: true,
          homeServiceRadiusKm: 10,
        },
      },
      {
        user: {
          phone: '+225 07 44 44 44',
          email: 'ange.koffi@repair.ci',
          firstName: 'Koffi',
          lastName: 'Ange',
        },
        profile: {
          businessName: 'PhoneDoc Abidjan',
          description: 'Réparation express en moins de 2h. Diagnostic gratuit.',
          address: 'Plateau Centre, Abidjan',
          city: 'Abidjan',
          commune: 'Plateau',
          latitude: 5.3550,
          longitude: -4.0100,
          ratingAvg: 4.9,
          ratingCount: 203,
          totalRepairs: 312,
          completionRate: 99.0,
          acceptsHomeService: false,
          homeServiceRadiusKm: 0,
        },
      },
      {
        user: {
          phone: '+225 07 55 55 55',
          email: 'marie.adjoua@repair.ci',
          firstName: 'Adjoua',
          lastName: 'Marie',
        },
        profile: {
          businessName: 'PC Clinic Abidjan',
          description: 'Spécialiste ordinateurs portables et fixes. Récupération de données.',
          address: 'Riviera Palmeraie, Abidjan',
          city: 'Abidjan',
          commune: 'Cocody',
          latitude: 5.3700,
          longitude: -4.0050,
          ratingAvg: 4.7,
          ratingCount: 78,
          totalRepairs: 189,
          completionRate: 97.0,
          acceptsHomeService: true,
          homeServiceRadiusKm: 20,
        },
      },
    ];

    for (const data of repairersData) {
      const user = this.userRepository.create({
        ...data.user,
        passwordHash,
        role: UserRole.REPAIRER,
        status: UserStatus.ACTIVE,
        isPhoneVerified: true,
      });
      const savedUser = await this.userRepository.save(user);

      const profile = this.repairerProfileRepository.create({
        ...data.profile,
        userId: savedUser.id,
        verificationStatus: VerificationStatus.VERIFIED,
        isAvailable: true,
        workingHours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '15:00' },
          sunday: null,
        },
      });
      await this.repairerProfileRepository.save(profile);
    }

    this.logger.log(`✅ Seeded ${repairersData.length + 2} users`);
  }

  // ========================================
  // SEED DEVICES
  // ========================================
  private async seedDevices(): Promise<void> {
    const existingDevices = await this.deviceRepository.count();
    if (existingDevices > 0) {
      this.logger.log('Devices already seeded, skipping...');
      return;
    }

    const devices = [
      // Smartphones - Apple
      { brand: 'Apple', model: 'iPhone 15 Pro Max', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Apple', model: 'iPhone 15 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Apple', model: 'iPhone 15', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Apple', model: 'iPhone 14 Pro Max', category: DeviceCategory.SMARTPHONE, releaseYear: 2022 },
      { brand: 'Apple', model: 'iPhone 14 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2022 },
      { brand: 'Apple', model: 'iPhone 14', category: DeviceCategory.SMARTPHONE, releaseYear: 2022 },
      { brand: 'Apple', model: 'iPhone 13 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2021 },
      { brand: 'Apple', model: 'iPhone 13', category: DeviceCategory.SMARTPHONE, releaseYear: 2021 },
      { brand: 'Apple', model: 'iPhone 12', category: DeviceCategory.SMARTPHONE, releaseYear: 2020 },
      { brand: 'Apple', model: 'iPhone 11', category: DeviceCategory.SMARTPHONE, releaseYear: 2019 },
      { brand: 'Apple', model: 'iPhone SE (2022)', category: DeviceCategory.SMARTPHONE, releaseYear: 2022 },

      // Smartphones - Samsung
      { brand: 'Samsung', model: 'Galaxy S24 Ultra', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Samsung', model: 'Galaxy S24+', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Samsung', model: 'Galaxy S24', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Samsung', model: 'Galaxy S23 Ultra', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Samsung', model: 'Galaxy S23', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Samsung', model: 'Galaxy A54', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Samsung', model: 'Galaxy A34', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Samsung', model: 'Galaxy A14', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Samsung', model: 'Galaxy Z Fold 5', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Samsung', model: 'Galaxy Z Flip 5', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },

      // Smartphones - Xiaomi
      { brand: 'Xiaomi', model: '14 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Xiaomi', model: '14', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Xiaomi', model: 'Redmi Note 13 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Xiaomi', model: 'Redmi Note 13', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },
      { brand: 'Xiaomi', model: 'Redmi 13', category: DeviceCategory.SMARTPHONE, releaseYear: 2024 },

      // Smartphones - Huawei
      { brand: 'Huawei', model: 'P60 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Huawei', model: 'Mate 60 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Huawei', model: 'Nova 11', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },

      // Smartphones - Tecno & Infinix (populaires en Afrique)
      { brand: 'Tecno', model: 'Camon 20 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Tecno', model: 'Camon 20', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Tecno', model: 'Spark 10 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Tecno', model: 'Spark 10', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Tecno', model: 'Pop 7 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Infinix', model: 'Note 30 Pro', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Infinix', model: 'Note 30', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Infinix', model: 'Hot 30', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },
      { brand: 'Infinix', model: 'Smart 7', category: DeviceCategory.SMARTPHONE, releaseYear: 2023 },

      // Computers/Laptops - HP
      { brand: 'HP', model: 'Pavilion 15', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'HP', model: 'EliteBook 840 G9', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'HP', model: 'ProBook 450 G9', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'HP', model: 'Victus 16', category: DeviceCategory.COMPUTER, releaseYear: 2023 },

      // Computers/Laptops - Dell
      { brand: 'Dell', model: 'XPS 15', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Dell', model: 'XPS 13', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Dell', model: 'Inspiron 15 3000', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Dell', model: 'Latitude 5540', category: DeviceCategory.COMPUTER, releaseYear: 2023 },

      // Computers/Laptops - Lenovo
      { brand: 'Lenovo', model: 'ThinkPad X1 Carbon', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Lenovo', model: 'ThinkPad T14', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Lenovo', model: 'IdeaPad 3', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Lenovo', model: 'Legion 5 Pro', category: DeviceCategory.COMPUTER, releaseYear: 2023 },

      // Computers/Laptops - Apple
      { brand: 'Apple', model: 'MacBook Pro 16"', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Apple', model: 'MacBook Pro 14"', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Apple', model: 'MacBook Air M2', category: DeviceCategory.COMPUTER, releaseYear: 2022 },
      { brand: 'Apple', model: 'MacBook Air M1', category: DeviceCategory.COMPUTER, releaseYear: 2020 },

      // Computers/Laptops - Asus
      { brand: 'Asus', model: 'ROG Strix G15', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Asus', model: 'VivoBook 15', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
      { brand: 'Asus', model: 'ZenBook 14', category: DeviceCategory.COMPUTER, releaseYear: 2023 },
    ];

    const deviceEntities = devices.map((d) => this.deviceRepository.create(d));
    await this.deviceRepository.save(deviceEntities);

    this.logger.log(`✅ Seeded ${devices.length} devices`);
  }

  // ========================================
  // SEED SERVICE TYPES
  // ========================================
  private async seedServiceTypes(): Promise<void> {
    const existingServices = await this.serviceTypeRepository.count();
    if (existingServices > 0) {
      this.logger.log('Service types already seeded, skipping...');
      return;
    }

    const devices = await this.deviceRepository.find();

    const smartphoneServices = [
      { name: 'Remplacement écran', description: 'Remplacement écran LCD/OLED complet', basePrice: 25000, estimatedDuration: 60 },
      { name: 'Remplacement batterie', description: 'Batterie neuve avec garantie', basePrice: 12000, estimatedDuration: 30 },
      { name: 'Réparation connecteur de charge', description: 'Port USB-C ou Lightning', basePrice: 8000, estimatedDuration: 45 },
      { name: 'Réparation haut-parleur', description: 'Haut-parleur ou micro', basePrice: 10000, estimatedDuration: 40 },
      { name: 'Réparation caméra arrière', description: 'Module caméra principale', basePrice: 20000, estimatedDuration: 50 },
      { name: 'Réparation caméra avant', description: 'Caméra selfie / Face ID', basePrice: 15000, estimatedDuration: 45 },
      { name: 'Dégâts des eaux', description: 'Nettoyage et réparation oxydation', basePrice: 15000, estimatedDuration: 120 },
      { name: 'Récupération de données', description: 'Extraction données téléphone HS', basePrice: 25000, estimatedDuration: 180 },
      { name: 'Mise à jour logicielle', description: 'Réinstallation système', basePrice: 5000, estimatedDuration: 60 },
      { name: 'Remplacement vitre arrière', description: 'Vitre arrière et châssis', basePrice: 18000, estimatedDuration: 60 },
    ];

    const computerServices = [
      { name: 'Remplacement écran', description: 'Écran LCD/LED laptop', basePrice: 45000, estimatedDuration: 90 },
      { name: 'Remplacement clavier', description: 'Clavier complet', basePrice: 25000, estimatedDuration: 60 },
      { name: 'Remplacement batterie', description: 'Batterie laptop neuve', basePrice: 30000, estimatedDuration: 45 },
      { name: 'Upgrade RAM', description: 'Ajout/remplacement mémoire', basePrice: 15000, estimatedDuration: 30 },
      { name: 'Upgrade SSD', description: 'Installation disque SSD', basePrice: 20000, estimatedDuration: 60 },
      { name: 'Nettoyage ventilateur', description: 'Dépoussiérage et pâte thermique', basePrice: 10000, estimatedDuration: 45 },
      { name: 'Réinstallation système', description: 'Windows/macOS/Linux', basePrice: 15000, estimatedDuration: 120 },
      { name: 'Récupération de données', description: 'Disque dur défaillant', basePrice: 35000, estimatedDuration: 240 },
      { name: 'Réparation carte mère', description: 'Diagnostic et micro-soudure', basePrice: 50000, estimatedDuration: 180 },
      { name: 'Remplacement chargeur DC', description: 'Port alimentation', basePrice: 20000, estimatedDuration: 60 },
    ];

    const serviceTypes: ServiceType[] = [];

    for (const device of devices) {
      const services = device.category === DeviceCategory.SMARTPHONE ? smartphoneServices : computerServices;

      for (const service of services) {
        // Adjust prices based on brand (Apple/Samsung more expensive)
        let priceMultiplier = 1;
        if (device.brand === 'Apple') priceMultiplier = 1.5;
        else if (device.brand === 'Samsung' && device.model.includes('Ultra')) priceMultiplier = 1.3;

        serviceTypes.push(
          this.serviceTypeRepository.create({
            deviceId: device.id,
            name: service.name,
            description: service.description,
            basePrice: Math.round(service.basePrice * priceMultiplier),
            estimatedDuration: service.estimatedDuration,
          }),
        );
      }
    }

    await this.serviceTypeRepository.save(serviceTypes);

    this.logger.log(`✅ Seeded ${serviceTypes.length} service types`);
  }

  // ========================================
  // SEED EXPERTS
  // ========================================
  private async seedExperts(): Promise<void> {
    const existingExperts = await this.expertRepository.count();
    if (existingExperts > 0) {
      this.logger.log('Experts already seeded, skipping...');
      return;
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const expertsData = [
      {
        user: {
          phone: '+225 07 66 66 66',
          email: 'amadou.diallo@expert.ci',
          firstName: 'Amadou',
          lastName: 'Diallo',
        },
        expert: {
          bio: 'Expert en réparation mobile avec 8 ans d\'expérience. Spécialiste diagnostic et dépannage smartphones.',
          specialties: ['Smartphones', 'Tablettes', 'Diagnostic'],
          conseilTypes: [ConseilType.DIAGNOSTIC, ConseilType.SOFTWARE, ConseilType.MAINTENANCE],
          conseilFormats: [ConseilFormat.CHAT, ConseilFormat.CALL],
          ratingAvg: 4.8,
          ratingCount: 156,
          responseTime: 5,
          pricePerSession: 2000,
          yearsOfExperience: 8,
          totalSessions: 234,
          isVerified: true,
        },
      },
      {
        user: {
          phone: '+225 07 77 77 77',
          email: 'fatou.ndiaye@expert.ci',
          firstName: 'Fatou',
          lastName: 'Ndiaye',
        },
        expert: {
          bio: 'Spécialiste en dépannage informatique et conseil en achat. 10 ans d\'expérience.',
          specialties: ['Ordinateurs', 'Logiciels', 'Windows', 'Mac'],
          conseilTypes: [ConseilType.SOFTWARE, ConseilType.PURCHASE],
          conseilFormats: [ConseilFormat.CHAT, ConseilFormat.CALL],
          ratingAvg: 4.9,
          ratingCount: 203,
          responseTime: 3,
          pricePerSession: 2500,
          yearsOfExperience: 10,
          totalSessions: 312,
          isVerified: true,
        },
      },
      {
        user: {
          phone: '+225 07 88 88 88',
          email: 'moussa.sow@expert.ci',
          firstName: 'Moussa',
          lastName: 'Sow',
        },
        expert: {
          bio: 'Technicien certifié Apple avec expertise complète sur l\'écosystème iOS et macOS.',
          specialties: ['iPhone', 'MacBook', 'Apple', 'iOS'],
          conseilTypes: [ConseilType.DIAGNOSTIC, ConseilType.SOFTWARE, ConseilType.PURCHASE, ConseilType.MAINTENANCE],
          conseilFormats: [ConseilFormat.CHAT, ConseilFormat.CALL],
          ratingAvg: 4.7,
          ratingCount: 89,
          responseTime: 10,
          pricePerSession: 3000,
          yearsOfExperience: 6,
          totalSessions: 145,
          isVerified: true,
        },
      },
      {
        user: {
          phone: '+225 07 99 99 99',
          email: 'aissatou.ba@expert.ci',
          firstName: 'Aissatou',
          lastName: 'Ba',
        },
        expert: {
          bio: 'Passionnée par les appareils Android et leur optimisation. Conseils personnalisés.',
          specialties: ['Android', 'Samsung', 'Xiaomi', 'Optimisation'],
          conseilTypes: [ConseilType.DIAGNOSTIC, ConseilType.MAINTENANCE],
          conseilFormats: [ConseilFormat.CHAT],
          ratingAvg: 4.6,
          ratingCount: 112,
          responseTime: 8,
          pricePerSession: 1500,
          yearsOfExperience: 5,
          totalSessions: 178,
          isVerified: true,
        },
      },
    ];

    for (const data of expertsData) {
      const user = this.userRepository.create({
        ...data.user,
        passwordHash,
        role: UserRole.REPAIRER, // Experts are also repairers
        status: UserStatus.ACTIVE,
        isPhoneVerified: true,
      });
      const savedUser = await this.userRepository.save(user);

      const expert = this.expertRepository.create({
        ...data.expert,
        userId: savedUser.id,
        verifiedAt: new Date(),
      });
      await this.expertRepository.save(expert);
    }

    this.logger.log(`✅ Seeded ${expertsData.length} experts`);
  }

  // Method to clear all data (use with caution!)
  async clearAll(): Promise<void> {
    this.logger.warn('⚠️ Clearing all data...');

    // Use query builder to truncate tables in correct order
    await this.expertRepository.createQueryBuilder().delete().execute();
    await this.serviceTypeRepository.createQueryBuilder().delete().execute();
    await this.deviceRepository.createQueryBuilder().delete().execute();
    await this.repairerProfileRepository.createQueryBuilder().delete().execute();
    await this.userRepository.createQueryBuilder().delete().execute();

    this.logger.log('✅ All data cleared');
  }
}

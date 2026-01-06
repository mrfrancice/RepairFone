import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Specialty,
  SpecialtyCategory,
  ProblemCategory,
  BusinessType,
  ExperienceRange,
  IdDocumentType,
  BadgeType,
  AppConfig,
} from './entities';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Specialty)
    private readonly specialtyRepo: Repository<Specialty>,
    @InjectRepository(ProblemCategory)
    private readonly problemCategoryRepo: Repository<ProblemCategory>,
    @InjectRepository(BusinessType)
    private readonly businessTypeRepo: Repository<BusinessType>,
    @InjectRepository(ExperienceRange)
    private readonly experienceRangeRepo: Repository<ExperienceRange>,
    @InjectRepository(IdDocumentType)
    private readonly idDocumentTypeRepo: Repository<IdDocumentType>,
    @InjectRepository(BadgeType)
    private readonly badgeTypeRepo: Repository<BadgeType>,
    @InjectRepository(AppConfig)
    private readonly appConfigRepo: Repository<AppConfig>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultData();
  }

  private async seedDefaultData() {
    await Promise.all([
      this.seedSpecialties(),
      this.seedProblemCategories(),
      this.seedBusinessTypes(),
      this.seedExperienceRanges(),
      this.seedIdDocumentTypes(),
      this.seedBadgeTypes(),
      this.seedAppConfigs(),
    ]);
  }

  private async seedSpecialties() {
    const count = await this.specialtyRepo.count();
    if (count > 0) return;

    const specialties = [
      // Marques
      { code: 'iphone', name: 'iPhone', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 1 },
      { code: 'samsung', name: 'Samsung', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 2 },
      { code: 'huawei', name: 'Huawei', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 3 },
      { code: 'xiaomi', name: 'Xiaomi', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 4 },
      { code: 'oppo', name: 'Oppo', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 5 },
      { code: 'tecno', name: 'Tecno', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 6 },
      { code: 'infinix', name: 'Infinix', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 7 },
      { code: 'nokia', name: 'Nokia', icon: '📱', category: SpecialtyCategory.BRAND, sortOrder: 8 },
      // Types d'appareils
      { code: 'tablets', name: 'Tablettes', icon: '📲', category: SpecialtyCategory.DEVICE_TYPE, sortOrder: 10 },
      { code: 'ipad', name: 'iPad', icon: '📲', category: SpecialtyCategory.DEVICE_TYPE, sortOrder: 11 },
      { code: 'macbook', name: 'MacBook', icon: '💻', category: SpecialtyCategory.DEVICE_TYPE, sortOrder: 12 },
      { code: 'laptops', name: 'Ordinateurs portables', icon: '💻', category: SpecialtyCategory.DEVICE_TYPE, sortOrder: 13 },
      // Types de réparation
      { code: 'screen', name: 'Écrans', icon: '📱', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 20 },
      { code: 'battery', name: 'Batteries', icon: '🔋', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 21 },
      { code: 'charging', name: 'Connecteurs de charge', icon: '🔌', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 22 },
      { code: 'camera', name: 'Caméras', icon: '📷', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 23 },
      { code: 'motherboard', name: 'Cartes mères', icon: '🔧', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 24 },
      { code: 'unlock', name: 'Déblocage', icon: '🔓', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 25 },
      { code: 'data_recovery', name: 'Récupération de données', icon: '💾', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 26 },
      { code: 'speaker', name: 'Haut-parleur / Micro', icon: '🔊', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 27 },
      { code: 'button', name: 'Boutons', icon: '⚙️', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 28 },
      { code: 'water_damage', name: 'Dégâts des eaux', icon: '💧', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 29 },
      { code: 'software', name: 'Logiciel / OS', icon: '💻', category: SpecialtyCategory.REPAIR_TYPE, sortOrder: 30 },
    ];

    await this.specialtyRepo.save(specialties.map(s => this.specialtyRepo.create(s)));
  }

  private async seedProblemCategories() {
    const count = await this.problemCategoryRepo.count();
    if (count > 0) return;

    const categories = [
      { code: 'screen', name: 'Écran cassé', icon: '📱', color: 'rgba(239, 68, 68, 0.1)', sortOrder: 1 },
      { code: 'battery', name: 'Batterie', icon: '🔋', color: 'rgba(34, 197, 94, 0.1)', sortOrder: 2 },
      { code: 'water', name: 'Oxydation', icon: '💧', color: 'rgba(147, 51, 234, 0.1)', sortOrder: 3 },
      { code: 'charging', name: 'Connecteur', icon: '🔌', color: 'rgba(59, 130, 246, 0.1)', sortOrder: 4 },
      { code: 'camera', name: 'Caméra', icon: '📷', color: 'rgba(245, 158, 11, 0.1)', sortOrder: 5 },
      { code: 'sound', name: 'Son', icon: '🔊', color: 'rgba(16, 185, 129, 0.1)', sortOrder: 6 },
      { code: 'power', name: 'Charge', icon: '⚡', color: 'rgba(234, 179, 8, 0.1)', sortOrder: 7 },
      { code: 'other', name: 'Autre', icon: '❓', color: 'rgba(107, 114, 128, 0.1)', sortOrder: 8 },
    ];

    await this.problemCategoryRepo.save(categories.map(c => this.problemCategoryRepo.create(c)));
  }

  private async seedBusinessTypes() {
    const count = await this.businessTypeRepo.count();
    if (count > 0) return;

    const types = [
      { code: 'individual', name: 'Particulier / Artisan', description: 'Réparateur indépendant sans structure juridique', requiresRccm: false, requiresTaxId: false, sortOrder: 1 },
      { code: 'auto_entrepreneur', name: 'Auto-entrepreneur', description: 'Micro-entreprise ou auto-entrepreneur', requiresRccm: true, requiresTaxId: true, sortOrder: 2 },
      { code: 'company', name: 'Entreprise (SARL, SA...)', description: 'Société avec forme juridique', requiresRccm: true, requiresTaxId: true, sortOrder: 3 },
    ];

    await this.businessTypeRepo.save(types.map(t => this.businessTypeRepo.create(t)));
  }

  private async seedExperienceRanges() {
    const count = await this.experienceRangeRepo.count();
    if (count > 0) return;

    const ranges: Array<{ code: string; label: string; minYears: number; maxYears?: number; sortOrder: number }> = [
      { code: '0-1', label: "Moins d'1 an", minYears: 0, maxYears: 1, sortOrder: 1 },
      { code: '1-3', label: '1 à 3 ans', minYears: 1, maxYears: 3, sortOrder: 2 },
      { code: '3-5', label: '3 à 5 ans', minYears: 3, maxYears: 5, sortOrder: 3 },
      { code: '5-10', label: '5 à 10 ans', minYears: 5, maxYears: 10, sortOrder: 4 },
      { code: '10+', label: 'Plus de 10 ans', minYears: 10, sortOrder: 5 },
    ];

    await this.experienceRangeRepo.save(ranges.map(r => this.experienceRangeRepo.create(r)));
  }

  private async seedIdDocumentTypes() {
    const count = await this.idDocumentTypeRepo.count();
    if (count > 0) return;

    const types = [
      { code: 'cni', name: "Carte Nationale d'Identité", description: 'CNI ivoirienne en cours de validité', sortOrder: 1 },
      { code: 'passport', name: 'Passeport', description: 'Passeport en cours de validité', sortOrder: 2 },
      { code: 'driver_license', name: 'Permis de conduire', description: 'Permis de conduire en cours de validité', sortOrder: 3 },
      { code: 'residence_permit', name: 'Carte de séjour', description: 'Carte de séjour pour les étrangers', sortOrder: 4 },
    ];

    await this.idDocumentTypeRepo.save(types.map(t => this.idDocumentTypeRepo.create(t)));
  }

  private async seedBadgeTypes() {
    const count = await this.badgeTypeRepo.count();
    if (count > 0) return;

    const badges = [
      { code: 'verified', label: 'Vérifié', icon: '✓', color: '#10b981', description: 'Profil vérifié par notre équipe', sortOrder: 1 },
      { code: 'fast_response', label: 'Réponse rapide', icon: '⚡', color: '#f59e0b', description: 'Répond en moins de 30 minutes', sortOrder: 2 },
      { code: 'top_rated', label: 'Top noté', icon: '⭐', color: '#eab308', description: 'Note moyenne supérieure à 4.5', sortOrder: 3 },
      { code: 'expert', label: 'Expert', icon: '🏆', color: '#8b5cf6', description: 'Plus de 100 réparations réussies', sortOrder: 4 },
    ];

    await this.badgeTypeRepo.save(badges.map(b => this.badgeTypeRepo.create(b)));
  }

  private async seedAppConfigs() {
    const count = await this.appConfigRepo.count();
    if (count > 0) return;

    const configs = [
      { key: 'platform_fee_percent', value: '5', type: 'number', description: 'Commission de la plateforme (%)', category: 'payment' },
      { key: 'deposit_percent', value: '30', type: 'number', description: 'Pourcentage d\'acompte requis', category: 'payment' },
      { key: 'quote_validity_days', value: '7', type: 'number', description: 'Durée de validité des devis (jours)', category: 'quotes' },
      { key: 'max_home_service_radius_km', value: '50', type: 'number', description: 'Rayon maximum pour service à domicile (km)', category: 'service' },
      { key: 'currency', value: 'XOF', type: 'string', description: 'Devise utilisée', category: 'general' },
      { key: 'country_code', value: '+225', type: 'string', description: 'Indicatif téléphonique', category: 'general' },
    ];

    await this.appConfigRepo.save(configs.map(c => this.appConfigRepo.create(c)));
  }

  // ============ API Methods ============

  // Specialties
  async getSpecialties(activeOnly = true): Promise<Specialty[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.specialtyRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  async getSpecialtiesByCategory(category: SpecialtyCategory): Promise<Specialty[]> {
    return this.specialtyRepo.find({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  // Problem Categories
  async getProblemCategories(activeOnly = true): Promise<ProblemCategory[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.problemCategoryRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  // Business Types
  async getBusinessTypes(activeOnly = true): Promise<BusinessType[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.businessTypeRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  // Experience Ranges
  async getExperienceRanges(activeOnly = true): Promise<ExperienceRange[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.experienceRangeRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  // ID Document Types
  async getIdDocumentTypes(activeOnly = true): Promise<IdDocumentType[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.idDocumentTypeRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  // Badge Types
  async getBadgeTypes(activeOnly = true): Promise<BadgeType[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.badgeTypeRepo.find({ where, order: { sortOrder: 'ASC' } });
  }

  // App Configs
  async getAppConfigs(category?: string): Promise<AppConfig[]> {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return this.appConfigRepo.find({ where });
  }

  async getAppConfig(key: string): Promise<string | null> {
    const config = await this.appConfigRepo.findOne({ where: { key, isActive: true } });
    return config?.value || null;
  }

  async getAppConfigNumber(key: string, defaultValue = 0): Promise<number> {
    const value = await this.getAppConfig(key);
    return value ? parseFloat(value) : defaultValue;
  }

  // Combined settings for frontend
  async getAllSettings() {
    const [
      specialties,
      problemCategories,
      businessTypes,
      experienceRanges,
      idDocumentTypes,
      badgeTypes,
      appConfigs,
    ] = await Promise.all([
      this.getSpecialties(),
      this.getProblemCategories(),
      this.getBusinessTypes(),
      this.getExperienceRanges(),
      this.getIdDocumentTypes(),
      this.getBadgeTypes(),
      this.getAppConfigs(),
    ]);

    return {
      specialties,
      problemCategories,
      businessTypes,
      experienceRanges,
      idDocumentTypes,
      badgeTypes,
      appConfigs,
    };
  }
}

// ============================================
// DEVICES DOMAIN — Types
// ============================================

export interface Device {
  id: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  imageUrl?: string;
  releaseYear?: number;
  isActive: boolean;
  serviceTypes?: ServiceType[];
}

export type DeviceCategory = 'smartphone' | 'tablet' | 'laptop' | 'computer' | 'smartwatch' | 'other';

export interface ServiceType {
  id: string;
  deviceId: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDuration?: number;
  isActive: boolean;
}

export interface DeviceSearchParams {
  brand?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProblemCategory {
  id: string;
  deviceCategory: DeviceCategory;
  name: string;
  icon?: string;
  avgPriceMin: number;
  avgPriceMax: number;
  currency: string;
}

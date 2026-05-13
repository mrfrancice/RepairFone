import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import type { Device, ServiceType } from './types';

/**
 * Acces API aux donnees catalogue : devices et service-types.
 * Service stateless — toutes les methodes retournent une Promise sans muter d'etat partage.
 */
@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly api = inject(ApiService);

  async getDevices(params?: {
    brand?: string;
    category?: string;
    search?: string;
  }): Promise<{ data: Device[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: Device[]; total: number }>('/devices', params)
    );
  }

  async getDeviceBrands(category?: string): Promise<string[]> {
    return firstValueFrom(
      this.api.get<string[]>('/devices/brands', category ? { category } : undefined)
    );
  }

  async getDeviceCategories(): Promise<string[]> {
    return firstValueFrom(this.api.get<string[]>('/devices/categories'));
  }

  async getDevice(id: string): Promise<Device> {
    return firstValueFrom(this.api.get<Device>(`/devices/${id}`));
  }

  async getServiceTypes(deviceId: string): Promise<ServiceType[]> {
    return firstValueFrom(
      this.api.get<ServiceType[]>(`/service-types/device/${deviceId}`)
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthStore, User } from '../../../core/stores/auth.store';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UpdateRepairerProfileDto {
  businessName?: string;
  businessType?: string;
  rccmNumber?: string;
  taxId?: string;
  businessPhone?: string;
  businessEmail?: string;
  yearsOfExperience?: string;
  description?: string;
  city?: string;
  commune?: string;
  quarter?: string;
  address?: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  specialties?: string[];
  isAvailable?: boolean;
  acceptsHomeService?: boolean;
  homeServiceRadiusKm?: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  async getProfile(): Promise<User> {
    const user = await firstValueFrom(
      this.api.get<User>('/users/me')
    );
    this.authStore.updateUser(user);
    return user;
  }

  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    const user = await firstValueFrom(
      this.api.put<User>('/users/me', dto)
    );
    this.authStore.updateUser(user);
    return user;
  }

  async updateRepairerProfile(dto: UpdateRepairerProfileDto): Promise<any> {
    const profile = await firstValueFrom(
      this.api.put('/users/me/repairer-profile', dto)
    );
    // Refresh user data
    await this.getProfile();
    return profile;
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    // Le backend attend le champ multipart "avatar" (FileInterceptor('avatar')).
    formData.append('avatar', file);
    return firstValueFrom(
      this.api.post<{ avatarUrl: string }>('/users/me/avatar', formData)
    );
  }
}

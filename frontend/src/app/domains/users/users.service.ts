import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import { AuthStore, User } from '@app/core/stores/auth.store';
import { environment } from '../../../environments/environment';
import type { UpdateProfileDto, UpdateRepairerProfileDto } from './types';

/**
 * Service users : profil utilisateur + RGPD.
 *
 * Couvre l'apres-connexion : recuperer/maj le profil, uploader un avatar,
 * exporter (RGPD Art. 20) ou supprimer (RGPD Art. 17) son compte.
 *
 * L'authentification (login, register, OTP, refresh, reset password) reste
 * dans features/auth/services/auth.service.ts → core/auth/ ulterieurement.
 *
 * NB : le type User canonique est dans @app/core/stores/auth.store. Une
 * reconciliation avec domains/users/types.ts est prevue en Phase 2.9
 * (avec le domaine repairers, car Repairer extends User).
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  async getProfile(): Promise<User> {
    const user = await firstValueFrom(this.api.get<User>('/users/me'));
    this.authStore.updateUser(user);
    return user;
  }

  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    const user = await firstValueFrom(this.api.put<User>('/users/me', dto));
    this.authStore.updateUser(user);
    return user;
  }

  async updateRepairerProfile(dto: UpdateRepairerProfileDto): Promise<unknown> {
    const profile = await firstValueFrom(
      this.api.put('/users/me/repairer-profile', dto)
    );
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

  /**
   * RGPD Art. 17 — Suppression du compte.
   * Anonymise les donnees identifiantes cote backend et revoque toutes les
   * sessions. Le frontend doit ensuite faire un logout local + redirect.
   */
  async deleteAccount(): Promise<void> {
    await firstValueFrom(this.api.delete<void>('/users/me'));
  }

  /**
   * RGPD Art. 20 — Droit a la portabilite.
   * Retourne un JSON avec toutes les donnees personnelles de l'utilisateur.
   * Utilise HttpClient direct car ApiService ne gere pas responseType=blob.
   */
  async exportMyData(): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/users/me/export`, { responseType: 'blob' })
    );
  }
}

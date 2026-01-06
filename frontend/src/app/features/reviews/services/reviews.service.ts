import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface SubRatings {
  quality: number;       // Qualité de la réparation (1-5)
  communication: number; // Communication (1-5)
  timeliness: number;    // Respect des délais (1-5)
}

export interface Review {
  id: string;
  requestId: string;
  clientId: string;
  repairerId: string;
  rating: number;
  subRatings?: SubRatings;
  comment?: string;
  photos?: string[];
  createdAt: string;
  updatedAt?: string;
  client?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  repairer?: {
    firstName?: string;
    lastName?: string;
    repairerProfile?: {
      businessName?: string;
    };
  };
  request?: {
    device?: {
      brand: string;
      model: string;
    };
    serviceType?: {
      name: string;
    };
  };
  // Response from repairer
  response?: {
    message: string;
    createdAt: string;
  };
}

export interface CreateReviewDto {
  requestId: string;
  rating: number;
  subRatings?: SubRatings;
  comment?: string;
  photos?: string[];
}

export interface SubRatingInfo {
  key: keyof SubRatings;
  label: string;
  icon: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly api = inject(ApiService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly subRatingCategories: SubRatingInfo[] = [
    {
      key: 'quality',
      label: 'Qualité',
      icon: '⭐',
      description: 'Qualité de la réparation effectuée',
    },
    {
      key: 'communication',
      label: 'Communication',
      icon: '💬',
      description: 'Réactivité et clarté des échanges',
    },
    {
      key: 'timeliness',
      label: 'Délais',
      icon: '⏰',
      description: 'Respect des délais annoncés',
    },
  ];

  async createReview(dto: CreateReviewDto): Promise<Review> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await firstValueFrom(
        this.api.post<Review>('/reviews', dto)
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async getMyReviews(page = 1, limit = 20): Promise<{ data: Review[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: Review[]; total: number }>('/reviews/my', { page, limit })
    );
  }

  async getReviewByRequest(requestId: string): Promise<Review | null> {
    try {
      return await firstValueFrom(
        this.api.get<Review>(`/reviews/request/${requestId}`)
      );
    } catch {
      return null;
    }
  }

  async getRepairerReviews(repairerId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Review[]; total: number; averages: SubRatings & { overall: number } }> {
    return firstValueFrom(
      this.api.get<{ data: Review[]; total: number; averages: SubRatings & { overall: number } }>(
        `/reviews/repairer/${repairerId}`,
        params
      )
    );
  }

  async updateReview(id: string, updates: Partial<CreateReviewDto>): Promise<Review> {
    return firstValueFrom(
      this.api.patch<Review>(`/reviews/${id}`, updates)
    );
  }

  async deleteReview(id: string): Promise<void> {
    return firstValueFrom(
      this.api.delete<void>(`/reviews/${id}`)
    );
  }

  // Calculate the overall rating from sub-ratings
  calculateOverallRating(subRatings: SubRatings): number {
    const { quality, communication, timeliness } = subRatings;
    const average = (quality + communication + timeliness) / 3;
    return Math.round(average * 10) / 10; // Round to 1 decimal
  }

  // Get rating label
  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Très bon';
    if (rating >= 2.5) return 'Bon';
    if (rating >= 1.5) return 'Passable';
    return 'Insuffisant';
  }

  // Get rating color
  getRatingColor(rating: number): string {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 3.5) return '#22c55e';
    if (rating >= 2.5) return '#f59e0b';
    if (rating >= 1.5) return '#f97316';
    return '#ef4444';
  }

  // Format date for display
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Get time ago text
  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${diffDays >= 14 ? 's' : ''}`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an${diffDays >= 730 ? 's' : ''}`;
  }
}

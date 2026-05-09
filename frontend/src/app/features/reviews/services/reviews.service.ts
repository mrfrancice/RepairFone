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

// Step Ratings Types
export enum RatingStep {
  QUOTE_ACCEPTED = 'quote_accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
}

export enum RatingCategory {
  COMMUNICATION = 'communication',
  QUALITY = 'quality',
  TIMELINESS = 'timeliness',
  PRICE = 'price',
  OVERALL = 'overall',
}

export interface StepRating {
  id: string;
  requestId: string;
  clientId: string;
  repairerId: string;
  step: RatingStep;
  category: RatingCategory;
  rating: number; // -5 à 5
  comment?: string;
  createdAt: string;
  client?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface StepRatingItem {
  category: RatingCategory;
  rating: number;
}

export interface CreateStepRatingDto {
  requestId: string;
  step: RatingStep;
  ratings: StepRatingItem[];
  comment?: string;
}

export interface StepRatingStats {
  overall: { average: number; count: number };
  byCategory: Record<string, { average: number; count: number }>;
  byStep: Record<string, { average: number; count: number }>;
  recentRatings: StepRating[];
}

export interface RatingCategoryInfo {
  key: RatingCategory;
  label: string;
  icon: string;
  description: string;
}

export interface RatingStepInfo {
  key: RatingStep;
  label: string;
  description: string;
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
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 3.5) return '#4CAF50';
    if (rating >= 2.5) return '#FFC107';
    if (rating >= 1.5) return '#f97316';
    return '#F44336';
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

  // ============ Step Ratings Methods ============

  readonly stepRatingCategories: RatingCategoryInfo[] = [
    {
      key: RatingCategory.COMMUNICATION,
      label: 'Communication',
      icon: '💬',
      description: 'Qualité des échanges avec le réparateur',
    },
    {
      key: RatingCategory.QUALITY,
      label: 'Qualité',
      icon: '⭐',
      description: 'Qualité du travail effectué',
    },
    {
      key: RatingCategory.TIMELINESS,
      label: 'Délais',
      icon: '⏰',
      description: 'Respect des délais annoncés',
    },
    {
      key: RatingCategory.PRICE,
      label: 'Prix',
      icon: '💰',
      description: 'Rapport qualité/prix',
    },
  ];

  readonly ratingSteps: RatingStepInfo[] = [
    {
      key: RatingStep.QUOTE_ACCEPTED,
      label: 'Devis accepté',
      description: 'Notez après l\'acceptation du devis',
    },
    {
      key: RatingStep.IN_PROGRESS,
      label: 'En cours',
      description: 'Notez pendant la réparation',
    },
    {
      key: RatingStep.COMPLETED,
      label: 'Terminé',
      description: 'Notez après la réparation',
    },
    {
      key: RatingStep.DELIVERED,
      label: 'Livré',
      description: 'Notez après la livraison',
    },
  ];

  async createStepRating(dto: CreateStepRatingDto): Promise<StepRating[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await firstValueFrom(
        this.api.post<StepRating[]>('/reviews/step-ratings', dto)
      );
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'enregistrement de la note');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getStepRatingsForRequest(requestId: string): Promise<{
    ratings: StepRating[];
    byStep: Record<string, StepRating[]>;
  }> {
    return firstValueFrom(
      this.api.get<{ ratings: StepRating[]; byStep: Record<string, StepRating[]> }>(
        `/reviews/step-ratings/request/${requestId}`
      )
    );
  }

  async canRateAtStep(requestId: string, step: RatingStep): Promise<{
    canRate: boolean;
    alreadyRated: boolean;
    reason?: string;
  }> {
    return firstValueFrom(
      this.api.get<{ canRate: boolean; alreadyRated: boolean; reason?: string }>(
        `/reviews/step-ratings/can-rate/${requestId}/${step}`
      )
    );
  }

  async getRepairerStepRatingStats(repairerId: string): Promise<StepRatingStats> {
    return firstValueFrom(
      this.api.get<StepRatingStats>(`/reviews/step-ratings/repairer/${repairerId}/stats`)
    );
  }

  // Get step label
  getStepLabel(step: RatingStep): string {
    const info = this.ratingSteps.find(s => s.key === step);
    return info?.label || step;
  }

  // Get category label
  getCategoryLabel(category: RatingCategory): string {
    const info = this.stepRatingCategories.find(c => c.key === category);
    return info?.label || category;
  }

  // Get step rating color based on value (-5 to 5)
  getStepRatingColor(rating: number): string {
    if (rating >= 4) return '#4CAF50';  // Green - Excellent
    if (rating >= 2) return '#4CAF50';  // Light green - Good
    if (rating >= 0) return '#FFC107';  // Yellow - Neutral
    if (rating >= -2) return '#f97316'; // Orange - Poor
    return '#F44336';                    // Red - Very poor
  }

  // Get step rating label based on value (-5 to 5)
  getStepRatingLabel(rating: number): string {
    if (rating >= 4) return 'Excellent';
    if (rating >= 2) return 'Très bien';
    if (rating >= 0) return 'Correct';
    if (rating >= -2) return 'Insuffisant';
    return 'Très mauvais';
  }

  // Format rating for display (with + sign for positive)
  formatStepRating(rating: number): string {
    if (rating > 0) return `+${rating}`;
    return rating.toString();
  }
}

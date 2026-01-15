import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchService, Repairer } from '../../services/search.service';
import { SearchStore } from '../../stores/search.store';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';

interface CompareRepairer extends Repairer {
  qualityScores: {
    delays: number;
    quality: number;
    communication: number;
    pricing: number;
  };
  estimatedPrice?: number;
  estimatedDuration?: string;
  completedRepairs: number;
  acceptanceRate: number;
}

@Component({
  selector: 'app-compare-repairers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, UiButtonComponent, UiLoadingComponent],
  template: `
    <div class="compare-container">
      <!-- Header -->
      <header class="compare-header">
        <button class="back-btn" (click)="goBack()">
          <span class="back-icon">←</span>
        </button>
        <h1>Comparer les réparateurs</h1>
        <span class="compare-count">{{ repairers().length }} sélectionnés</span>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <ui-loading size="lg" />
          <p>Chargement des profils...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <span class="error-icon">⚠️</span>
          <p>{{ error() }}</p>
          <ui-button (click)="goBack()">Retour aux résultats</ui-button>
        </div>
      } @else {
        <!-- Comparison Grid -->
        <div class="comparison-grid" [class.two-columns]="repairers().length === 2" [class.three-columns]="repairers().length === 3">
          @for (repairer of repairers(); track repairer.id) {
            <div class="repairer-card" [class.recommended]="isRecommended(repairer)">
              @if (isRecommended(repairer)) {
                <div class="recommended-badge">
                  <span>⭐ Recommandé</span>
                </div>
              }

              <!-- Profile Header -->
              <div class="card-header">
                <div class="avatar">
                  @if (repairer.avatarUrl) {
                    <img [src]="repairer.avatarUrl" [alt]="getRepairerName(repairer)" />
                  } @else {
                    <span class="avatar-placeholder">{{ getInitials(repairer) }}</span>
                  }
                </div>
                <h3>{{ getRepairerName(repairer) }}</h3>
                @if (repairer.repairerProfile.businessName) {
                  <p class="business-name">{{ repairer.repairerProfile.businessName }}</p>
                }
              </div>

              <!-- Key Metrics -->
              <div class="metrics-section">
                <!-- Rating -->
                <div class="metric">
                  <span class="metric-label">Note</span>
                  <div class="metric-value rating">
                    <span class="stars">{{ getStars(repairer.repairerProfile.rating) }}</span>
                    <span class="rating-number">{{ repairer.repairerProfile.rating | number:'1.1-1' }}</span>
                    <span class="review-count">({{ repairer.repairerProfile.reviewCount }})</span>
                  </div>
                </div>

                <!-- Distance -->
                <div class="metric">
                  <span class="metric-label">Distance</span>
                  <div class="metric-value">
                    <span class="metric-icon">📍</span>
                    @if (repairer.distance !== undefined && repairer.distance !== null) {
                      <span>{{ repairer.distance | number:'1.1-1' }} km</span>
                    } @else {
                      <span>-</span>
                    }
                  </div>
                </div>

                <!-- Estimated Price -->
                <div class="metric">
                  <span class="metric-label">Prix estimé</span>
                  <div class="metric-value price">
                    @if (repairer.estimatedPrice) {
                      <span>{{ repairer.estimatedPrice | number:'1.0-0' }} FCFA</span>
                    } @else {
                      <span>Sur devis</span>
                    }
                  </div>
                </div>

                <!-- Estimated Duration -->
                <div class="metric">
                  <span class="metric-label">Délai estimé</span>
                  <div class="metric-value">
                    <span class="metric-icon">⏱️</span>
                    <span>{{ repairer.estimatedDuration || '1-2 jours' }}</span>
                  </div>
                </div>

                <!-- Availability -->
                <div class="metric">
                  <span class="metric-label">Disponibilité</span>
                  <div class="metric-value availability" [class.available]="repairer.repairerProfile.isAvailable">
                    @if (repairer.repairerProfile.isAvailable) {
                      <span class="status-dot available"></span>
                      <span>Disponible</span>
                    } @else {
                      <span class="status-dot unavailable"></span>
                      <span>Indisponible</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Quality Scores -->
              <div class="quality-section">
                <h4>Scores qualité</h4>
                <div class="quality-scores">
                  <div class="score-item">
                    <span class="score-label">Délais</span>
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="repairer.qualityScores.delays"></div>
                    </div>
                    <span class="score-value">{{ repairer.qualityScores.delays }}%</span>
                  </div>
                  <div class="score-item">
                    <span class="score-label">Qualité</span>
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="repairer.qualityScores.quality"></div>
                    </div>
                    <span class="score-value">{{ repairer.qualityScores.quality }}%</span>
                  </div>
                  <div class="score-item">
                    <span class="score-label">Communication</span>
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="repairer.qualityScores.communication"></div>
                    </div>
                    <span class="score-value">{{ repairer.qualityScores.communication }}%</span>
                  </div>
                  <div class="score-item">
                    <span class="score-label">Prix</span>
                    <div class="score-bar">
                      <div class="score-fill" [style.width.%]="repairer.qualityScores.pricing"></div>
                    </div>
                    <span class="score-value">{{ repairer.qualityScores.pricing }}%</span>
                  </div>
                </div>
              </div>

              <!-- Stats -->
              <div class="stats-section">
                <div class="stat">
                  <span class="stat-value">{{ repairer.completedRepairs }}</span>
                  <span class="stat-label">Réparations</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ repairer.acceptanceRate }}%</span>
                  <span class="stat-label">Taux accept.</span>
                </div>
              </div>

              <!-- Specialties -->
              @if (repairer.repairerProfile.specialties?.length) {
                <div class="specialties-section">
                  <h4>Spécialités</h4>
                  <div class="specialties-list">
                    @for (specialty of repairer.repairerProfile.specialties?.slice(0, 4) || []; track specialty) {
                      <span class="specialty-chip">{{ specialty }}</span>
                    }
                    @if ((repairer.repairerProfile.specialties?.length || 0) > 4) {
                      <span class="specialty-chip more">+{{ (repairer.repairerProfile.specialties?.length || 0) - 4 }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Actions -->
              <div class="card-actions">
                <ui-button
                  variant="outline"
                  size="sm"
                  (click)="viewProfile(repairer.id)"
                >
                  Voir profil
                </ui-button>
                <ui-button
                  variant="primary"
                  size="sm"
                  [disabled]="!repairer.repairerProfile.isAvailable"
                  (click)="selectRepairer(repairer)"
                >
                  Choisir
                </ui-button>
              </div>
            </div>
          }
        </div>

        <!-- Comparison Summary -->
        @if (repairers().length > 1) {
          <div class="comparison-summary">
            <h3>Résumé de la comparaison</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-icon">⭐</span>
                <div class="summary-content">
                  <span class="summary-label">Meilleure note</span>
                  <span class="summary-value">{{ getBestRating()?.repairerProfile?.businessName || getRepairerName(getBestRating()!) }}</span>
                </div>
              </div>
              <div class="summary-item">
                <span class="summary-icon">📍</span>
                <div class="summary-content">
                  <span class="summary-label">Plus proche</span>
                  <span class="summary-value">{{ getClosest()?.repairerProfile?.businessName || getRepairerName(getClosest()!) }}</span>
                </div>
              </div>
              <div class="summary-item">
                <span class="summary-icon">💰</span>
                <div class="summary-content">
                  <span class="summary-label">Prix le plus bas</span>
                  <span class="summary-value">{{ getCheapest()?.repairerProfile?.businessName || getRepairerName(getCheapest()!) }}</span>
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .compare-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding-bottom: 2rem;
    }

    .compare-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #eee;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: #f5f5f5;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .compare-header h1 {
      flex: 1;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .compare-count {
      font-size: 0.875rem;
      color: #666;
      background: #f0f0f0;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 1rem;
    }

    .error-icon {
      font-size: 3rem;
    }

    .comparison-grid {
      display: grid;
      gap: 1rem;
      padding: 1rem;
    }

    .comparison-grid.two-columns {
      grid-template-columns: repeat(2, 1fr);
    }

    .comparison-grid.three-columns {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 768px) {
      .comparison-grid.two-columns,
      .comparison-grid.three-columns {
        grid-template-columns: 1fr;
      }
    }

    .repairer-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      position: relative;
      border: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .repairer-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .repairer-card.recommended {
      border-color: #4CAF50;
    }

    .recommended-badge {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 0.25rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .card-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin: 0 auto 0.75rem;
      overflow: hidden;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 1.5rem;
      font-weight: 600;
      color: #666;
    }

    .card-header h3 {
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .business-name {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .metrics-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #666;
    }

    .metric-value {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 500;
    }

    .metric-icon {
      font-size: 1rem;
    }

    .metric-value.rating {
      color: #FF9800;
    }

    .stars {
      letter-spacing: -2px;
    }

    .rating-number {
      font-weight: 600;
    }

    .review-count {
      font-size: 0.75rem;
      color: #999;
      font-weight: normal;
    }

    .metric-value.price {
      color: #2196F3;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.available {
      background: #4CAF50;
    }

    .status-dot.unavailable {
      background: #F44336;
    }

    .quality-section {
      margin-bottom: 1rem;
    }

    .quality-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
    }

    .quality-scores {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .score-item {
      display: grid;
      grid-template-columns: 100px 1fr 40px;
      align-items: center;
      gap: 0.5rem;
    }

    .score-label {
      font-size: 0.75rem;
      color: #666;
    }

    .score-bar {
      height: 6px;
      background: #eee;
      border-radius: 3px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .score-value {
      font-size: 0.75rem;
      font-weight: 600;
      color: #333;
      text-align: right;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #666;
    }

    .specialties-section {
      margin-bottom: 1rem;
    }

    .specialties-section h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
    }

    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      padding: 0.25rem 0.75rem;
      background: #e3f2fd;
      color: #1976D2;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .specialty-chip.more {
      background: #f5f5f5;
      color: #666;
    }

    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .comparison-summary {
      margin: 1rem;
      padding: 1.5rem;
      background: white;
      border-radius: 16px;
    }

    .comparison-summary h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 12px;
    }

    .summary-icon {
      font-size: 1.5rem;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      font-size: 0.75rem;
      color: #666;
    }

    .summary-value {
      font-weight: 600;
      color: #333;
    }
  `]
})
export class CompareRepairersComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly store = inject(SearchStore);

  readonly repairers = signal<CompareRepairer[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const ids = this.route.snapshot.queryParamMap.get('ids');

    if (!ids) {
      this.error.set('Aucun réparateur sélectionné pour la comparaison');
      this.isLoading.set(false);
      return;
    }

    const repairerIds = ids.split(',').filter(id => id.trim());

    if (repairerIds.length < 2) {
      this.error.set('Veuillez sélectionner au moins 2 réparateurs à comparer');
      this.isLoading.set(false);
      return;
    }

    await this.loadRepairers(repairerIds);
  }

  private async loadRepairers(ids: string[]): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const promises = ids.map(id => this.searchService.getRepairer(id));
      const repairers = await Promise.all(promises);

      // Enhance with mock quality scores and stats
      const enhancedRepairers: CompareRepairer[] = repairers.map(repairer => ({
        ...repairer,
        qualityScores: {
          delays: Math.floor(Math.random() * 20) + 80,
          quality: Math.floor(Math.random() * 15) + 85,
          communication: Math.floor(Math.random() * 25) + 75,
          pricing: Math.floor(Math.random() * 20) + 80,
        },
        estimatedPrice: this.getEstimatedPrice(),
        estimatedDuration: this.getEstimatedDuration(),
        completedRepairs: Math.floor(Math.random() * 200) + 50,
        acceptanceRate: Math.floor(Math.random() * 15) + 85,
      }));

      this.repairers.set(enhancedRepairers);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement des réparateurs');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEstimatedPrice(): number | undefined {
    const problem = this.store.selectedProblem();
    if (!problem) return undefined;

    const basePrices: Record<string, { min: number; max: number }> = {
      'screen': { min: 15000, max: 45000 },
      'battery': { min: 8000, max: 20000 },
      'charging': { min: 5000, max: 15000 },
      'camera': { min: 10000, max: 25000 },
      'speaker': { min: 5000, max: 12000 },
      'button': { min: 3000, max: 8000 },
      'water': { min: 10000, max: 35000 },
      'software': { min: 3000, max: 10000 },
    };

    const range = basePrices[problem];
    if (!range) return Math.floor(Math.random() * 20000) + 10000;

    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
  }

  private getEstimatedDuration(): string {
    const durations = ['30 min', '1-2h', '2-4h', '1 jour', '1-2 jours'];
    return durations[Math.floor(Math.random() * durations.length)];
  }

  getRepairerName(repairer: Repairer): string {
    if (!repairer) return '';
    if (repairer.firstName || repairer.lastName) {
      return `${repairer.firstName || ''} ${repairer.lastName || ''}`.trim();
    }
    return repairer.repairerProfile?.businessName || 'Réparateur';
  }

  getInitials(repairer: Repairer): string {
    const name = this.getRepairerName(repairer);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
  }

  isRecommended(repairer: CompareRepairer): boolean {
    const repairers = this.repairers();
    if (repairers.length < 2) return false;

    // Calculate a score based on rating, quality scores, and availability
    const score = (r: CompareRepairer) => {
      let s = r.repairerProfile.rating * 20;
      s += (r.qualityScores.delays + r.qualityScores.quality + r.qualityScores.communication + r.qualityScores.pricing) / 4;
      if (r.repairerProfile.isAvailable) s += 10;
      return s;
    };

    const scores = repairers.map(r => ({ repairer: r, score: score(r) }));
    const best = scores.reduce((a, b) => a.score > b.score ? a : b);

    return best.repairer.id === repairer.id;
  }

  getBestRating(): CompareRepairer | null {
    const repairers = this.repairers();
    if (repairers.length === 0) return null;
    return repairers.reduce((a, b) =>
      a.repairerProfile.rating > b.repairerProfile.rating ? a : b
    );
  }

  getClosest(): CompareRepairer | null {
    const repairers = this.repairers();
    if (repairers.length === 0) return null;
    const withDistance = repairers.filter(r => r.distance !== undefined && r.distance !== null);
    if (withDistance.length === 0) return repairers[0];
    return withDistance.reduce((a, b) =>
      (a.distance ?? 999) < (b.distance ?? 999) ? a : b
    );
  }

  getCheapest(): CompareRepairer | null {
    const repairers = this.repairers();
    if (repairers.length === 0) return null;
    const withPrice = repairers.filter(r => r.estimatedPrice !== undefined);
    if (withPrice.length === 0) return repairers[0];
    return withPrice.reduce((a, b) =>
      (a.estimatedPrice ?? 999999) < (b.estimatedPrice ?? 999999) ? a : b
    );
  }

  goBack(): void {
    this.router.navigate(['/search/results']);
  }

  viewProfile(id: string): void {
    this.router.navigate(['/search/repairer', id]);
  }

  selectRepairer(repairer: CompareRepairer): void {
    // Navigate to create request with this repairer
    this.router.navigate(['/requests/new'], {
      queryParams: { repairerId: repairer.id }
    });
  }
}

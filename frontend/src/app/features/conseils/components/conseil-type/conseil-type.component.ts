import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConseilsService, ConseilsStore, type ConseilType, type ConseilFormat } from '@app/domains/conseils';
import { UiHeaderComponent } from '@app/features/common/components';

@Component({
  selector: 'app-conseil-type',
  standalone: true,
  imports: [CommonModule, UiHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="conseil-container">
      <ui-header
        title="Conseils d'experts"
        subtitle="Obtenez l'aide d'un professionnel"
        [showBack]="true"
        [showProfile]="true"
        (onBack)="goBack()"
      />

      <div class="conseil-content">
        <!-- Step 1: Type Selection -->
        <section class="step-section">
          <div class="step-header">
            <span class="step-number" [class.completed]="store.hasSelectedType()">
              @if (store.hasSelectedType()) {
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else {
                1
              }
            </span>
            <h2>Type de conseil</h2>
          </div>

          <div class="type-grid">
            @for (type of conseilTypes; track type.type) {
              <button
                class="type-card"
                [class.selected]="store.selectedType() === type.type"
                (click)="selectType(type.type)"
              >
                <span class="type-icon">{{ type.icon }}</span>
                <span class="type-label">{{ type.label }}</span>
                <span class="type-desc">{{ type.description }}</span>
                @if (store.selectedType() === type.type) {
                  <span class="check-icon">✓</span>
                }
              </button>
            }
          </div>
        </section>

        <!-- Step 2: Format Selection -->
        @if (store.hasSelectedType()) {
          <section class="step-section">
            <div class="step-header">
              <span class="step-number" [class.completed]="store.hasSelectedFormat()">
                @if (store.hasSelectedFormat()) {
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                } @else {
                  2
                }
              </span>
              <h2>Mode de communication</h2>
            </div>

            <div class="format-grid">
              @for (format of conseilFormats; track format.format) {
                <button
                  class="format-card"
                  [class.selected]="store.selectedFormat() === format.format"
                  (click)="selectFormat(format.format)"
                >
                  <span class="format-icon">{{ format.icon }}</span>
                  <div class="format-info">
                    <span class="format-label">{{ format.label }}</span>
                    <span class="format-desc">{{ format.description }}</span>
                  </div>
                  @if (store.selectedFormat() === format.format) {
                    <span class="check-icon">✓</span>
                  }
                </button>
              }
            </div>
          </section>
        }

        <!-- CTA -->
        @if (store.hasSelectedType() && store.hasSelectedFormat()) {
          <div class="cta-section">
            <div class="summary">
              <span class="summary-icon">{{ getSelectedTypeIcon() }}</span>
              <div class="summary-text">
                <span class="summary-type">{{ getSelectedTypeLabel() }}</span>
                <span class="summary-format">via {{ getSelectedFormatLabel() }}</span>
              </div>
            </div>
            <button class="btn btn-primary btn-block" (click)="proceed()">
              Voir les experts disponibles
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .conseil-container {
      min-height: 100vh;
      background: #FAFAFA;
    }

    .conseil-content {
      margin: 0;
      margin-top: var(--header-height, 100px);
      background: white;
      padding: 1.25rem;
      min-height: calc(100vh - 100px);
    }

    .step-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #F5F5F5;
    }

    .step-section:last-of-type {
      border-bottom: none;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .step-number {
      width: 28px;
      height: 28px;
      background: var(--color-primary-500, #FF9800);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.3s;
    }

    .step-number.completed {
      background: var(--color-secondary, #4CAF50);
    }

    .step-header h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .type-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .type-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.25rem 0.75rem;
      background: #FAFAFA;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .type-card:hover {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
      transform: translateY(-2px);
    }

    .type-card.selected {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      border-color: var(--color-primary-500, #FF9800);
      color: white;
    }

    .type-card.selected .type-label,
    .type-card.selected .type-desc {
      color: white;
    }

    .type-card.selected .type-desc {
      opacity: 0.9;
    }

    .type-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .type-label {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .type-desc {
      font-size: 0.6875rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .check-icon {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 20px;
      height: 20px;
      background: white;
      color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .format-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .format-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
      padding: 1.5rem 0.75rem;
      min-height: 120px;
      background: #FAFAFA;
      border: 2px solid #EEEEEE;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .format-card:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
    }

    .format-card.selected {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      border-color: var(--color-primary-500, #FF9800);
      color: white;
    }

    .format-card.selected .format-label,
    .format-card.selected .format-desc {
      color: white;
    }

    .format-icon {
      font-size: 2rem;
    }

    .format-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .format-label {
      font-weight: 600;
      color: #1f2937;
    }

    .format-desc {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .cta-section {
      margin-top: 1rem;
    }

    .summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      border-left: 4px solid var(--color-primary-500, #FF9800);
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .summary-icon {
      font-size: 2rem;
    }

    .summary-text {
      display: flex;
      flex-direction: column;
    }

    .summary-type {
      font-weight: 600;
      color: #1f2937;
    }

    .summary-format {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      min-height: 56px;
      font-weight: 700;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, var(--color-primary-900, #E65100) 0%, #F57C00 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
    }

    .btn-block {
      width: 100%;
    }

    @media (min-width: 640px) {
      .conseil-content {
        padding: 1.5rem 2rem;
      }

      .type-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `],
})
export class ConseilTypeComponent {
  private readonly router = inject(Router);
  private readonly conseilsService = inject(ConseilsService);
  readonly store = inject(ConseilsStore);

  readonly conseilTypes = this.conseilsService.getConseilTypes();
  readonly conseilFormats = this.conseilsService.getConseilFormats();

  selectType(type: ConseilType): void {
    this.store.setSelectedType(type);
  }

  selectFormat(format: ConseilFormat): void {
    this.store.setSelectedFormat(format);
  }

  getSelectedTypeIcon(): string {
    const type = this.conseilTypes.find((t) => t.type === this.store.selectedType());
    return type?.icon || '';
  }

  getSelectedTypeLabel(): string {
    const type = this.conseilTypes.find((t) => t.type === this.store.selectedType());
    return type?.label || '';
  }

  getSelectedFormatLabel(): string {
    const format = this.conseilFormats.find((f) => f.format === this.store.selectedFormat());
    return format?.label || '';
  }

  proceed(): void {
    this.router.navigate(['/conseils/experts']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConseilsService } from '../../services/conseils.service';
import { ConseilsStore } from '../../stores/conseils.store';
import { ConseilType, ConseilFormat } from '../../../../shared/models';

@Component({
  selector: 'app-conseil-type',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conseil-container">
      <header class="conseil-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-content">
          <h1>Conseils d'experts</h1>
          <p>Obtenez l'aide d'un professionnel</p>
        </div>
      </header>

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
      background: #f9fafb;
    }

    .conseil-header {
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      padding: 1rem;
      padding-top: calc(1rem + env(safe-area-inset-top, 0));
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .header-content p {
      opacity: 0.9;
      font-size: 0.875rem;
    }

    .conseil-content {
      padding: 1rem;
    }

    .step-section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      background: #7c3aed;
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
      background: #10b981;
    }

    .step-header h2 {
      font-size: 1.125rem;
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
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .type-card:hover {
      border-color: #7c3aed;
      background: #faf5ff;
    }

    .type-card.selected {
      border-color: #7c3aed;
      background: #faf5ff;
    }

    .type-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .type-label {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .type-desc {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .check-icon {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 20px;
      height: 20px;
      background: #7c3aed;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .format-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .format-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .format-card:hover {
      border-color: #7c3aed;
      background: #faf5ff;
    }

    .format-card.selected {
      border-color: #7c3aed;
      background: #faf5ff;
    }

    .format-icon {
      font-size: 1.75rem;
    }

    .format-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .format-label {
      font-weight: 600;
      color: #1f2937;
    }

    .format-desc {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .cta-section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #faf5ff;
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
      background: #7c3aed;
      color: white;
    }

    .btn-primary:hover {
      background: #6d28d9;
    }

    .btn-block {
      width: 100%;
    }

    @media (min-width: 640px) {
      .type-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .format-grid {
        flex-direction: row;
      }

      .format-card {
        flex: 1;
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

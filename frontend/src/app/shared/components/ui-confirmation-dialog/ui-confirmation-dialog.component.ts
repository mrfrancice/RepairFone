import {
  Component,
  Input,
  Output,
  EventEmitter,
  Injectable,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmationType = 'info' | 'warning' | 'danger' | 'success';

export interface ConfirmationConfig {
  title: string;
  message: string;
  type?: ConfirmationType;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  showCancel?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private dialogRef: UiConfirmationDialogComponent | null = null;
  private pendingResolve: ((value: boolean) => void) | null = null;

  register(dialog: UiConfirmationDialogComponent): void {
    this.dialogRef = dialog;
  }

  confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.dialogRef) {
        this.pendingResolve = resolve;
        this.dialogRef.open(config);
      } else {
        resolve(false);
      }
    });
  }

  handleResult(confirmed: boolean): void {
    if (this.pendingResolve) {
      this.pendingResolve(confirmed);
      this.pendingResolve = null;
    }
  }
}

@Component({
  selector: 'ui-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="dialog-overlay" (click)="onBackdropClick()">
        <div
          class="dialog-container"
          [class]="'type-' + config().type"
          (click)="$event.stopPropagation()"
          role="alertdialog"
          aria-modal="true"
        >
          <!-- Icon -->
          <div class="dialog-icon">
            @switch (config().type) {
              @case ('warning') {
                @if (config().icon) {
                  <span class="custom-icon">{{ config().icon }}</span>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                }
              }
              @case ('danger') {
                @if (config().icon) {
                  <span class="custom-icon">{{ config().icon }}</span>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.57 20.74C2.88 20.91 3.24 21 3.61 21H20.39C20.76 21 21.12 20.91 21.43 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.95 3.15C12.63 2.98 12.27 2.89 11.9 2.89C11.53 2.89 11.17 2.98 10.85 3.15C10.53 3.32 10.27 3.56 10.09 3.86" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              }
              @case ('success') {
                @if (config().icon) {
                  <span class="custom-icon">{{ config().icon }}</span>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
              }
              @default {
                @if (config().icon) {
                  <span class="custom-icon">{{ config().icon }}</span>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V12M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                }
              }
            }
          </div>

          <!-- Content -->
          <div class="dialog-content">
            <h3 class="dialog-title">{{ config().title }}</h3>
            <p class="dialog-message">{{ config().message }}</p>
          </div>

          <!-- Actions -->
          <div class="dialog-actions">
            @if (config().showCancel !== false) {
              <button
                type="button"
                class="btn btn-cancel"
                (click)="onCancel()"
              >
                {{ config().cancelLabel || 'Annuler' }}
              </button>
            }
            <button
              type="button"
              class="btn"
              [class.btn-primary]="config().confirmVariant === 'primary' || !config().confirmVariant"
              [class.btn-danger]="config().confirmVariant === 'danger'"
              [class.btn-success]="config().confirmVariant === 'success'"
              (click)="onConfirm()"
            >
              {{ config().confirmLabel || 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-container {
      background: var(--color-surface, white);
      border-radius: var(--border-radius-xl, 16px);
      max-width: 400px;
      width: 100%;
      padding: 1.5rem;
      text-align: center;
      animation: scaleIn 0.2s ease-out;
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Icon */
    .dialog-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .dialog-icon svg {
      width: 28px;
      height: 28px;
    }

    .custom-icon {
      font-size: 1.75rem;
    }

    .type-info .dialog-icon {
      background: var(--color-ocean-50, #E3F2FD);
      color: var(--color-info, #2196F3);
    }

    .type-warning .dialog-icon {
      background: var(--color-gold-50, #FFFDE7);
      color: var(--color-warning, #FFC107);
    }

    .type-danger .dialog-icon {
      background: var(--color-error-light, #FFEBEE);
      color: var(--color-error, #F44336);
    }

    .type-success .dialog-icon {
      background: var(--color-secondary-50, #E8F5E9);
      color: var(--color-success, #4CAF50);
    }

    /* Content */
    .dialog-content {
      margin-bottom: 1.5rem;
    }

    .dialog-title {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--color-neutral-900, #111827);
      margin: 0 0 0.5rem;
    }

    .dialog-message {
      font-size: 0.9375rem;
      color: var(--color-text-secondary, rgba(0, 0, 0, 0.60));
      margin: 0;
      line-height: 1.5;
    }

    /* Actions */
    .dialog-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      flex: 1;
      padding: 0 1rem;
      min-height: 48px;
      border-radius: 1rem;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 150ms ease;
      border: none;
    }

    .btn:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
    }

    .btn-cancel {
      background: var(--color-neutral-100, #F5F5F5);
      color: var(--color-neutral-800, #424242);
    }

    .btn-cancel:hover {
      background: var(--color-neutral-200, #EEEEEE);
    }

    .btn-primary {
      background: var(--color-primary-500, #FF9800);
      color: white;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .btn-primary:hover {
      background: var(--color-primary-900, #E65100);
    }

    .btn-danger {
      background: var(--color-error, #F44336);
      color: white;
    }

    .btn-danger:hover {
      background: var(--color-error-dark, #C62828);
    }

    .btn-success {
      background: var(--color-success, #4CAF50);
      color: white;
    }

    .btn-success:hover {
      background: var(--color-success-dark, #2E7D32);
    }
  `],
})
export class UiConfirmationDialogComponent {
  private readonly confirmationService: ConfirmationService;

  readonly isOpen = signal(false);
  readonly config = signal<ConfirmationConfig>({
    title: '',
    message: '',
    type: 'info',
  });

  @Input() closeOnBackdrop = true;

  @Output() onConfirmEvent = new EventEmitter<void>();
  @Output() onCancelEvent = new EventEmitter<void>();

  constructor(confirmationService: ConfirmationService) {
    this.confirmationService = confirmationService;
    this.confirmationService.register(this);
  }

  open(config: ConfirmationConfig): void {
    this.config.set({
      type: 'info',
      confirmLabel: 'Confirmer',
      cancelLabel: 'Annuler',
      showCancel: true,
      ...config,
    });
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.close();
    this.onConfirmEvent.emit();
    this.confirmationService.handleResult(true);
  }

  onCancel(): void {
    this.close();
    this.onCancelEvent.emit();
    this.confirmationService.handleResult(false);
  }
}

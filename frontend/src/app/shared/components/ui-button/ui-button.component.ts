import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [class]="buttonClasses"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
    >
      @if (loading) {
        <span class="spinner"></span>
      }
      @if (icon && !loading) {
        <span class="btn-icon">{{ icon }}</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    :host(.block) {
      display: block;
      width: 100%;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 600;
      border: none;
      border-radius: var(--border-radius-lg, 8px);
      cursor: pointer;
      transition: all var(--transition-fast, 150ms) ease;
      font-family: inherit;
      min-height: 44px;
      min-width: 44px;
    }

    button:focus {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 2px;
    }

    button:focus:not(:focus-visible) {
      outline: none;
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.2);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Sizes - All meet 44px minimum touch target */
    .btn-sm {
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      min-height: 44px;
    }

    .btn-md {
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
      min-height: 44px;
    }

    .btn-lg {
      padding: 1rem 1.5rem;
      font-size: 1.125rem;
      min-height: 48px;
    }

    /* Variants - Using CSS custom properties with fallbacks */
    .btn-primary {
      background: var(--color-primary-500, #FF9800);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-700, #F57C00);
    }

    .btn-secondary {
      background: var(--color-neutral-600, #757575);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-neutral-700, #616161);
    }

    .btn-outline {
      background: transparent;
      border: 2px solid var(--color-primary-500, #FF9800);
      color: var(--color-primary-600, #FB8C00);
    }

    .btn-outline:hover:not(:disabled) {
      background: var(--color-primary-50, #FFF3E0);
    }

    .btn-danger {
      background: var(--color-error, #F44336);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: var(--color-error-dark, #C62828);
    }

    .btn-success {
      background: var(--color-success, #4CAF50);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: var(--color-success-dark, #2E7D32);
    }

    .btn-ghost {
      background: transparent;
      color: var(--color-neutral-700, #616161);
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--color-neutral-100, #F5F5F5);
    }

    /* Full width */
    .btn-block {
      width: 100%;
    }

    /* Spinner */
    .spinner {
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-icon {
      font-size: 1.125em;
    }
  `]
})
export class UiButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() block = false;
  @Input() icon?: string;

  @Output() onClick = new EventEmitter<MouseEvent>();

  @HostBinding('class.block') get isBlock(): boolean {
    return this.block;
  }

  get buttonClasses(): string {
    return [
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.block ? 'btn-block' : ''
    ].filter(Boolean).join(' ');
  }
}

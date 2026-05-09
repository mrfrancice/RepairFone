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
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 600;
      letter-spacing: -0.005em;
      border: none;
      border-radius: 1rem;
      cursor: pointer;
      transition: all 150ms ease;
      min-height: 48px;
      min-width: 48px;
    }

    button:focus:not(:focus-visible) {
      outline: none;
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.20);
    }

    button:active:not(:disabled) {
      transform: scale(0.98);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Sizes - touch targets >= 44px (charte: standard 48px) */
    .btn-sm {
      min-height: 36px;
      min-width: 36px;
      padding: 0 1rem;
      font-size: 0.8125rem;
      border-radius: 0.625rem;
    }

    .btn-md {
      min-height: 48px;
      padding: 0 1.5rem;
      font-size: 0.9375rem;
    }

    .btn-lg {
      min-height: 56px;
      padding: 0 2rem;
      font-size: 1.0625rem;
      border-radius: 1.125rem;
    }

    /* Variants - charte officielle */
    .btn-primary {
      background: var(--color-primary-500, #FF9800);
      color: white;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-900, #E65100);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--color-secondary, #4CAF50);
      color: white;
      box-shadow: var(--shadow-success, 0 8px 24px rgba(76, 175, 80, 0.20));
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-secondary-dark, #2E7D32);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: transparent;
      border: 2px solid var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
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
      box-shadow: var(--shadow-success, 0 8px 24px rgba(76, 175, 80, 0.20));
    }

    .btn-success:hover:not(:disabled) {
      background: var(--color-success-dark, #2E7D32);
      transform: translateY(-1px);
    }

    .btn-ghost {
      background: var(--color-neutral-100, #F5F5F5);
      color: var(--color-neutral-800, #1F2937);
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--color-neutral-200, #EEEEEE);
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

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
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

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Sizes */
    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-md {
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
    }

    .btn-lg {
      padding: 1rem 1.5rem;
      font-size: 1.125rem;
    }

    /* Variants */
    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn-outline {
      background: transparent;
      border: 2px solid #2563eb;
      color: #2563eb;
    }

    .btn-outline:hover:not(:disabled) {
      background: #eff6ff;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-success {
      background: #16a34a;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #15803d;
    }

    .btn-ghost {
      background: transparent;
      color: #374151;
    }

    .btn-ghost:hover:not(:disabled) {
      background: #f3f4f6;
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

  get buttonClasses(): string {
    return [
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.block ? 'btn-block' : ''
    ].filter(Boolean).join(' ');
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type ChipSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span
      class="chip"
      [class]="'chip-' + variant + ' size-' + size"
      [class.clickable]="clickable"
      [class.selected]="selected"
      [class.disabled]="disabled"
      [class.removable]="removable"
      (click)="onClick($event)"
      [attr.role]="clickable ? 'button' : null"
      [attr.tabindex]="clickable && !disabled ? 0 : null"
      (keydown.enter)="onClick($event)"
      (keydown.space)="onClick($event); $event.preventDefault()"
    >
      @if (icon) {
        <span class="chip-icon">{{ icon }}</span>
      }
      @if (avatar) {
        <img [src]="avatar" alt="" class="chip-avatar" />
      }
      <span class="chip-label">
        <ng-content></ng-content>
        @if (!hasContent) {
          {{ label }}
        }
      </span>
      @if (count !== undefined) {
        <span class="chip-count">{{ count }}</span>
      }
      @if (removable && !disabled) {
        <button
          class="chip-remove"
          (click)="onRemove($event)"
          aria-label="Supprimer"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 0.875rem;
      min-height: 48px;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .chip.clickable {
      cursor: pointer;
      min-width: 48px;
    }

    .chip.clickable:focus {
      outline: none;
    }

    .chip.clickable:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.2);
    }

    .chip.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Variants - Using CSS custom properties */
    .chip-default {
      background: var(--color-neutral-100, #F5F5F5);
      color: var(--text-primary, #374151);
    }

    .chip-default.clickable:hover:not(.disabled) {
      background: var(--color-neutral-200, #EEEEEE);
    }

    .chip-default.selected {
      background: var(--color-primary, #FF9800);
      color: white;
    }

    .chip-primary {
      background: var(--color-primary-light, #FFF3E0);
      color: var(--color-primary, #FF9800);
    }

    .chip-primary.clickable:hover:not(.disabled) {
      background: var(--color-primary-100, #FFE0B2);
    }

    .chip-primary.selected {
      background: var(--color-primary, #FF9800);
      color: white;
    }

    .chip-success {
      background: var(--color-success-light, #E8F5E9);
      color: var(--color-success, #4CAF50);
    }

    .chip-success.clickable:hover:not(.disabled) {
      background: var(--color-success-100, #dcfce7);
    }

    .chip-success.selected {
      background: var(--color-success, #4CAF50);
      color: white;
    }

    .chip-warning {
      background: var(--color-warning-light, #FFF8E1);
      color: var(--color-warning, #F9A825);
    }

    .chip-warning.clickable:hover:not(.disabled) {
      background: var(--color-warning-100, #FFF8E1);
    }

    .chip-warning.selected {
      background: var(--color-warning, #F9A825);
      color: white;
    }

    .chip-danger {
      background: var(--color-error-light, #FFEBEE);
      color: var(--color-error, #C62828);
    }

    .chip-danger.clickable:hover:not(.disabled) {
      background: var(--color-error-100, #FFEBEE);
    }

    .chip-danger.selected {
      background: var(--color-error, #C62828);
      color: white;
    }

    .chip-info {
      background: var(--color-ocean-light, #f0f9ff);
      color: var(--color-ocean, #1565C0);
    }

    .chip-info.clickable:hover:not(.disabled) {
      background: var(--color-ocean-100, #e0f2fe);
    }

    .chip-info.selected {
      background: var(--color-ocean, #1565C0);
      color: white;
    }

    /* Sizes - All maintain 44px minimum touch target */
    .size-sm {
      padding: 0.5rem 0.625rem;
      font-size: 0.75rem;
      gap: 0.25rem;
      min-height: 48px;
    }

    .size-lg {
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      gap: 0.5rem;
      min-height: 48px;
    }

    /* Elements */
    .chip-icon {
      font-size: 1em;
      line-height: 1;
    }

    .chip-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
      margin-left: -0.25rem;
    }

    .size-sm .chip-avatar {
      width: 16px;
      height: 16px;
    }

    .size-lg .chip-avatar {
      width: 24px;
      height: 24px;
    }

    .chip-label {
      white-space: nowrap;
    }

    .chip-count {
      background: rgba(0, 0, 0, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      font-size: 0.75em;
      min-width: 1.25rem;
      text-align: center;
    }

    .chip.selected .chip-count {
      background: rgba(255, 255, 255, 0.2);
    }

    .chip-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 0.5rem;
      margin: -0.25rem -0.25rem -0.25rem 0;
      cursor: pointer;
      color: currentColor;
      opacity: 0.6;
      border-radius: 50%;
      transition: all 0.2s;
      min-width: 48px;
      min-height: 48px;
    }

    .chip-remove:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.1);
    }

    .chip-remove:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 1px;
      opacity: 1;
    }

    .chip.selected .chip-remove:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `],
})
export class UiChipComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() avatar?: string;
  @Input() count?: number;
  @Input() variant: ChipVariant = 'default';
  @Input() size: ChipSize = 'md';
  @Input() clickable = false;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() removable = false;

  // Alias for variant (used as color in some components)
  @Input() set color(value: ChipVariant) {
    this.variant = value;
  }

  @Output() chipClick = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  hasContent = false;

  onClick(event: Event): void {
    if (this.disabled || !this.clickable) return;
    this.chipClick.emit();
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.remove.emit();
  }
}

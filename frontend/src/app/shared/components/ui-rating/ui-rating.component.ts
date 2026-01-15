import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rating"
      [class.readonly]="readonly"
      [class]="'rating-' + size"
      [attr.role]="readonly ? 'img' : 'slider'"
      [attr.aria-label]="ariaLabel || 'Note'"
      [attr.aria-valuenow]="value"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="max"
      [attr.aria-valuetext]="value + ' etoile' + (value > 1 ? 's' : '') + ' sur ' + max + (count !== undefined ? ', ' + count + ' avis' : '')"
      [attr.aria-readonly]="readonly ? 'true' : null"
      [attr.tabindex]="readonly ? null : 0"
      (keydown)="onContainerKeyDown($event)"
    >
      @for (star of stars; track star; let i = $index) {
        <span
          class="star"
          [class.filled]="star <= displayValue"
          [class.half]="star - 0.5 === displayValue"
          [class.interactive]="!readonly"
          (click)="onStarClick(star)"
          (mouseenter)="onStarHover(star)"
          (mouseleave)="onStarLeave()"
          role="presentation"
          aria-hidden="true"
        >
          <span class="star-icon">&#9733;</span>
        </span>
      }
      @if (showValue) {
        <span class="rating-value" aria-hidden="true">{{ value.toFixed(1) }}</span>
      }
      @if (count !== undefined) {
        <span class="rating-count" aria-hidden="true">({{ count }} avis)</span>
      }
    </div>
  `,
  styles: [`
    .rating {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .rating-sm .star {
      font-size: 1.25rem;
      min-width: 44px;
      min-height: 44px;
    }

    .rating-md .star {
      font-size: 1.5rem;
      min-width: 44px;
      min-height: 44px;
    }

    .rating-lg .star {
      font-size: 1.75rem;
      min-width: 48px;
      min-height: 48px;
    }

    .rating:focus {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 2px;
    }

    .rating:focus:not(:focus-visible) {
      outline: none;
    }

    .rating:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.2);
    }

    .star {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      color: var(--color-neutral-400, #BDBDBD);
      transition: color 0.15s, transform 0.15s;
      border-radius: var(--border-radius-sm, 4px);
      min-width: 44px;
      min-height: 44px;
    }

    .star.interactive {
      cursor: pointer;
    }

    .star.interactive:hover {
      transform: scale(1.1);
      color: var(--color-gold-700, #FBC02D);
    }

    .star.filled {
      color: var(--color-gold-700, #FBC02D);
    }

    .star-icon {
      font-size: inherit;
      line-height: 1;
    }

    .readonly .star {
      cursor: default;
      min-width: auto;
      min-height: auto;
      padding: 0.125rem;
    }

    .rating-value {
      margin-left: 0.5rem;
      font-weight: 600;
      color: var(--color-neutral-900, #212121);
    }

    .rating-count {
      margin-left: 0.25rem;
      font-size: 0.875rem;
      color: var(--color-neutral-600, #757575);
    }

  `]
})
export class UiRatingComponent {
  @Input() value = 0;
  @Input() max = 5;
  @Input() readonly = false;
  @Input() showValue = false;
  @Input() count?: number;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel?: string;

  @Output() valueChange = new EventEmitter<number>();

  hoverValue: number | null = null;

  get stars(): number[] {
    return Array.from({ length: this.max }, (_, i) => i + 1);
  }

  get displayValue(): number {
    return this.hoverValue ?? this.value;
  }

  onStarClick(star: number): void {
    if (this.readonly) return;
    this.value = star;
    this.valueChange.emit(star);
  }

  onStarHover(star: number): void {
    if (this.readonly) return;
    this.hoverValue = star;
  }

  onStarLeave(): void {
    this.hoverValue = null;
  }

  /**
   * Keyboard navigation for the slider.
   * Implements WAI-ARIA Slider pattern:
   * - Arrow Right/Up: Increase value by 1
   * - Arrow Left/Down: Decrease value by 1
   * - Home: Set to minimum (1)
   * - End: Set to maximum
   * - Page Up: Increase by larger step (optional, same as End here)
   * - Page Down: Decrease by larger step (optional, same as Home here)
   */
  onContainerKeyDown(event: KeyboardEvent): void {
    if (this.readonly) return;

    let newValue = this.value || 1;
    let handled = true;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(this.value + 1, this.max);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(this.value - 1, 1);
        break;
      case 'Home':
      case 'PageDown':
        newValue = 1;
        break;
      case 'End':
      case 'PageUp':
        newValue = this.max;
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
      if (newValue !== this.value) {
        this.value = newValue;
        this.valueChange.emit(newValue);
      }
    }
  }
}

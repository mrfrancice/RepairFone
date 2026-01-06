import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating" [class.readonly]="readonly" [class]="'rating-' + size">
      @for (star of stars; track star) {
        <button
          type="button"
          class="star"
          [class.filled]="star <= displayValue"
          [class.half]="star - 0.5 === displayValue"
          [disabled]="readonly"
          (click)="onStarClick(star)"
          (mouseenter)="onStarHover(star)"
          (mouseleave)="onStarLeave()"
        >
          ★
        </button>
      }
      @if (showValue) {
        <span class="rating-value">{{ value.toFixed(1) }}</span>
      }
      @if (count !== undefined) {
        <span class="rating-count">({{ count }} avis)</span>
      }
    </div>
  `,
  styles: [`
    .rating {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
    }

    .rating-sm .star {
      font-size: 0.875rem;
    }

    .rating-md .star {
      font-size: 1.25rem;
    }

    .rating-lg .star {
      font-size: 1.5rem;
    }

    .star {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #d1d5db;
      transition: color 0.15s, transform 0.15s;
    }

    .star:not(:disabled):hover {
      transform: scale(1.1);
    }

    .star.filled {
      color: #f59e0b;
    }

    .readonly .star {
      cursor: default;
    }

    .rating-value {
      margin-left: 0.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .rating-count {
      margin-left: 0.25rem;
      font-size: 0.875rem;
      color: #6b7280;
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
}

import {
  Component,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type PriceSize = 'sm' | 'md' | 'lg' | 'xl';
export type PriceVariant = 'default' | 'primary' | 'success' | 'danger' | 'muted';

@Component({
  selector: 'ui-price-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="price-display"
      [class]="'size-' + size + ' variant-' + variant"
      [class.has-original]="originalPrice !== undefined && originalPrice !== null"
      [class.inline]="inline"
    >
      @if (prefix) {
        <span class="price-prefix">{{ prefix }}</span>
      }

      @if (showRange && minPrice !== undefined && maxPrice !== undefined) {
        <!-- Range display -->
        <span class="price-range">
          <span class="price-value">{{ formatPrice(minPrice) }}</span>
          <span class="price-separator">–</span>
          <span class="price-value">{{ formatPrice(maxPrice) }}</span>
        </span>
      } @else {
        <!-- Single price display -->
        @if (originalPrice !== undefined && originalPrice !== null && originalPrice > (amount ?? 0)) {
          <span class="original-price">{{ formatPrice(originalPrice) }}</span>
        }
        <span class="price-value">
          @if (amount !== undefined && amount !== null) {
            {{ formatPrice(amount) }}
          } @else {
            {{ placeholder }}
          }
        </span>
      }

      <span class="price-currency">{{ currency }}</span>

      @if (suffix) {
        <span class="price-suffix">{{ suffix }}</span>
      }

      @if (discount && originalPrice && originalPrice > (amount ?? 0)) {
        <span class="discount-badge">-{{ calculateDiscount() }}%</span>
      }
    </span>
  `,
  styles: [`
    .price-display {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .price-display.inline {
      display: inline;
    }

    /* Sizes */
    .size-sm {
      font-size: 0.875rem;
    }

    .size-sm .price-currency {
      font-size: 0.75rem;
    }

    .size-md {
      font-size: 1rem;
    }

    .size-md .price-currency {
      font-size: 0.8125rem;
    }

    .size-lg {
      font-size: 1.25rem;
    }

    .size-lg .price-currency {
      font-size: 0.9375rem;
    }

    .size-xl {
      font-size: 1.75rem;
    }

    .size-xl .price-currency {
      font-size: 1.125rem;
    }

    /* Variants */
    .variant-default {
      color: #1f2937;
    }

    .variant-primary {
      color: #2563eb;
    }

    .variant-success {
      color: #16a34a;
    }

    .variant-danger {
      color: #dc2626;
    }

    .variant-muted {
      color: #6b7280;
    }

    /* Elements */
    .price-prefix {
      font-weight: 400;
      color: #6b7280;
      margin-right: 0.125rem;
    }

    .price-value {
      font-variant-numeric: tabular-nums;
    }

    .price-range {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .price-separator {
      color: #9ca3af;
      margin: 0 0.125rem;
    }

    .price-currency {
      font-weight: 500;
      margin-left: 0.125rem;
    }

    .price-suffix {
      font-weight: 400;
      color: #6b7280;
      font-size: 0.875em;
      margin-left: 0.25rem;
    }

    .original-price {
      color: #9ca3af;
      text-decoration: line-through;
      font-weight: 400;
      margin-right: 0.375rem;
      font-size: 0.875em;
    }

    .discount-badge {
      background: #dc2626;
      color: white;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      margin-left: 0.5rem;
      vertical-align: middle;
    }
  `],
})
export class UiPriceDisplayComponent {
  @Input() amount?: number | null;
  @Input() originalPrice?: number | null;
  @Input() minPrice?: number;
  @Input() maxPrice?: number;
  @Input() showRange = false;
  @Input() currency = 'FCFA';
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() size: PriceSize = 'md';
  @Input() variant: PriceVariant = 'default';
  @Input() discount = false;
  @Input() inline = false;
  @Input() placeholder = '—';
  @Input() thousandSeparator = ' ';

  formatPrice(value: number): string {
    if (value === undefined || value === null) return this.placeholder;
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);
  }

  calculateDiscount(): number {
    if (!this.originalPrice || !this.amount || this.originalPrice <= this.amount) return 0;
    return Math.round(((this.originalPrice - this.amount) / this.originalPrice) * 100);
  }
}

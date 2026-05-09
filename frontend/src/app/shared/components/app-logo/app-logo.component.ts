import { Component, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppLogoSize = 'sm' | 'md' | 'lg';
export type AppLogoVariant = 'gradient' | 'solid' | 'white';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rf-mark" [class.on-dark]="onDark" [class]="variantClass">
      @if (showGlyph) {
        <div class="rf-mark-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a4.5 4.5 0 0 0 5 7L21 14.5v3l-1.3 1.3a4.5 4.5 0 0 1-7-5L8.5 9.5l-2 2L3 8l5-5 3.5 3.5 2-2 1.2 1.8z"/>
          </svg>
        </div>
      }
      @if (showWordmark) {
        <span class="rf-mark-text">Repair<span class="rf-tail">Fone</span></span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .rf-mark {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
    }

    .rf-mark-glyph {
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      flex-shrink: 0;
    }

    .rf-mark-text {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-neutral-900, #111827);
      line-height: 1;
    }

    .rf-mark-text .rf-tail {
      color: var(--color-primary-500, #FF9800);
    }

    /* Sizes */
    :host-context(.size-sm) .rf-mark-glyph,
    .size-sm .rf-mark-glyph { width: 28px; height: 28px; border-radius: 8px; }
    :host-context(.size-sm) .rf-mark-glyph svg,
    .size-sm .rf-mark-glyph svg { width: 18px; height: 18px; }
    :host-context(.size-sm) .rf-mark-text,
    .size-sm .rf-mark-text { font-size: 1rem; }

    :host-context(.size-md) .rf-mark-glyph,
    .size-md .rf-mark-glyph { width: 40px; height: 40px; border-radius: 12px; }
    :host-context(.size-md) .rf-mark-glyph svg,
    .size-md .rf-mark-glyph svg { width: 24px; height: 24px; }
    :host-context(.size-md) .rf-mark-text,
    .size-md .rf-mark-text { font-size: 1.375rem; }

    :host-context(.size-lg) .rf-mark-glyph,
    .size-lg .rf-mark-glyph { width: 64px; height: 64px; border-radius: 16px; box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20)); }
    :host-context(.size-lg) .rf-mark-glyph svg,
    .size-lg .rf-mark-glyph svg { width: 36px; height: 36px; }
    :host-context(.size-lg) .rf-mark-text,
    .size-lg .rf-mark-text { font-size: 2rem; }

    /* Variants */
    .on-dark .rf-mark-text {
      color: white;
    }

    .on-dark .rf-mark-text .rf-tail {
      color: var(--color-primary-300, #FFB74D);
    }

    .variant-solid .rf-mark-glyph {
      background: white;
      color: var(--color-primary-500, #FF9800);
    }

    .variant-white .rf-mark-glyph {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: white;
    }

    .variant-white .rf-mark-text {
      color: white;
    }

    .variant-white .rf-mark-text .rf-tail {
      color: rgba(255, 255, 255, 0.85);
    }
  `]
})
export class AppLogoComponent {
  @Input() size: AppLogoSize = 'md';
  @Input() variant: AppLogoVariant = 'gradient';
  @Input() onDark = false;
  @Input() showGlyph = true;
  @Input() showWordmark = true;

  @HostBinding('class')
  get hostClasses(): string {
    return `size-${this.size} variant-${this.variant}`;
  }

  get variantClass(): string {
    return `variant-${this.variant}`;
  }
}

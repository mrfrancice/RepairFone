import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" [class.clickable]="clickable" [class.no-padding]="noPadding">
      @if (title || subtitle) {
        <div class="card-header">
          @if (title) {
            <h3 class="card-title">{{ title }}</h3>
          }
          @if (subtitle) {
            <p class="card-subtitle">{{ subtitle }}</p>
          }
        </div>
      }
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <ng-content select="[card-footer]"></ng-content>
    </div>
  `,
  styles: [`
    .card {
      background: var(--color-surface, #FFFFFF);
      border: 1px solid var(--color-neutral-200, #EEEEEE);
      border-radius: 1rem;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      overflow: hidden;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card.clickable {
      cursor: pointer;
    }

    .card.clickable:hover {
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.10));
      transform: translateY(-2px);
    }

    .card-header {
      padding: 1.5rem 1.5rem 0;
    }

    .card-title {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--color-neutral-900, #111827);
      margin: 0 0 0.25rem;
    }

    .card-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #4B5563);
      margin: 0;
    }

    .card-body {
      padding: 1.5rem;
    }

    .no-padding .card-body {
      padding: 0;
    }
  `]
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() clickable = false;
  @Input() noPadding = false;
}

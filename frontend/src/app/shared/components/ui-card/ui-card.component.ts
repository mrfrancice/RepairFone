import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
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
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card.clickable {
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .card.clickable:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .card-header {
      padding: 1rem 1rem 0;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.25rem;
    }

    .card-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .card-body {
      padding: 1rem;
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

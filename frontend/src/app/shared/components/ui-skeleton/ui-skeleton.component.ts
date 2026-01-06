import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'avatar' | 'card' | 'list-item' | 'image';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant) {
      @case ('text') {
        @for (item of countArray; track $index) {
          <div
            class="skeleton skeleton-text rounded"
            [class.animate-pulse]="animated"
            [style.width]="width"
            [style.height]="height || '1rem'"
          ></div>
        }
      }
      @case ('avatar') {
        <div
          class="skeleton skeleton-avatar rounded-full"
          [class.animate-pulse]="animated"
          [style.width]="width || '48px'"
          [style.height]="height || width || '48px'"
        ></div>
      }
      @case ('card') {
        <div
          class="skeleton skeleton-card rounded-lg"
          [class.animate-pulse]="animated"
          [style.width]="width || '100%'"
          [style.height]="height || '200px'"
        ></div>
      }
      @case ('list-item') {
        @for (item of countArray; track $index) {
          <div class="skeleton-list-item">
            <div
              class="skeleton skeleton-avatar rounded-full flex-shrink-0"
              [class.animate-pulse]="animated"
            ></div>
            <div class="skeleton-list-content">
              <div
                class="skeleton skeleton-text rounded"
                [class.animate-pulse]="animated"
                style="width: 60%"
              ></div>
              <div
                class="skeleton skeleton-text skeleton-text-sm rounded"
                [class.animate-pulse]="animated"
                style="width: 80%"
              ></div>
            </div>
          </div>
        }
      }
      @case ('image') {
        <div
          class="skeleton skeleton-image rounded-lg"
          [class.animate-pulse]="animated"
          [style.width]="width || '100%'"
          [style.height]="height || '150px'"
        ></div>
      }
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton {
      background-color: #e5e7eb;
      position: relative;
      overflow: hidden;
    }

    .skeleton.animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Text variant */
    .skeleton-text {
      height: 1rem;
      margin-bottom: 0.5rem;
    }

    .skeleton-text:last-child {
      margin-bottom: 0;
    }

    .skeleton-text-sm {
      height: 0.75rem;
    }

    /* Avatar variant */
    .skeleton-avatar {
      width: 48px;
      height: 48px;
    }

    /* Card variant */
    .skeleton-card {
      width: 100%;
      height: 200px;
    }

    /* Image variant */
    .skeleton-image {
      width: 100%;
      height: 150px;
    }

    /* List item variant */
    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
    }

    .skeleton-list-item:not(:last-child) {
      border-bottom: 1px solid #f3f4f6;
    }

    .skeleton-list-item .skeleton-avatar {
      width: 40px;
      height: 40px;
    }

    .skeleton-list-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .skeleton-list-content .skeleton-text {
      margin-bottom: 0;
    }

    /* Tailwind rounded utilities */
    .rounded {
      border-radius: 0.25rem;
    }

    .rounded-full {
      border-radius: 9999px;
    }

    .rounded-lg {
      border-radius: 0.5rem;
    }

    /* Flex utilities */
    .flex-shrink-0 {
      flex-shrink: 0;
    }
  `]
})
export class UiSkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() count = 1;
  @Input() animated = true;

  get countArray(): number[] {
    return Array(this.count).fill(0);
  }
}

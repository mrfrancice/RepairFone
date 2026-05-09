import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circle' | 'rectangle' | 'avatar' | 'card' | 'list-item' | 'image' | 'button' | 'input' | 'repairer-card' | 'profile-header' | 'stats-grid' | 'dashboard-card' | 'request-card';
export type SkeletonAnimation = 'pulse' | 'shimmer' | 'none';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="status"
      [attr.aria-label]="ariaLabel || 'Chargement en cours'"
      [attr.aria-busy]="true"
      class="skeleton-container"
    >
      <span class="sr-only">{{ ariaLabel || 'Chargement en cours...' }}</span>

      @switch (variant) {
        @case ('text') {
          @for (item of countArray; track $index) {
            <div
              class="skeleton skeleton-text rounded"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              [style.width]="width"
              [style.height]="height || '1rem'"
              aria-hidden="true"
            ></div>
          }
        }
        @case ('circle') {
          @for (item of countArray; track $index) {
            <div
              class="skeleton skeleton-circle"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              [style.width]="width || '48px'"
              [style.height]="height || width || '48px'"
              aria-hidden="true"
            ></div>
          }
        }
        @case ('rectangle') {
          @for (item of countArray; track $index) {
            <div
              class="skeleton skeleton-rectangle rounded-lg"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              [style.width]="width || '100%'"
              [style.height]="height || '100px'"
              aria-hidden="true"
            ></div>
          }
        }
        @case ('avatar') {
          <div
            class="skeleton skeleton-avatar rounded-full"
            [class.animate-pulse]="animation === 'pulse'"
            [class.animate-shimmer]="animation === 'shimmer'"
            [style.width]="width || '48px'"
            [style.height]="height || width || '48px'"
            aria-hidden="true"
          ></div>
        }
        @case ('card') {
          <div
            class="skeleton skeleton-card rounded-lg"
            [class.animate-pulse]="animation === 'pulse'"
            [class.animate-shimmer]="animation === 'shimmer'"
            [style.width]="width || '100%'"
            [style.height]="height || '200px'"
            aria-hidden="true"
          ></div>
        }
        @case ('list-item') {
          @for (item of countArray; track $index) {
            <div class="skeleton-list-item" aria-hidden="true">
              <div
                class="skeleton skeleton-avatar rounded-full flex-shrink-0"
                [class.animate-pulse]="animation === 'pulse'"
                [class.animate-shimmer]="animation === 'shimmer'"
              ></div>
              <div class="skeleton-list-content">
                <div
                  class="skeleton skeleton-text rounded"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 60%"
                ></div>
                <div
                  class="skeleton skeleton-text skeleton-text-sm rounded"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 80%"
                ></div>
              </div>
            </div>
          }
        }
        @case ('image') {
          <div
            class="skeleton skeleton-image rounded-lg"
            [class.animate-pulse]="animation === 'pulse'"
            [class.animate-shimmer]="animation === 'shimmer'"
            [style.width]="width || '100%'"
            [style.height]="height || '150px'"
            aria-hidden="true"
          ></div>
        }
        @case ('button') {
          <div
            class="skeleton skeleton-button rounded-lg"
            [class.animate-pulse]="animation === 'pulse'"
            [class.animate-shimmer]="animation === 'shimmer'"
            [style.width]="width || '120px'"
            [style.height]="height || '44px'"
            aria-hidden="true"
          ></div>
        }
        @case ('input') {
          <div class="skeleton-input-wrapper" aria-hidden="true">
            @if (showLabel) {
              <div
                class="skeleton skeleton-label rounded"
                [class.animate-pulse]="animation === 'pulse'"
                [class.animate-shimmer]="animation === 'shimmer'"
              ></div>
            }
            <div
              class="skeleton skeleton-input rounded-lg"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              [style.width]="width || '100%'"
            ></div>
          </div>
        }
        @case ('repairer-card') {
          @for (item of countArray; track $index) {
            <div class="skeleton-repairer-card rounded-xl" aria-hidden="true">
              <div class="skeleton-repairer-header">
                <div
                  class="skeleton skeleton-avatar rounded-full"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 56px; height: 56px;"
                ></div>
                <div class="skeleton-repairer-info">
                  <div
                    class="skeleton skeleton-text rounded"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                    style="width: 70%;"
                  ></div>
                  <div
                    class="skeleton skeleton-text skeleton-text-sm rounded"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                    style="width: 50%;"
                  ></div>
                </div>
              </div>
              <div class="skeleton-repairer-body">
                <div
                  class="skeleton skeleton-text rounded"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 100%;"
                ></div>
                <div
                  class="skeleton skeleton-text skeleton-text-sm rounded"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 80%;"
                ></div>
              </div>
              <div class="skeleton-repairer-footer">
                <div class="skeleton-meta-row">
                  <div
                    class="skeleton skeleton-badge rounded-full"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                  ></div>
                  <div
                    class="skeleton skeleton-badge rounded-full"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                  ></div>
                </div>
              </div>
            </div>
          }
        }
        @case ('profile-header') {
          <div class="skeleton-profile-header" aria-hidden="true">
            <div
              class="skeleton skeleton-avatar-lg rounded-full"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
            ></div>
            <div
              class="skeleton skeleton-text rounded"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              style="width: 60%; height: 1.25rem; margin-top: 1rem;"
            ></div>
            <div
              class="skeleton skeleton-text rounded"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              style="width: 40%; height: 0.875rem; margin-top: 0.5rem;"
            ></div>
            <div
              class="skeleton skeleton-badge rounded-full"
              [class.animate-pulse]="animation === 'pulse'"
              [class.animate-shimmer]="animation === 'shimmer'"
              style="width: 100px; height: 32px; margin-top: 0.75rem;"
            ></div>
          </div>
        }
        @case ('stats-grid') {
          <div class="skeleton-stats-grid" aria-hidden="true">
            @for (item of [1,2,3]; track item) {
              <div class="skeleton-stat-card rounded-xl">
                <div
                  class="skeleton skeleton-stat-icon rounded-lg"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                ></div>
                <div class="skeleton-stat-info">
                  <div
                    class="skeleton skeleton-text rounded"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                    style="width: 50%; height: 1.5rem;"
                  ></div>
                  <div
                    class="skeleton skeleton-text rounded"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                    style="width: 70%; height: 0.75rem; margin-top: 0.25rem;"
                  ></div>
                </div>
              </div>
            }
          </div>
        }
        @case ('dashboard-card') {
          @for (item of countArray; track $index) {
            <div class="skeleton-dashboard-card rounded-xl" aria-hidden="true">
              <div
                class="skeleton skeleton-dashboard-icon rounded-lg"
                [class.animate-pulse]="animation === 'pulse'"
                [class.animate-shimmer]="animation === 'shimmer'"
              ></div>
              <div class="skeleton-dashboard-info">
                <div
                  class="skeleton skeleton-text rounded"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 40%; height: 2rem;"
                ></div>
                <div
                  class="skeleton skeleton-text rounded"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                  style="width: 60%; height: 0.875rem; margin-top: 0.375rem;"
                ></div>
              </div>
            </div>
          }
        }
        @case ('request-card') {
          @for (item of countArray; track $index) {
            <div class="skeleton-request-card rounded-xl" aria-hidden="true">
              <div
                class="skeleton skeleton-status-badge rounded"
                [class.animate-pulse]="animation === 'pulse'"
                [class.animate-shimmer]="animation === 'shimmer'"
              ></div>
              <div class="skeleton-request-main">
                <div class="skeleton-request-header">
                  <div
                    class="skeleton skeleton-device-icon rounded-lg"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                  ></div>
                  <div class="skeleton-device-info">
                    <div
                      class="skeleton skeleton-text rounded"
                      [class.animate-pulse]="animation === 'pulse'"
                      [class.animate-shimmer]="animation === 'shimmer'"
                      style="width: 70%;"
                    ></div>
                    <div
                      class="skeleton skeleton-text skeleton-text-sm rounded"
                      [class.animate-pulse]="animation === 'pulse'"
                      [class.animate-shimmer]="animation === 'shimmer'"
                      style="width: 50%;"
                    ></div>
                  </div>
                </div>
                <div
                  class="skeleton skeleton-person-row rounded-lg"
                  [class.animate-pulse]="animation === 'pulse'"
                  [class.animate-shimmer]="animation === 'shimmer'"
                ></div>
                <div class="skeleton-request-footer">
                  <div
                    class="skeleton skeleton-text rounded"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                    style="width: 100px; height: 0.75rem;"
                  ></div>
                  <div
                    class="skeleton skeleton-price-badge rounded"
                    [class.animate-pulse]="animation === 'pulse'"
                    [class.animate-shimmer]="animation === 'shimmer'"
                  ></div>
                </div>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton-container {
      width: 100%;
    }

    .skeleton {
      background-color: var(--color-neutral-200, #EEEEEE);
      position: relative;
      overflow: hidden;
    }

    /* Pulse animation */
    .skeleton.animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* Shimmer animation */
    .skeleton.animate-shimmer::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%
      );
      transform: translateX(-100%);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Respect reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      .skeleton.animate-pulse {
        animation: none;
      }
      .skeleton.animate-shimmer::after {
        animation: none;
        display: none;
      }
    }

    /* Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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

    /* Circle variant */
    .skeleton-circle {
      border-radius: 9999px;
    }

    /* Rectangle variant */
    .skeleton-rectangle {
      width: 100%;
    }

    /* Avatar variant */
    .skeleton-avatar {
      width: 48px;
      height: 48px;
    }

    .skeleton-avatar-lg {
      width: 100px;
      height: 100px;
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

    /* Badge variant */
    .skeleton-badge {
      width: 60px;
      height: 24px;
    }

    /* List item variant */
    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
    }

    .skeleton-list-item:not(:last-child) {
      border-bottom: 1px solid var(--border-color-light, #F5F5F5);
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

    .rounded-xl {
      border-radius: 1rem;
    }

    /* Flex utilities */
    .flex-shrink-0 {
      flex-shrink: 0;
    }

    /* Button variant */
    .skeleton-button {
      height: 44px;
    }

    /* Input variant */
    .skeleton-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-label {
      height: 0.875rem;
      width: 30%;
    }

    .skeleton-input {
      height: 44px;
    }

    /* Repairer card variant */
    .skeleton-repairer-card {
      padding: 1rem;
      background: var(--bg-surface, white);
      border: 1px solid var(--border-color, #EEEEEE);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .skeleton-repairer-header {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .skeleton-repairer-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .skeleton-repairer-body {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .skeleton-repairer-footer {
      margin-top: 0.25rem;
    }

    .skeleton-meta-row {
      display: flex;
      gap: 0.5rem;
    }

    /* Profile header variant */
    .skeleton-profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
    }

    /* Stats grid variant */
    .skeleton-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .skeleton-stat-card {
      background: var(--bg-surface, white);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .skeleton-stat-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
    }

    .skeleton-stat-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Dashboard card variant */
    .skeleton-dashboard-card {
      background: var(--bg-surface, white);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      margin-bottom: 1rem;
    }

    .skeleton-dashboard-icon {
      width: 52px;
      height: 52px;
    }

    .skeleton-dashboard-info {
      display: flex;
      flex-direction: column;
    }

    /* Request card variant */
    .skeleton-request-card {
      background: var(--bg-surface, white);
      padding: 1rem;
      display: flex;
      align-items: stretch;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 0.75rem;
    }

    .skeleton-status-badge {
      width: 24px;
      height: 100%;
      min-height: 80px;
    }

    .skeleton-request-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-request-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .skeleton-device-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
    }

    .skeleton-device-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .skeleton-person-row {
      height: 36px;
    }

    .skeleton-request-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .skeleton-price-badge {
      width: 80px;
      height: 24px;
    }
  `]
})
export class UiSkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() animation: SkeletonAnimation = 'shimmer';
  @Input() width?: string;
  @Input() height?: string;
  @Input() count = 1;
  @Input() ariaLabel?: string;
  @Input() showLabel = true;

  /** @deprecated Use animation='pulse' instead */
  @Input() set animated(value: boolean) {
    if (value) {
      this.animation = 'pulse';
    }
  }

  get countArray(): number[] {
    return Array(this.count).fill(0);
  }
}

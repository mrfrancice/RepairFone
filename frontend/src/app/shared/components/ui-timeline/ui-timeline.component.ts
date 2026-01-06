import {
  Component,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string | Date;
  time?: string;
  icon?: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  details?: string[];
}

// Alias for backwards compatibility
export type TimelineStep = TimelineItem;

export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelinePosition = 'left' | 'right' | 'alternate';

@Component({
  selector: 'ui-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="timeline"
      [class.vertical]="orientation === 'vertical'"
      [class.horizontal]="orientation === 'horizontal'"
      [class.position-left]="position === 'left'"
      [class.position-right]="position === 'right'"
      [class.position-alternate]="position === 'alternate'"
    >
      @for (item of items; track item.id; let i = $index; let last = $last) {
        <div
          class="timeline-item"
          [class.completed]="item.status === 'completed'"
          [class.current]="item.status === 'current'"
          [class.pending]="item.status === 'pending'"
          [class.error]="item.status === 'error'"
          [class.alternate-right]="position === 'alternate' && i % 2 === 1"
        >
          <!-- Connector Line -->
          @if (!last) {
            <div class="timeline-connector" [class.completed]="item.status === 'completed'"></div>
          }

          <!-- Indicator -->
          <div class="timeline-indicator">
            @if (item.status === 'completed') {
              <svg class="indicator-icon" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            } @else if (item.status === 'error') {
              <svg class="indicator-icon" viewBox="0 0 16 16" fill="none">
                <path d="M8 5V8M8 11H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            } @else if (item.status === 'current') {
              <div class="indicator-pulse"></div>
            } @else if (item.icon) {
              <span class="indicator-emoji">{{ item.icon }}</span>
            } @else {
              <span class="indicator-number">{{ i + 1 }}</span>
            }
          </div>

          <!-- Content -->
          <div class="timeline-content">
            <div class="timeline-header">
              <h4 class="timeline-title">{{ item.title }}</h4>
              @if (item.date || item.time) {
                <span class="timeline-datetime">
                  @if (item.date) {
                    <span class="date">{{ formatDate(item.date) }}</span>
                  }
                  @if (item.time) {
                    <span class="time">{{ item.time }}</span>
                  }
                </span>
              }
            </div>

            @if (item.description) {
              <p class="timeline-description">{{ item.description }}</p>
            }

            @if (item.details && item.details.length > 0) {
              <ul class="timeline-details">
                @for (detail of item.details; track detail) {
                  <li>{{ detail }}</li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline {
      position: relative;
    }

    /* Vertical Timeline */
    .timeline.vertical {
      display: flex;
      flex-direction: column;
    }

    .timeline.vertical .timeline-item {
      display: flex;
      gap: 1rem;
      position: relative;
      padding-bottom: 1.5rem;
    }

    .timeline.vertical .timeline-item:last-child {
      padding-bottom: 0;
    }

    /* Connector */
    .timeline.vertical .timeline-connector {
      position: absolute;
      left: 15px;
      top: 32px;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline.vertical .timeline-connector.completed {
      background: #16a34a;
    }

    /* Indicator */
    .timeline-indicator {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .timeline-item.completed .timeline-indicator {
      background: #16a34a;
      color: white;
    }

    .timeline-item.current .timeline-indicator {
      background: #2563eb;
      color: white;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
    }

    .timeline-item.pending .timeline-indicator {
      background: #f3f4f6;
      color: #9ca3af;
    }

    .timeline-item.error .timeline-indicator {
      background: #dc2626;
      color: white;
    }

    .indicator-icon {
      width: 16px;
      height: 16px;
    }

    .indicator-number {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .indicator-emoji {
      font-size: 1rem;
    }

    .indicator-pulse {
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Content */
    .timeline-content {
      flex: 1;
      min-width: 0;
      padding-top: 4px;
    }

    .timeline-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .timeline-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .timeline-item.pending .timeline-title {
      color: #9ca3af;
    }

    .timeline-datetime {
      display: flex;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .timeline-description {
      font-size: 0.8125rem;
      color: #6b7280;
      margin: 0.375rem 0 0;
      line-height: 1.5;
    }

    .timeline-details {
      margin: 0.5rem 0 0;
      padding-left: 1rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .timeline-details li {
      margin-bottom: 0.25rem;
    }

    /* Position Variants */
    .timeline.position-right .timeline-item {
      flex-direction: row-reverse;
      text-align: right;
    }

    .timeline.position-right .timeline-connector {
      left: auto;
      right: 15px;
    }

    .timeline.position-alternate .timeline-item.alternate-right {
      flex-direction: row-reverse;
      text-align: right;
    }

    .timeline.position-alternate .timeline-item.alternate-right .timeline-connector {
      left: auto;
      right: 15px;
    }

    /* Horizontal Timeline */
    .timeline.horizontal {
      display: flex;
      overflow-x: auto;
      padding: 1rem 0;
    }

    .timeline.horizontal .timeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;
      position: relative;
      flex: 1;
    }

    .timeline.horizontal .timeline-connector {
      position: absolute;
      top: 15px;
      left: calc(50% + 16px);
      right: calc(-50% + 16px);
      height: 2px;
      background: #e5e7eb;
    }

    .timeline.horizontal .timeline-connector.completed {
      background: #16a34a;
    }

    .timeline.horizontal .timeline-content {
      text-align: center;
      padding: 0.75rem 0.5rem 0;
    }

    .timeline.horizontal .timeline-header {
      flex-direction: column;
      align-items: center;
    }

    .timeline.horizontal .timeline-title {
      font-size: 0.8125rem;
    }

    .timeline.horizontal .timeline-description {
      font-size: 0.75rem;
    }
  `],
})
export class UiTimelineComponent {
  @Input() items: TimelineItem[] = [];
  @Input() orientation: TimelineOrientation = 'vertical';
  @Input() position: TimelinePosition = 'left';
  @Input() currentStatus?: string;

  // Alias for backwards compatibility
  @Input() set steps(value: TimelineItem[]) {
    this.items = value;
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }
}

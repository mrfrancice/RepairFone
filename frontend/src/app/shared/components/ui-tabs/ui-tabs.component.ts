import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabItem } from '../../models';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs">
      @for (tab of tabs; track tab.id) {
        <button
          class="tab"
          [class.active]="tab.id === activeTab"
          (click)="selectTab(tab.id)"
        >
          @if (tab.icon) {
            <span class="tab-icon">{{ tab.icon }}</span>
          }
          <span class="tab-label">{{ tab.label }}</span>
          @if (tab.badge) {
            <span class="tab-badge">{{ tab.badge }}</span>
          }
        </button>
      }
      <div class="tab-indicator" [style.left]="indicatorLeft" [style.width]="indicatorWidth"></div>
    </div>
  `,
  styles: [`
    .tabs {
      display: flex;
      position: relative;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem 1rem;
      background: none;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      z-index: 1;
    }

    .tab:hover:not(.active) {
      color: #374151;
    }

    .tab.active {
      color: #1f2937;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-badge {
      background: #dc2626;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      min-width: 18px;
      text-align: center;
    }

    .tab-indicator {
      position: absolute;
      bottom: 4px;
      height: calc(100% - 8px);
      background: white;
      border-radius: 6px;
      transition: all 0.2s ease;
      z-index: 0;
      display: none;
    }
  `]
})
export class UiTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab = '';

  @Output() tabChange = new EventEmitter<string>();

  indicatorLeft = '0';
  indicatorWidth = '0';

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }
}

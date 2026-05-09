import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabItem } from '../../models';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist" [attr.aria-label]="ariaLabel || 'Onglets'">
      @for (tab of tabs; track tab.id; let i = $index) {
        <button
          class="tab"
          [class.active]="tab.id === activeTab"
          (click)="selectTab(tab.id)"
          (keydown)="onKeyDown($event, i)"
          role="tab"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="tab.id === activeTab"
          [attr.aria-controls]="'tabpanel-' + tab.id"
          [attr.tabindex]="tab.id === activeTab ? 0 : -1"
        >
          @if (tab.icon) {
            <span class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
          }
          <span class="tab-label">{{ tab.label }}</span>
          @if (tab.badge) {
            <span class="tab-badge" [attr.aria-label]="tab.badge + ' notifications'">{{ tab.badge }}</span>
          }
        </button>
      }
      <div class="tab-indicator" [style.left]="indicatorLeft" [style.width]="indicatorWidth" aria-hidden="true"></div>
    </div>
  `,
  styles: [`
    .tabs {
      display: flex;
      position: relative;
      background: var(--color-neutral-100, #F5F5F5);
      border-radius: 0.75rem;
      padding: 4px;
      gap: 4px;
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 1.125rem;
      min-height: 48px;
      background: none;
      border: none;
      border-radius: 0.5rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-neutral-600, #4B5563);
      cursor: pointer;
      transition: all 150ms ease;
      position: relative;
      z-index: 1;
    }

    .tab:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: -2px;
    }

    .tab:hover:not(.active) {
      color: var(--color-neutral-800, #1F2937);
    }

    .tab.active {
      color: var(--color-primary-500, #FF9800);
      background: white;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-badge {
      background: var(--color-error, #F44336);
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
      background: var(--bg-surface, white);
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
  @Input() ariaLabel?: string;

  @Output() tabChange = new EventEmitter<string>();

  indicatorLeft = '0';
  indicatorWidth = '0';

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }

  onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const newTab = this.tabs[newIndex];
    if (newTab) {
      this.selectTab(newTab.id);
      // Focus the new tab button
      const tabButton = document.getElementById('tab-' + newTab.id);
      tabButton?.focus();
    }
  }
}

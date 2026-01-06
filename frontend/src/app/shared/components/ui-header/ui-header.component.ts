import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ui-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="header-top">
        <div class="header-left">
          @if (showBack) {
            @if (backRoute) {
              <a [routerLink]="backRoute" class="back-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            } @else {
              <button class="back-btn" (click)="goBack()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            }
          }
          @if (showIcon) {
            <div class="header-icon">
              <ng-content select="[header-icon]"></ng-content>
            </div>
          }
          <div class="header-titles">
            <h1 class="app-title">{{ title }}</h1>
            @if (subtitle) {
              <p class="welcome-msg">{{ subtitle }}</p>
            }
          </div>
        </div>
        <div class="header-right">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>
      <ng-content></ng-content>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      padding: 1.25rem 1.25rem 1.75rem;
      padding-top: calc(1.25rem + env(safe-area-inset-top, 0));
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .header-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0;
      line-height: 1.2;
    }

    .welcome-msg {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }
  `]
})
export class UiHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() showBack = false;
  @Input() backRoute?: string;
  @Input() showIcon = false;

  @Output() onBack = new EventEmitter<void>();

  constructor(private location: Location) {}

  goBack(): void {
    if (this.onBack.observed) {
      this.onBack.emit();
    } else {
      this.location.back();
    }
  }
}

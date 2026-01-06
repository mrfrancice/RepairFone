import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type BottomSheetSize = 'auto' | 'half' | 'full';

@Component({
  selector: 'ui-bottom-sheet',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="bottom-sheet-overlay" (click)="onBackdropClick()" [@fadeIn]>
        <div
          class="bottom-sheet-container"
          [class.size-auto]="size === 'auto'"
          [class.size-half]="size === 'half'"
          [class.size-full]="size === 'full'"
          [class.dragging]="isDragging()"
          [style.transform]="'translateY(' + dragOffset() + 'px)'"
          (click)="$event.stopPropagation()"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd()"
        >
          <!-- Drag Handle -->
          @if (showHandle) {
            <div class="drag-handle-container">
              <div class="drag-handle"></div>
            </div>
          }

          <!-- Header -->
          @if (title || showCloseButton) {
            <div class="bottom-sheet-header">
              @if (title) {
                <h3 class="bottom-sheet-title">{{ title }}</h3>
              }
              @if (subtitle) {
                <p class="bottom-sheet-subtitle">{{ subtitle }}</p>
              }
              @if (showCloseButton) {
                <button class="close-button" (click)="close()" aria-label="Fermer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              }
            </div>
          }

          <!-- Content -->
          <div class="bottom-sheet-content" [class.has-footer]="hasFooter">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          @if (hasFooter) {
            <div class="bottom-sheet-footer">
              <ng-content select="[bottom-sheet-footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .bottom-sheet-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .bottom-sheet-container {
      width: 100%;
      max-width: 500px;
      background: white;
      border-radius: 20px 20px 0 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease-out;
      transition: transform 0.1s ease-out;
      max-height: 90vh;
      touch-action: none;
    }

    .bottom-sheet-container.dragging {
      transition: none;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    /* Size variants */
    .bottom-sheet-container.size-auto {
      max-height: 85vh;
    }

    .bottom-sheet-container.size-half {
      height: 50vh;
      max-height: 50vh;
    }

    .bottom-sheet-container.size-full {
      height: 90vh;
      max-height: 90vh;
    }

    /* Drag Handle */
    .drag-handle-container {
      display: flex;
      justify-content: center;
      padding: 12px 0 8px;
      cursor: grab;
    }

    .drag-handle-container:active {
      cursor: grabbing;
    }

    .drag-handle {
      width: 40px;
      height: 4px;
      background: #d1d5db;
      border-radius: 2px;
    }

    /* Header */
    .bottom-sheet-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      position: relative;
    }

    .bottom-sheet-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      padding-right: 2.5rem;
    }

    .bottom-sheet-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0.25rem 0 0;
    }

    .close-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .close-button:hover {
      background: #e5e7eb;
      color: #374151;
    }

    /* Content */
    .bottom-sheet-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      overscroll-behavior: contain;
    }

    .bottom-sheet-content.has-footer {
      padding-bottom: 0.5rem;
    }

    /* Footer */
    .bottom-sheet-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #e5e7eb;
      background: white;
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
    }

    /* Safe area for notch devices */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .bottom-sheet-container {
        padding-bottom: env(safe-area-inset-bottom);
      }
    }

    /* Desktop adjustments */
    @media (min-width: 640px) {
      .bottom-sheet-overlay {
        align-items: center;
        padding: 1rem;
      }

      .bottom-sheet-container {
        border-radius: 16px;
        max-height: 80vh;
      }

      .bottom-sheet-container.size-half {
        height: auto;
        max-height: 50vh;
      }

      .bottom-sheet-container.size-full {
        height: auto;
        max-height: 80vh;
      }

      .drag-handle-container {
        display: none;
      }
    }
  `],
})
export class UiBottomSheetComponent implements OnDestroy {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() size: BottomSheetSize = 'auto';
  @Input() showHandle = true;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() hasFooter = false;
  @Input() dismissThreshold = 100; // pixels to drag before dismissing

  @Output() onClose = new EventEmitter<void>();

  readonly isDragging = signal(false);
  readonly dragOffset = signal(0);

  private startY = 0;
  private currentY = 0;

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close(): void {
    this.onClose.emit();
  }

  onTouchStart(event: TouchEvent): void {
    this.startY = event.touches[0].clientY;
    this.currentY = this.startY;
    this.isDragging.set(true);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging()) return;

    this.currentY = event.touches[0].clientY;
    const delta = this.currentY - this.startY;

    // Only allow dragging down
    if (delta > 0) {
      this.dragOffset.set(delta);
    }
  }

  onTouchEnd(): void {
    if (!this.isDragging()) return;

    this.isDragging.set(false);

    if (this.dragOffset() > this.dismissThreshold) {
      this.close();
    }

    this.dragOffset.set(0);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}

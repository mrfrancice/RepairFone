import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  inject,
} from '@angular/core';

export interface PullToRefreshConfig {
  threshold?: number;
  maxPullDistance?: number;
  resistance?: number;
  indicatorColor?: string;
  indicatorSize?: number;
}

/**
 * PullToRefreshDirective - Implements pull-to-refresh functionality
 * Emits a 'refresh' event when user pulls down beyond the threshold
 * Shows a visual indicator during pull with customizable styling
 * Uses touch events to detect pull gesture
 *
 * Usage:
 * <div appPullToRefresh
 *      [threshold]="80"
 *      [enabled]="true"
 *      (refresh)="handleRefresh()">
 *   Content
 * </div>
 */
@Directive({
  selector: '[appPullToRefresh]',
  standalone: true,
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Threshold in pixels to trigger refresh
   */
  @Input() threshold = 80;

  /**
   * Maximum distance the content can be pulled down
   */
  @Input() maxPullDistance = 150;

  /**
   * Resistance factor (0-1), higher = more resistance
   */
  @Input() resistance = 0.5;

  /**
   * Whether pull-to-refresh is enabled
   */
  @Input() enabled = true;

  /**
   * Color of the refresh indicator
   */
  @Input() indicatorColor = '#3b82f6';

  /**
   * Size of the refresh indicator in pixels
   */
  @Input() indicatorSize = 40;

  /**
   * Emitted when refresh is triggered
   */
  @Output() refresh = new EventEmitter<void>();

  /**
   * Emitted when pull state changes
   */
  @Output() pullStateChange = new EventEmitter<{
    isPulling: boolean;
    distance: number;
    canRefresh: boolean;
  }>();

  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private canRefresh = false;
  private isRefreshing = false;
  private scrollContainer: HTMLElement | null = null;
  private indicatorElement: HTMLElement | null = null;

  private touchStartListener: (() => void) | null = null;
  private touchMoveListener: (() => void) | null = null;
  private touchEndListener: (() => void) | null = null;

  ngOnInit(): void {
    if (!this.enabled) {
      return;
    }

    this.setupContainer();
    this.createIndicator();
    this.attachListeners();
  }

  ngOnDestroy(): void {
    this.detachListeners();
    this.removeIndicator();
  }

  /**
   * Setup the container with necessary styles
   */
  private setupContainer(): void {
    const nativeElement = this.element.nativeElement as HTMLElement;
    this.scrollContainer = nativeElement;

    this.renderer.setStyle(nativeElement, 'position', 'relative');
    this.renderer.setStyle(nativeElement, 'overflow-y', 'auto');
    this.renderer.setStyle(nativeElement, 'overscroll-behavior-y', 'contain');
    this.renderer.setStyle(nativeElement, 'touch-action', 'pan-y');
  }

  /**
   * Create the refresh indicator element
   */
  private createIndicator(): void {
    this.indicatorElement = this.renderer.createElement('div');

    this.renderer.addClass(this.indicatorElement, 'pull-to-refresh-indicator');
    this.renderer.setStyle(this.indicatorElement, 'position', 'absolute');
    this.renderer.setStyle(this.indicatorElement, 'top', '-60px');
    this.renderer.setStyle(this.indicatorElement, 'left', '50%');
    this.renderer.setStyle(this.indicatorElement, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(this.indicatorElement, 'width', `${this.indicatorSize}px`);
    this.renderer.setStyle(this.indicatorElement, 'height', `${this.indicatorSize}px`);
    this.renderer.setStyle(this.indicatorElement, 'display', 'flex');
    this.renderer.setStyle(this.indicatorElement, 'align-items', 'center');
    this.renderer.setStyle(this.indicatorElement, 'justify-content', 'center');
    this.renderer.setStyle(this.indicatorElement, 'transition', 'opacity 0.2s, transform 0.2s');
    this.renderer.setStyle(this.indicatorElement, 'opacity', '0');
    this.renderer.setStyle(this.indicatorElement, 'z-index', '1000');

    // Create spinner
    const spinner = this.renderer.createElement('div');
    this.renderer.setStyle(spinner, 'width', '24px');
    this.renderer.setStyle(spinner, 'height', '24px');
    this.renderer.setStyle(spinner, 'border', `3px solid ${this.indicatorColor}33`);
    this.renderer.setStyle(spinner, 'border-top-color', this.indicatorColor);
    this.renderer.setStyle(spinner, 'border-radius', '50%');
    this.renderer.setStyle(spinner, 'animation', 'spin 0.8s linear infinite');

    this.renderer.appendChild(this.indicatorElement, spinner);
    this.renderer.appendChild(this.scrollContainer, this.indicatorElement);

    // Add keyframes for spinner animation
    this.addSpinnerAnimation();
  }

  /**
   * Add CSS animation for spinner
   */
  private addSpinnerAnimation(): void {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (error) {
      // Keyframes might already exist
    }
  }

  /**
   * Remove the indicator element
   */
  private removeIndicator(): void {
    if (this.indicatorElement && this.scrollContainer) {
      this.renderer.removeChild(this.scrollContainer, this.indicatorElement);
      this.indicatorElement = null;
    }
  }

  /**
   * Attach touch event listeners
   */
  private attachListeners(): void {
    if (!this.scrollContainer) return;

    this.touchStartListener = this.renderer.listen(
      this.scrollContainer,
      'touchstart',
      this.onTouchStart.bind(this)
    );

    this.touchMoveListener = this.renderer.listen(
      this.scrollContainer,
      'touchmove',
      this.onTouchMove.bind(this)
    );

    this.touchEndListener = this.renderer.listen(
      this.scrollContainer,
      'touchend',
      this.onTouchEnd.bind(this)
    );
  }

  /**
   * Detach touch event listeners
   */
  private detachListeners(): void {
    if (this.touchStartListener) this.touchStartListener();
    if (this.touchMoveListener) this.touchMoveListener();
    if (this.touchEndListener) this.touchEndListener();
  }

  /**
   * Handle touch start event
   */
  private onTouchStart(event: TouchEvent): void {
    if (!this.enabled || this.isRefreshing || !this.scrollContainer) {
      return;
    }

    const scrollTop = this.scrollContainer.scrollTop;

    if (scrollTop === 0) {
      this.startY = event.touches[0].clientY;
      this.isPulling = true;
    }
  }

  /**
   * Handle touch move event
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.isPulling || !this.enabled || this.isRefreshing) {
      return;
    }

    this.currentY = event.touches[0].clientY;
    const distance = this.currentY - this.startY;

    if (distance > 0) {
      event.preventDefault();

      // Apply resistance
      const resistedDistance = Math.min(
        distance * this.resistance,
        this.maxPullDistance
      );

      this.canRefresh = resistedDistance >= this.threshold;

      this.updateIndicator(resistedDistance);
      this.updateContentPosition(resistedDistance);

      this.pullStateChange.emit({
        isPulling: true,
        distance: resistedDistance,
        canRefresh: this.canRefresh,
      });
    }
  }

  /**
   * Handle touch end event
   */
  private onTouchEnd(): void {
    if (!this.isPulling || !this.enabled) {
      return;
    }

    this.isPulling = false;

    if (this.canRefresh && !this.isRefreshing) {
      this.triggerRefresh();
    } else {
      this.resetPosition();
    }

    this.pullStateChange.emit({
      isPulling: false,
      distance: 0,
      canRefresh: false,
    });
  }

  /**
   * Update indicator position and opacity
   */
  private updateIndicator(distance: number): void {
    if (!this.indicatorElement) return;

    const progress = Math.min(distance / this.threshold, 1);
    const translateY = -60 + distance;

    this.renderer.setStyle(
      this.indicatorElement,
      'transform',
      `translateX(-50%) translateY(${translateY}px) scale(${progress})`
    );
    this.renderer.setStyle(this.indicatorElement, 'opacity', progress.toString());
  }

  /**
   * Update content position during pull
   */
  private updateContentPosition(distance: number): void {
    if (!this.scrollContainer) return;

    this.renderer.setStyle(
      this.scrollContainer,
      'transform',
      `translateY(${distance}px)`
    );
  }

  /**
   * Trigger refresh
   */
  private triggerRefresh(): void {
    this.isRefreshing = true;
    this.canRefresh = false;

    if (this.indicatorElement) {
      this.renderer.setStyle(this.indicatorElement, 'opacity', '1');
    }

    if (this.scrollContainer) {
      this.renderer.setStyle(
        this.scrollContainer,
        'transform',
        `translateY(${this.threshold}px)`
      );
      this.renderer.setStyle(
        this.scrollContainer,
        'transition',
        'transform 0.2s ease-out'
      );
    }

    this.refresh.emit();
  }

  /**
   * Reset position after pull
   */
  private resetPosition(): void {
    if (this.scrollContainer) {
      this.renderer.setStyle(this.scrollContainer, 'transform', 'translateY(0)');
      this.renderer.setStyle(
        this.scrollContainer,
        'transition',
        'transform 0.2s ease-out'
      );
    }

    if (this.indicatorElement) {
      this.renderer.setStyle(this.indicatorElement, 'opacity', '0');
    }

    setTimeout(() => {
      if (this.scrollContainer) {
        this.renderer.removeStyle(this.scrollContainer, 'transition');
      }
    }, 200);
  }

  /**
   * Complete the refresh (call this after refresh is done)
   */
  completeRefresh(): void {
    this.isRefreshing = false;
    this.resetPosition();
  }
}

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

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeEvent {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  duration: number;
}

/**
 * SwipeDirective - Detects swipe gestures on touch devices
 * Emits swipeLeft, swipeRight, swipeUp, and swipeDown events
 * Configurable minimum distance and velocity thresholds
 * Uses touch events for accurate gesture detection
 *
 * Usage:
 * <div appSwipe
 *      [swipeEnabled]="true"
 *      [minDistance]="50"
 *      [maxTime]="300"
 *      (swipeLeft)="handleSwipeLeft($event)"
 *      (swipeRight)="handleSwipeRight($event)">
 *   Swipeable content
 * </div>
 */
@Directive({
  selector: '[appSwipe]',
  standalone: true,
})
export class SwipeDirective implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Whether swipe detection is enabled
   */
  @Input() swipeEnabled = true;

  /**
   * Minimum distance in pixels to register a swipe
   */
  @Input() minDistance = 50;

  /**
   * Maximum time in milliseconds for a swipe gesture
   */
  @Input() maxTime = 300;

  /**
   * Minimum velocity (px/ms) to register a swipe
   */
  @Input() minVelocity = 0.3;

  /**
   * Whether to detect vertical swipes (up/down)
   */
  @Input() detectVertical = false;

  /**
   * Whether to detect horizontal swipes (left/right)
   */
  @Input() detectHorizontal = true;

  /**
   * Emitted when a swipe left gesture is detected
   */
  @Output() swipeLeft = new EventEmitter<SwipeEvent>();

  /**
   * Emitted when a swipe right gesture is detected
   */
  @Output() swipeRight = new EventEmitter<SwipeEvent>();

  /**
   * Emitted when a swipe up gesture is detected
   */
  @Output() swipeUp = new EventEmitter<SwipeEvent>();

  /**
   * Emitted when a swipe down gesture is detected
   */
  @Output() swipeDown = new EventEmitter<SwipeEvent>();

  /**
   * Emitted when any swipe gesture is detected
   */
  @Output() swipe = new EventEmitter<SwipeEvent>();

  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isSwiping = false;

  private touchStartListener: (() => void) | null = null;
  private touchMoveListener: (() => void) | null = null;
  private touchEndListener: (() => void) | null = null;
  private touchCancelListener: (() => void) | null = null;

  ngOnInit(): void {
    if (!this.swipeEnabled) {
      return;
    }

    this.attachListeners();
  }

  ngOnDestroy(): void {
    this.detachListeners();
  }

  /**
   * Attach touch event listeners
   */
  private attachListeners(): void {
    const nativeElement = this.element.nativeElement as HTMLElement;

    this.touchStartListener = this.renderer.listen(
      nativeElement,
      'touchstart',
      this.onTouchStart.bind(this)
    );

    this.touchMoveListener = this.renderer.listen(
      nativeElement,
      'touchmove',
      this.onTouchMove.bind(this)
    );

    this.touchEndListener = this.renderer.listen(
      nativeElement,
      'touchend',
      this.onTouchEnd.bind(this)
    );

    this.touchCancelListener = this.renderer.listen(
      nativeElement,
      'touchcancel',
      this.onTouchCancel.bind(this)
    );
  }

  /**
   * Detach touch event listeners
   */
  private detachListeners(): void {
    if (this.touchStartListener) this.touchStartListener();
    if (this.touchMoveListener) this.touchMoveListener();
    if (this.touchEndListener) this.touchEndListener();
    if (this.touchCancelListener) this.touchCancelListener();
  }

  /**
   * Handle touch start event
   */
  private onTouchStart(event: TouchEvent): void {
    if (!this.swipeEnabled) {
      return;
    }

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isSwiping = true;
  }

  /**
   * Handle touch move event
   * Can be used to provide visual feedback during swipe
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.isSwiping || !this.swipeEnabled) {
      return;
    }

    // Optional: Add visual feedback during swipe
    // For now, we just track the gesture
  }

  /**
   * Handle touch end event
   */
  private onTouchEnd(event: TouchEvent): void {
    if (!this.isSwiping || !this.swipeEnabled) {
      return;
    }

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    this.detectSwipe(endX, endY, endTime);
    this.isSwiping = false;
  }

  /**
   * Handle touch cancel event
   */
  private onTouchCancel(): void {
    this.isSwiping = false;
  }

  /**
   * Detect and emit swipe events based on touch coordinates
   */
  private detectSwipe(endX: number, endY: number, endTime: number): void {
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const duration = endTime - this.startTime;

    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);

    const velocityX = distanceX / duration;
    const velocityY = distanceY / duration;

    // Check if duration is within max time
    if (duration > this.maxTime) {
      return;
    }

    // Determine primary direction (horizontal or vertical)
    const isHorizontal = distanceX > distanceY;

    if (isHorizontal && this.detectHorizontal) {
      // Horizontal swipe
      if (distanceX >= this.minDistance && velocityX >= this.minVelocity) {
        const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left';
        const swipeEvent: SwipeEvent = {
          direction,
          distance: distanceX,
          velocity: velocityX,
          duration,
        };

        this.swipe.emit(swipeEvent);

        if (direction === 'left') {
          this.swipeLeft.emit(swipeEvent);
        } else {
          this.swipeRight.emit(swipeEvent);
        }
      }
    } else if (!isHorizontal && this.detectVertical) {
      // Vertical swipe
      if (distanceY >= this.minDistance && velocityY >= this.minVelocity) {
        const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up';
        const swipeEvent: SwipeEvent = {
          direction,
          distance: distanceY,
          velocity: velocityY,
          duration,
        };

        this.swipe.emit(swipeEvent);

        if (direction === 'up') {
          this.swipeUp.emit(swipeEvent);
        } else {
          this.swipeDown.emit(swipeEvent);
        }
      }
    }
  }

  /**
   * Enable swipe detection
   */
  enable(): void {
    this.swipeEnabled = true;
  }

  /**
   * Disable swipe detection
   */
  disable(): void {
    this.swipeEnabled = false;
    this.isSwiping = false;
  }
}

import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';

/**
 * Directive for infinite scroll / load more functionality
 *
 * Usage:
 * ```html
 * <div class="list-container"
 *      appInfiniteScroll
 *      [threshold]="100"
 *      [disabled]="isLoading() || !hasMore()"
 *      (scrolled)="loadMore()">
 *   <!-- List items -->
 * </div>
 * ```
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Distance from bottom (in pixels) to trigger the event (default: 100px) */
  @Input() threshold = 100;

  /** Disable the infinite scroll (e.g., when loading or no more items) */
  @Input() disabled = false;

  /** Use window scroll instead of element scroll */
  @Input() useWindow = false;

  /** Event emitted when scrolled near bottom */
  @Output() scrolled = new EventEmitter<void>();

  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLDivElement | null = null;

  ngOnInit(): void {
    if (this.useWindow) {
      this.setupWindowScroll();
    } else {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupIntersectionObserver(): void {
    // Create a sentinel element at the bottom
    this.sentinel = document.createElement('div');
    this.sentinel.style.height = '1px';
    this.sentinel.style.width = '100%';
    this.elementRef.nativeElement.appendChild(this.sentinel);

    // Create observer
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.disabled) {
          this.scrolled.emit();
        }
      },
      {
        root: this.elementRef.nativeElement,
        rootMargin: `${this.threshold}px`,
        threshold: 0,
      }
    );

    this.observer.observe(this.sentinel);
  }

  private setupWindowScroll(): void {
    window.addEventListener('scroll', this.onWindowScroll.bind(this), { passive: true });
  }

  private onWindowScroll(): void {
    if (this.disabled) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - scrollTop - clientHeight <= this.threshold) {
      this.scrolled.emit();
    }
  }

  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.sentinel && this.sentinel.parentNode) {
      this.sentinel.parentNode.removeChild(this.sentinel);
      this.sentinel = null;
    }

    if (this.useWindow) {
      window.removeEventListener('scroll', this.onWindowScroll.bind(this));
    }
  }
}

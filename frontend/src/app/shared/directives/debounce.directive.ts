import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';

/**
 * Directive to debounce input events
 *
 * Usage:
 * ```html
 * <input appDebounce [debounceTime]="300" (debounced)="onSearch($event)" />
 * ```
 */
@Directive({
  selector: '[appDebounce]',
  standalone: true,
})
export class DebounceDirective implements OnDestroy {
  /** Debounce time in milliseconds (default: 300ms) */
  @Input() debounceTime = 300;

  /** Event emitted after debounce period */
  @Output() debounced = new EventEmitter<Event>();

  private readonly subject = new Subject<Event>();
  private subscription: Subscription;

  constructor() {
    this.subscription = this.subject
      .pipe(debounceTime(this.debounceTime))
      .subscribe((event) => this.debounced.emit(event));
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    this.subject.next(event);
  }

  @HostListener('keyup', ['$event'])
  onKeyup(event: Event): void {
    this.subject.next(event);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

/**
 * Directive to debounce click events
 *
 * Usage:
 * ```html
 * <button appDebounceClick [debounceTime]="500" (debounced)="onClick()">Submit</button>
 * ```
 */
@Directive({
  selector: '[appDebounceClick]',
  standalone: true,
})
export class DebounceClickDirective implements OnDestroy {
  /** Debounce time in milliseconds (default: 500ms) */
  @Input() debounceTime = 500;

  /** Event emitted after debounce period */
  @Output() debounced = new EventEmitter<MouseEvent>();

  private readonly subject = new Subject<MouseEvent>();
  private subscription: Subscription;

  constructor() {
    this.subscription = this.subject
      .pipe(debounceTime(this.debounceTime))
      .subscribe((event) => this.debounced.emit(event));
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.subject.next(event);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

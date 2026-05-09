import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';

/**
 * Directive to detect clicks outside an element
 *
 * Usage:
 * ```html
 * <div class="dropdown"
 *      appClickOutside
 *      [clickOutsideEnabled]="isOpen"
 *      (clickOutside)="close()">
 *   <!-- Dropdown content -->
 * </div>
 * ```
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Enable/disable the click outside detection */
  @Input() clickOutsideEnabled = true;

  /** Elements to exclude from click outside detection (CSS selectors) */
  @Input() clickOutsideExclude: string[] = [];

  /** Event emitted when clicked outside */
  @Output() clickOutside = new EventEmitter<MouseEvent>();

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.clickOutsideEnabled) return;

    const target = event.target as HTMLElement;

    // Check if click is inside the element
    if (this.elementRef.nativeElement.contains(target)) {
      return;
    }

    // Check if click is on an excluded element
    if (this.isExcluded(target)) {
      return;
    }

    this.clickOutside.emit(event);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.clickOutsideEnabled) return;
    this.clickOutside.emit();
  }

  private isExcluded(target: HTMLElement): boolean {
    if (this.clickOutsideExclude.length === 0) return false;

    return this.clickOutsideExclude.some((selector) => {
      const excludedElements = document.querySelectorAll(selector);
      return Array.from(excludedElements).some((el) => el.contains(target));
    });
  }
}

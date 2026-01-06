import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="modal-backdrop"
           (click)="onBackdropClick($event)"
           (keydown)="onKeyDown($event)"
           role="presentation">
        <div class="modal"
             #modalElement
             [class]="'modal-' + size"
             role="dialog"
             aria-modal="true"
             [attr.aria-labelledby]="title ? modalTitleId : null"
             [attr.aria-label]="!title ? ariaLabel : null"
             tabindex="-1">
          <div class="modal-header">
            @if (title) {
              <h2 class="modal-title" [id]="modalTitleId">{{ title }}</h2>
            }
            @if (closable) {
              <button class="modal-close"
                      (click)="close()"
                      aria-label="Fermer la fenetre modale"
                      type="button">✕</button>
            }
          </div>

          <div class="modal-body">
            <ng-content></ng-content>
          </div>

          <div class="modal-footer">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-sm { max-width: 400px; }
    .modal-md { max-width: 500px; }
    .modal-lg { max-width: 700px; }
    .modal-xl { max-width: 900px; }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      transition: color 0.2s;
    }

    .modal-close:hover {
      color: #1f2937;
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .modal-footer:empty {
      display: none;
    }
  `]
})
export class UiModalComponent implements OnChanges, OnDestroy, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() closable = true;
  @Input() closeOnBackdrop = true;
  @Input() ariaLabel = 'Fenetre modale';

  @Output() onClose = new EventEmitter<void>();

  @ViewChild('modalElement') modalElement?: ElementRef<HTMLElement>;

  /** Unique ID for the modal title element for aria-labelledby */
  readonly modalTitleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`;

  private focusTrap: FocusTrap | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.setupFocusTrap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Store the currently focused element to restore later
        if (isPlatformBrowser(this.platformId)) {
          this.previouslyFocusedElement = document.activeElement as HTMLElement;
        }
        // Need to wait for the view to render before setting up focus trap
        setTimeout(() => this.setupFocusTrap(), 0);
      } else {
        this.destroyFocusTrap();
        this.restoreFocus();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyFocusTrap();
  }

  close(): void {
    this.onClose.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closable) {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  private setupFocusTrap(): void {
    if (!isPlatformBrowser(this.platformId) || !this.modalElement?.nativeElement) {
      return;
    }

    // Create focus trap
    this.focusTrap = this.focusTrapFactory.create(this.modalElement.nativeElement);

    // Activate the focus trap and focus the first tabbable element
    this.focusTrap.focusInitialElementWhenReady().then(focused => {
      // If no focusable element was found, focus the modal container itself
      if (!focused) {
        this.modalElement?.nativeElement.focus();
      }
    });
  }

  private destroyFocusTrap(): void {
    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = null;
    }
  }

  private restoreFocus(): void {
    if (isPlatformBrowser(this.platformId) && this.previouslyFocusedElement) {
      // Restore focus to the element that was focused before the modal opened
      setTimeout(() => {
        this.previouslyFocusedElement?.focus();
        this.previouslyFocusedElement = null;
      }, 0);
    }
  }
}

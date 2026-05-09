import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-input-wrapper" [class.focused]="isFocused()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <input
        type="text"
        [placeholder]="placeholder"
        [(ngModel)]="searchValue"
        (input)="onInput()"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown.enter)="onSubmit()"
        (keydown.escape)="onClear()"
        autocomplete="off"
      />
      @if (searchValue) {
        <button class="clear-search" (click)="onClear()" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    .search-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--color-neutral-100, #F5F5F5);
      border: 1.5px solid var(--color-neutral-200, #EEEEEE);
      border-radius: 12px;
      padding: 0.625rem 1rem;
      margin-top: 1rem;
      transition: all 150ms ease;
    }

    .search-input-wrapper.focused,
    .search-input-wrapper:focus-within {
      background: white;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.12);
    }

    .search-input-wrapper svg {
      color: var(--color-neutral-500, #6B7280);
      flex-shrink: 0;
    }

    .search-input-wrapper input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Inter', sans-serif;
      font-size: 0.9375rem;
      color: var(--color-neutral-900, #111827);
      min-width: 0;
    }

    .search-input-wrapper input::placeholder {
      color: var(--color-neutral-500, #6B7280);
    }

    .clear-search {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: none;
      background: var(--color-neutral-200, #EEEEEE);
      color: var(--color-neutral-700, #374151);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 150ms ease;
      flex-shrink: 0;
    }

    .clear-search:hover {
      background: var(--color-neutral-300, #D1D5DB);
    }
  `],
})
export class HeaderSearchComponent implements OnInit {
  @Input() placeholder = 'Rechercher...';
  @Input() debounceMs = 300;

  @Output() search = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  readonly isFocused = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  searchValue = '';
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(this.debounceMs),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        this.search.emit(value);
      });
  }

  onInput(): void {
    this.searchChange.emit(this.searchValue);
    this.searchSubject.next(this.searchValue);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
  }

  onSubmit(): void {
    this.search.emit(this.searchValue);
  }

  onClear(): void {
    this.searchValue = '';
    this.searchChange.emit('');
    this.search.emit('');
    this.cleared.emit();
  }
}
